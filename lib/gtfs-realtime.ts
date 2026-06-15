import { transit_realtime } from 'gtfs-realtime-bindings';

const TRIP_UPDATES_URL = 'https://gtfs.sofiatraffic.bg/api/v1/trip-updates';

export interface StopUpdateInfo {
  delay: number | null;   // seconds
  time: number | null;    // unix timestamp
}

export interface TripUpdateInfo {
  tripId: string;
  stopUpdates: Map<string, StopUpdateInfo>; // stop_id → update
}

export async function fetchTripUpdates(): Promise<Map<string, TripUpdateInfo>> {
  const response = await fetch(TRIP_UPDATES_URL, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`GTFS-RT fetch failed: HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const feed = transit_realtime.FeedMessage.decode(new Uint8Array(arrayBuffer));

  const result = new Map<string, TripUpdateInfo>();

  for (const entity of feed.entity) {
    const tu = entity.tripUpdate;
    if (!tu) continue;

    const tripId = tu.trip?.tripId;
    if (!tripId) continue;

    const stopUpdates = new Map<string, StopUpdateInfo>();

    for (const stu of tu.stopTimeUpdate ?? []) {
      const stopId = stu.stopId;
      if (!stopId) continue;

      const arrival = stu.arrival;
      const info: StopUpdateInfo = {
        delay: arrival?.delay != null ? toLong(arrival.delay) : null,
        time: arrival?.time != null ? toLong(arrival.time) : null,
      };

      // Sofia's realtime feed keys stops by a mode-prefixed internal id:
      // bus "A0206", trolleybus "TB0206", tram "TM2260". The static schedule
      // (and the rest of this app) keys stops by the bare 4-digit stop_code
      // ("0206"). Index by both the raw id and the numeric code so a lookup by
      // stop_code matches every mode — not just buses (the old "A"+code path).
      stopUpdates.set(stopId, info);
      const stopCode = stopId.replace(/^\D+/, '');
      if (stopCode && stopCode !== stopId) stopUpdates.set(stopCode, info);
    }

    result.set(tripId, { tripId, stopUpdates });
  }

  return result;
}

// protobufjs may return Long objects for int64 fields
function toLong(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value != null && typeof (value as { toNumber(): number }).toNumber === 'function') {
    return (value as { toNumber(): number }).toNumber();
  }
  return Number(value);
}
