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
      stopUpdates.set(stopId, {
        delay: arrival?.delay != null ? toLong(arrival.delay) : null,
        time: arrival?.time != null ? toLong(arrival.time) : null,
      });
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
