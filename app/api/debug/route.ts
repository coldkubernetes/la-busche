import { NextResponse } from 'next/server';
import AdmZip from 'adm-zip';
import Papa from 'papaparse';
import { transit_realtime } from 'gtfs-realtime-bindings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATIC_GTFS_URL = 'https://gtfs.sofiatraffic.bg/api/v1/static';
const TRIP_UPDATES_URL = 'https://gtfs.sofiatraffic.bg/api/v1/trip-updates';
const VEHICLE_POSITIONS_URL = 'https://gtfs.sofiatraffic.bg/api/v1/vehicle-positions';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const stopId = url.searchParams.get('stop') ?? '0206';
  const line = url.searchParams.get('line') ?? '73';

  // --- Probe GTFS-RT feeds ---
  async function probeRtFeed(feedUrl: string) {
    try {
      const res = await fetch(feedUrl, { cache: 'no-store' });
      if (!res.ok) return { error: `HTTP ${res.status}` };
      const buf = Buffer.from(await res.arrayBuffer());
      const feed = transit_realtime.FeedMessage.decode(new Uint8Array(buf));
      const total = feed.entity.length;
      const sample = feed.entity.slice(0, 3);
      let tripUpdateCount = 0;
      let vehiclePositionCount = 0;
      for (const e of feed.entity) {
        if (e.tripUpdate) tripUpdateCount++;
        if (e.vehicle) vehiclePositionCount++;
      }
      const sampleParsed = sample.map(e => ({
        id: e.id,
        hasTripUpdate: !!e.tripUpdate,
        hasVehiclePosition: !!e.vehicle,
        tripUpdate: e.tripUpdate ? {
          tripId: e.tripUpdate.trip?.tripId,
          routeId: e.tripUpdate.trip?.routeId,
          stopTimeUpdates: (e.tripUpdate.stopTimeUpdate ?? []).slice(0, 4).map(s => ({
            stopId: s.stopId,
            stopSequence: toLong(s.stopSequence),
            arrivalDelay: toLong(s.arrival?.delay),
            arrivalTime: toLong(s.arrival?.time),
            departureDelay: toLong(s.departure?.delay),
          })),
        } : null,
        vehiclePosition: e.vehicle ? {
          tripId: e.vehicle.trip?.tripId,
          routeId: e.vehicle.trip?.routeId,
          stopId: e.vehicle.stopId,
          currentStopSequence: e.vehicle.currentStopSequence,
          lat: e.vehicle.position?.latitude,
          lng: e.vehicle.position?.longitude,
        } : null,
      }));
      return { total, tripUpdateCount, vehiclePositionCount, sample: sampleParsed };
    } catch (e) {
      return { error: String(e) };
    }
  }

  // --- Search GTFS-RT for bus 73 / stop 0206 ---
  async function searchForStopInTripUpdates(feedUrl: string) {
    try {
      const res = await fetch(feedUrl, { cache: 'no-store' });
      if (!res.ok) return { error: `HTTP ${res.status}` };
      const buf = Buffer.from(await res.arrayBuffer());
      const feed = transit_realtime.FeedMessage.decode(new Uint8Array(buf));

      const matchingTrips: object[] = [];
      const stopIdVariants = [stopId, 'A' + stopId];

      for (const e of feed.entity) {
        const tu = e.tripUpdate;
        if (!tu) continue;
        const stus = tu.stopTimeUpdate ?? [];
        const hasStop = stus.some(s => stopIdVariants.includes(s.stopId ?? ''));
        if (hasStop) {
          matchingTrips.push({
            tripId: tu.trip?.tripId,
            routeId: tu.trip?.routeId,
            stopUpdatesForStop: stus
              .filter(s => stopIdVariants.includes(s.stopId ?? ''))
              .map(s => ({
                stopId: s.stopId,
                seq: toLong(s.stopSequence),
                arrivalDelay: toLong(s.arrival?.delay),
                arrivalTime: toLong(s.arrival?.time),
              })),
          });
        }
      }

      // Also show all stop IDs used across the whole feed (sample)
      const stopIdSet = new Set<string>();
      for (const e of feed.entity) {
        for (const s of e.tripUpdate?.stopTimeUpdate ?? []) {
          if (s.stopId) stopIdSet.add(s.stopId);
        }
      }
      const stopIdSample = Array.from(stopIdSet).slice(0, 20);

      return { matchingTrips, stopIdSample };
    } catch (e) {
      return { error: String(e) };
    }
  }

  // --- Dump realtime trips for a given route_id, with full stop-update sequences ---
  async function dumpTripsForRoute(feedUrl: string, routeId: string | undefined) {
    if (!routeId) return { error: 'no routeId resolved for line' };
    try {
      const res = await fetch(feedUrl, { cache: 'no-store' });
      if (!res.ok) return { error: `HTTP ${res.status}` };
      const buf = Buffer.from(await res.arrayBuffer());
      const feed = transit_realtime.FeedMessage.decode(new Uint8Array(buf));
      const trips: object[] = [];
      for (const e of feed.entity) {
        const tu = e.tripUpdate;
        if (!tu) continue;
        if (tu.trip?.routeId !== routeId) continue;
        if (trips.length >= 4) break;
        trips.push({
          tripId: tu.trip?.tripId,
          startTime: tu.trip?.startTime,
          startDate: tu.trip?.startDate,
          scheduleRelationship: tu.trip?.scheduleRelationship,
          stopUpdates: (tu.stopTimeUpdate ?? []).map(s => ({
            stopId: s.stopId,
            seq: toLong(s.stopSequence),
            arrDelay: toLong(s.arrival?.delay),
            arrTime: toLong(s.arrival?.time),
            schedRel: s.scheduleRelationship,
          })),
        });
      }
      return { matchCount: trips.length, trips };
    } catch (e) {
      return { error: String(e) };
    }
  }

  // --- Static GTFS sample ---
  const staticRes = await fetch(STATIC_GTFS_URL, { cache: 'no-store' });
  let staticSample: object = { error: `HTTP ${staticRes.status}` };
  let routeIdForLine: string | undefined;
  let staticTripIdSample: string[] = [];
  if (staticRes.ok) {
    const zip = new AdmZip(Buffer.from(await staticRes.arrayBuffer()));
    const rawStops = parseFirst(zip, 'stops.txt', 5);
    const matchingRoutes = parseFirst(zip, 'routes.txt', 9999).filter(
      (r: Record<string, string>) => r.route_short_name === line
    );
    routeIdForLine = matchingRoutes[0]?.route_id;

    // Find the stop entry for our stop code
    const allStops = parseFirst(zip, 'stops.txt', 99999);
    const targetStop = allStops.find(
      s => s.stop_code === stopId || s.stop_id === stopId || s.stop_id === 'A' + stopId
    );

    // Sample static trip_ids for this route_id (to compare format vs realtime)
    if (routeIdForLine) {
      const trips = parseFirst(zip, 'trips.txt', 99999).filter(
        t => t.route_id === routeIdForLine
      );
      staticTripIdSample = trips.slice(0, 5).map(t => t.trip_id);
    }

    staticSample = { rawStopsSample: rawStops, targetStop, matchingRoutes, routeIdForLine, staticTripIdSample };
  }

  const [tripUpdatesFeed, vehiclePositionsFeed, tripUpdatesSearch, routeTripsInTU, routeTripsInVP] =
    await Promise.all([
      probeRtFeed(TRIP_UPDATES_URL),
      probeRtFeed(VEHICLE_POSITIONS_URL),
      searchForStopInTripUpdates(TRIP_UPDATES_URL),
      dumpTripsForRoute(TRIP_UPDATES_URL, routeIdForLine),
      dumpTripsForRoute(VEHICLE_POSITIONS_URL, routeIdForLine),
    ]);

  return NextResponse.json({
    query: { stopId, line, routeIdForLine },
    tripUpdatesFeed,
    vehiclePositionsFeed,
    searchForStop_in_tripUpdates: tripUpdatesSearch,
    line73_trips_in_tripUpdates: routeTripsInTU,
    line73_trips_in_vehiclePositions: routeTripsInVP,
    staticSample,
  });
}

function toLong(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (typeof (value as { toNumber(): number }).toNumber === 'function') {
    return (value as { toNumber(): number }).toNumber();
  }
  return Number(value);
}

function parseFirst(zip: AdmZip, filename: string, n: number): Record<string, string>[] {
  try {
    const text = zip.readAsText(filename);
    const rows: Record<string, string>[] = [];
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      step: (result) => {
        if (rows.length < n) rows.push(result.data);
      },
    });
    return rows;
  } catch {
    return [{ error: `${filename} not found or unreadable` }];
  }
}
