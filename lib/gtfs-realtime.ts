import { transit_realtime } from 'gtfs-realtime-bindings';

const TRIP_UPDATES_URL = 'https://gtfs.sofiatraffic.bg/api/v1/trip-updates';

export interface StopUpdateInfo {
  delay: number | null;   // seconds
  time: number | null;    // unix timestamp
}

export interface SequencedStopUpdate extends StopUpdateInfo {
  stopSequence: number;
}

export interface TripUpdateInfo {
  tripId: string;
  stopUpdates: Map<string, StopUpdateInfo>; // stop_id → update
  // Sorted by stopSequence; used to propagate delays to stops not explicitly listed (per GTFS-RT spec)
  sequencedUpdates: SequencedStopUpdate[];
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
    const sequencedUpdates: SequencedStopUpdate[] = [];

    for (const stu of tu.stopTimeUpdate ?? []) {
      const arrival = stu.arrival;
      const update: StopUpdateInfo = {
        delay: arrival?.delay != null ? toLong(arrival.delay) : null,
        time: arrival?.time != null ? toLong(arrival.time) : null,
      };

      const stopId = stu.stopId;
      if (stopId) {
        stopUpdates.set(stopId, update);
      }

      const seq = stu.stopSequence != null ? toLong(stu.stopSequence) : null;
      if (seq != null) {
        sequencedUpdates.push({ stopSequence: seq, ...update });
      }
    }

    sequencedUpdates.sort((a, b) => a.stopSequence - b.stopSequence);

    result.set(tripId, { tripId, stopUpdates, sequencedUpdates });
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
