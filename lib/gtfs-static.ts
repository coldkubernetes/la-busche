import AdmZip from 'adm-zip';
import Papa from 'papaparse';

const STATIC_GTFS_URL = 'https://gtfs.sofiatraffic.bg/api/v1/static';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
// Past the TTL we keep serving the stale schedule and refresh in the
// background (realtime delays are fetched fresh per request regardless).
// Past the hard TTL the schedule is too old to trust and we block on a fetch.
const HARD_TTL_MS = 48 * 60 * 60 * 1000;

export interface Stop {
  stop_id: string;
  stop_name: string;
}

export interface Route {
  route_id: string;
  route_short_name: string;
  route_type: number; // 0/900=tram, 3=bus, 11=trolleybus
}

export interface Trip {
  route_id: string;
  service_id: string;
  trip_id: string;
  trip_headsign: string;
}

export interface StopTime {
  trip_id: string;
  arrival_time: string;   // "HH:MM:SS", may exceed 24h
  departure_time: string;
  stop_id: string;        // stop_code (4-digit), not the GTFS internal stop_id
  stop_sequence: number;
}

export interface CalendarEntry {
  service_id: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  start_date: string;
  end_date: string;
}

export interface CalendarDate {
  service_id: string;
  date: string;           // "YYYYMMDD"
  exception_type: number; // 1=added, 2=removed
}

export interface GtfsStaticData {
  stops: Map<string, Stop>;                  // keyed by stop_code
  routes: Map<string, Route>;                // keyed by route_id
  trips: Map<string, Trip>;                  // keyed by trip_id
  stopTimesByStop: Map<string, StopTime[]>;  // keyed by stop_code
  calendar: Map<string, CalendarEntry>;
  calendarDates: Map<string, CalendarDate[]>;
  stopHeadsigns: Map<string, string[]>;      // top representative headsigns per stop_code
  stopLineCounts: Map<string, number>;       // unique route count per stop_code
}

let cache: { data: GtfsStaticData; fetchedAt: number } | null = null;
let fetchPromise: Promise<GtfsStaticData> | null = null;

export async function getStaticGtfs(): Promise<GtfsStaticData> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  // Stale but within the hard TTL: serve the old schedule immediately and
  // kick off a background refresh so nobody blocks on the daily update.
  // Realtime delays are unaffected — they are fetched fresh per request.
  if (cache && Date.now() - cache.fetchedAt < HARD_TTL_MS) {
    void startFetch();
    return cache.data;
  }

  return startFetch();
}

function startFetch(): Promise<GtfsStaticData> {
  if (fetchPromise) return fetchPromise;
  fetchPromise = (async () => {
    try {
      const data = await fetchAndParse();
      cache = { data, fetchedAt: Date.now() };
      return data;
    } catch (err) {
      if (cache) {
        console.warn(
          '[GTFS static] Refresh failed, serving stale data:',
          err instanceof Error ? err.message : err
        );
        return cache.data;
      }
      throw err;
    } finally {
      fetchPromise = null;
    }
  })();
  return fetchPromise;
}

/** True when static GTFS data is available to serve (fresh or stale-but-usable). */
export function isStaticGtfsReady(): boolean {
  return cache !== null && Date.now() - cache.fetchedAt < HARD_TTL_MS;
}

/**
 * Kick off the static GTFS fetch/parse without blocking the caller. Safe to
 * call repeatedly — startFetch dedupes concurrent loads via fetchPromise.
 */
export function warmStaticGtfs(): void {
  if (isStaticGtfsReady()) return;
  void getStaticGtfs().catch((err) => {
    console.warn('[GTFS static] Warm-up failed:', err instanceof Error ? err.message : err);
  });
}

async function fetchAndParse(): Promise<GtfsStaticData> {
  console.log('[GTFS static] Fetching from', STATIC_GTFS_URL);
  const response = await fetch(STATIC_GTFS_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`GTFS static fetch failed: HTTP ${response.status}`);

  const zip = new AdmZip(Buffer.from(await response.arrayBuffer()));

  // --- stops.txt: ALL stops, indexed by stop_code ---
  // Sofia GTFS uses stop_id = "A2327" (internal) and stop_code = "2327" (human).
  const stopsMap = new Map<string, Stop>();
  const fullIdToCode = new Map<string, string>(); // "A2327" → "2327"

  parseFile(
    zip,
    'stops.txt',
    (r: { stop_id: string; stop_code: string; stop_name: string }) => {
      fullIdToCode.set(r.stop_id, r.stop_code);
      stopsMap.set(r.stop_code, { stop_id: r.stop_code, stop_name: r.stop_name });
    }
  );

  // --- routes.txt: all routes ---
  const routesMap = new Map<string, Route>();
  parseFile(
    zip,
    'routes.txt',
    (r: { route_id: string; route_short_name: string; route_type: string }) => {
      routesMap.set(r.route_id, {
        route_id: r.route_id,
        route_short_name: r.route_short_name,
        route_type: parseInt(r.route_type) || 3,
      });
    }
  );

  // --- trips.txt: all trips (needed before stop_times for headsign lookup) ---
  const tripsMap = new Map<string, Trip>();
  parseFile(
    zip,
    'trips.txt',
    (r: { route_id: string; service_id: string; trip_id: string; trip_headsign: string }) => {
      tripsMap.set(r.trip_id, {
        route_id: r.route_id,
        service_id: r.service_id,
        trip_id: r.trip_id,
        trip_headsign: r.trip_headsign,
      });
    }
  );

  // --- stop_times.txt: all stops; build headsigns + line-count indices on the fly ---
  const stopTimesByStop = new Map<string, StopTime[]>();
  const stopHeadsignSets = new Map<string, Set<string>>();
  const stopRouteIds = new Map<string, Set<string>>();

  parseFile(
    zip,
    'stop_times.txt',
    (r: { trip_id: string; arrival_time: string; departure_time: string; stop_id: string; stop_sequence: string }) => {
      const stopCode = fullIdToCode.get(r.stop_id);
      if (!stopCode) return;

      const st: StopTime = {
        trip_id: r.trip_id,
        arrival_time: r.arrival_time,
        departure_time: r.departure_time,
        stop_id: stopCode,
        stop_sequence: parseInt(r.stop_sequence) || 0,
      };
      if (!stopTimesByStop.has(stopCode)) stopTimesByStop.set(stopCode, []);
      stopTimesByStop.get(stopCode)!.push(st);

      const trip = tripsMap.get(r.trip_id);
      if (trip) {
        if (!stopHeadsignSets.has(stopCode)) stopHeadsignSets.set(stopCode, new Set());
        const hs = stopHeadsignSets.get(stopCode)!;
        if (hs.size < 5 && trip.trip_headsign) hs.add(trip.trip_headsign);

        if (!stopRouteIds.has(stopCode)) stopRouteIds.set(stopCode, new Set());
        stopRouteIds.get(stopCode)!.add(trip.route_id);
      }
    }
  );

  const stopHeadsigns = new Map<string, string[]>();
  stopHeadsignSets.forEach((set, code) => {
    stopHeadsigns.set(code, Array.from<string>(set).slice(0, 3));
  });

  const stopLineCounts = new Map<string, number>();
  stopRouteIds.forEach((set, code) => {
    stopLineCounts.set(code, set.size);
  });

  // --- calendar.txt (optional — Sofia may only use calendar_dates) ---
  const calendarMap = new Map<string, CalendarEntry>();
  try {
    parseFile(zip, 'calendar.txt', (r: Record<string, string>) => {
      calendarMap.set(r.service_id, {
        service_id: r.service_id,
        monday: r.monday === '1',
        tuesday: r.tuesday === '1',
        wednesday: r.wednesday === '1',
        thursday: r.thursday === '1',
        friday: r.friday === '1',
        saturday: r.saturday === '1',
        sunday: r.sunday === '1',
        start_date: r.start_date,
        end_date: r.end_date,
      });
    });
  } catch { /* optional */ }

  // --- calendar_dates.txt ---
  const calendarDatesMap = new Map<string, CalendarDate[]>();
  try {
    parseFile(
      zip,
      'calendar_dates.txt',
      (r: { service_id: string; date: string; exception_type: string }) => {
        const entry: CalendarDate = {
          service_id: r.service_id,
          date: r.date,
          exception_type: parseInt(r.exception_type),
        };
        if (!calendarDatesMap.has(r.service_id)) calendarDatesMap.set(r.service_id, []);
        calendarDatesMap.get(r.service_id)!.push(entry);
      }
    );
  } catch { /* optional */ }

  console.log(
    `[GTFS static] Loaded: stops=${stopsMap.size}, stop_time_groups=${stopTimesByStop.size}, ` +
    `trips=${tripsMap.size}, routes=${routesMap.size}, ` +
    `calendar=${calendarMap.size}, calendar_dates=${calendarDatesMap.size}`
  );

  return {
    stops: stopsMap,
    routes: routesMap,
    trips: tripsMap,
    stopTimesByStop,
    calendar: calendarMap,
    calendarDates: calendarDatesMap,
    stopHeadsigns,
    stopLineCounts,
  };
}

function parseFile<T>(zip: AdmZip, filename: string, onRow: (row: T) => void): void {
  const text = zip.readAsText(filename);
  Papa.parse<T>(text, {
    header: true,
    skipEmptyLines: true,
    step: (result) => onRow(result.data),
  });
}
