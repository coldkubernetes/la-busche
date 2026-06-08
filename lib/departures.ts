import type { GtfsStaticData, CalendarEntry } from './gtfs-static';
import type { TripUpdateInfo } from './gtfs-realtime';

export interface Departure {
  line: string;
  headsign: string;
  scheduled: string;        // "HH:MM"
  estimated: string;        // "HH:MM"
  scheduledEpoch: number;   // unix seconds
  estimatedEpoch: number;   // unix seconds
  delay_minutes: number;
  status: 'on_time' | 'delayed' | 'early';
}

interface SofiaTime {
  dateStr: string;             // "YYYYMMDD"
  dayKey: keyof CalendarEntry; // "monday" | "tuesday" | ...
  midnightEpoch: number;       // unix seconds at Sofia midnight
  nowEpoch: number;
  yesterdayDateStr: string;
  yesterdayDayKey: keyof CalendarEntry;
}

function getSofiaTime(): SofiaTime {
  const now = new Date();

  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Sofia',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = fmt.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';

  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hour = parseInt(get('hour'));
  const minute = parseInt(get('minute'));
  const second = parseInt(get('second'));

  const dateStr = `${year}${month}${day}`;
  const secondsFromMidnight = hour * 3600 + minute * 60 + second;
  const nowEpoch = Math.floor(now.getTime() / 1000);
  const midnightEpoch = nowEpoch - secondsFromMidnight;

  const weekdayFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Sofia',
    weekday: 'long',
  });
  const weekdayStr = weekdayFmt.format(now);
  const dayKeys: Record<string, keyof CalendarEntry> = {
    Sunday: 'sunday',
    Monday: 'monday',
    Tuesday: 'tuesday',
    Wednesday: 'wednesday',
    Thursday: 'thursday',
    Friday: 'friday',
    Saturday: 'saturday',
  };
  const dayKey = dayKeys[weekdayStr] ?? 'monday';

  const yesterday = new Date(now.getTime() - 86400000);
  const yesterdayFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Sofia',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const yp = yesterdayFmt.formatToParts(yesterday);
  const yget = (t: string) => yp.find((p) => p.type === t)?.value ?? '0';
  const yesterdayDateStr = `${yget('year')}${yget('month')}${yget('day')}`;
  const yesterdayWeekdayStr = weekdayFmt.format(yesterday);
  const yesterdayDayKey = dayKeys[yesterdayWeekdayStr] ?? 'sunday';

  return { dateStr, dayKey, midnightEpoch, nowEpoch, yesterdayDateStr, yesterdayDayKey };
}

function gtfsTimeToSeconds(time: string): number {
  const [h, m, s] = time.split(':').map(Number);
  return h * 3600 + m * 60 + (s ?? 0);
}

function secondsToHHMM(totalSeconds: number): string {
  const normalized = ((totalSeconds % 86400) + 86400) % 86400;
  const h = Math.floor(normalized / 3600);
  const m = Math.floor((normalized % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getActiveServiceIds(
  gtfs: GtfsStaticData,
  dateStr: string,
  dayKey: keyof CalendarEntry,
): Set<string> {
  const active = new Set<string>();

  for (const [serviceId, entry] of Array.from(gtfs.calendar)) {
    if (
      entry.start_date <= dateStr &&
      entry.end_date >= dateStr &&
      (entry[dayKey] as boolean)
    ) {
      active.add(serviceId);
    }
  }

  for (const [serviceId, dates] of Array.from(gtfs.calendarDates)) {
    for (const cd of dates) {
      if (cd.date !== dateStr) continue;
      if (cd.exception_type === 1) active.add(serviceId);
      else if (cd.exception_type === 2) active.delete(serviceId);
    }
  }

  return active;
}

export interface ComputeParams {
  stopId: string;
  lines?: string[];  // filter to specific lines; empty/undefined = all lines
  minutes?: number;
  maxResults?: number;
}

export function computeDepartures(
  gtfs: GtfsStaticData,
  tripUpdates: Map<string, TripUpdateInfo>,
  params: ComputeParams
): { stopName: string; departures: Departure[] } {
  const DISPLAY_MINUTES = 30;
  const MIN_COUNT = 5;

  const { stopId, lines, maxResults } = params;
  const hasLineFilter = lines && lines.length > 0;

  const sofiaTime = getSofiaTime();
  const { midnightEpoch, nowEpoch, yesterdayDateStr, yesterdayDayKey } = sofiaTime;
  const prevMidnightEpoch = midnightEpoch - 86400;

  const stopName = gtfs.stops.get(stopId)?.stop_name ?? stopId;
  const activeServiceIds = getActiveServiceIds(gtfs, sofiaTime.dateStr, sofiaTime.dayKey);
  // Yesterday's services are needed for cross-midnight trips (arrival_time >= 24:00:00 in GTFS).
  // Those trips belong to the previous service day but physically arrive in today's early hours.
  const yesterdayServiceIds = getActiveServiceIds(gtfs, yesterdayDateStr, yesterdayDayKey);
  const stopTimes = gtfs.stopTimesByStop.get(stopId) ?? [];

  // Collect all upcoming departures within 24 h, then trim to
  // "next 30 min OR first 5 departures — whichever shows more".
  const windowEndEpoch = nowEpoch + 24 * 3600;

  const departures: Departure[] = [];

  for (const st of stopTimes) {
    const trip = gtfs.trips.get(st.trip_id);
    if (!trip) continue;

    const scheduledSeconds = gtfsTimeToSeconds(st.arrival_time);
    // GTFS encodes cross-midnight arrivals with times >= 24:00:00. These trips belong
    // to the previous service day, so check yesterday's service IDs and anchor the
    // epoch to yesterday's midnight.
    const isCrossMidnight = scheduledSeconds >= 86400;
    const serviceIds = isCrossMidnight ? yesterdayServiceIds : activeServiceIds;
    const baseEpoch = isCrossMidnight ? prevMidnightEpoch : midnightEpoch;

    if (!serviceIds.has(trip.service_id)) continue;

    const route = gtfs.routes.get(trip.route_id);
    if (!route) continue;
    if (hasLineFilter && !lines.includes(route.route_short_name)) continue;

    const scheduledEpoch = baseEpoch + scheduledSeconds;

    // Skip trips more than 2 minutes in the past
    if (scheduledEpoch < nowEpoch - 120) continue;
    if (scheduledEpoch > windowEndEpoch) continue;

    // Apply realtime updates
    let estimatedEpoch = scheduledEpoch;
    let delaySeconds = 0;

    const tripUpdate = tripUpdates.get(st.trip_id);
    if (tripUpdate) {
      // GTFS-RT may use either the internal stop_id ("A2327") or the stop_code ("2327")
      const stopUpdate =
        tripUpdate.stopUpdates.get(stopId) ??
        tripUpdate.stopUpdates.get('A' + stopId);
      if (stopUpdate) {
        if (stopUpdate.time != null && stopUpdate.time > 0) {
          estimatedEpoch = stopUpdate.time;
          delaySeconds = estimatedEpoch - scheduledEpoch;
        } else if (stopUpdate.delay != null) {
          delaySeconds = stopUpdate.delay;
          estimatedEpoch = scheduledEpoch + delaySeconds;
        }
      }
    }

    // Re-check window with estimated time
    if (estimatedEpoch < nowEpoch - 120) continue;

    const delay_minutes = Math.round(delaySeconds / 60);
    const status: Departure['status'] =
      delay_minutes <= -1 ? 'early' : delay_minutes <= 1 ? 'on_time' : 'delayed';

    departures.push({
      line: route.route_short_name,
      headsign: trip.trip_headsign,
      scheduled: secondsToHHMM(scheduledSeconds),
      estimated: secondsToHHMM(estimatedEpoch - midnightEpoch),
      scheduledEpoch,
      estimatedEpoch,
      delay_minutes,
      status,
    });
  }

  departures.sort((a, b) => a.estimatedEpoch - b.estimatedEpoch);

  // "30 min OR 5 trips — whichever is greater"
  const cutoff = nowEpoch + DISPLAY_MINUTES * 60;
  const inWindow = departures.filter((d) => d.estimatedEpoch <= cutoff);
  const trimmed = inWindow.length >= MIN_COUNT ? inWindow : departures.slice(0, MIN_COUNT);

  return {
    stopName,
    departures: maxResults ? trimmed.slice(0, maxResults) : trimmed,
  };
}
