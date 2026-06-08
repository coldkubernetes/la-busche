import { NextRequest, NextResponse } from 'next/server';
import { getStaticGtfs } from '@/lib/gtfs-static';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type LineType = 'bus' | 'trolleybus' | 'tram';

function getLineType(routeType: number): LineType {
  if (routeType === 11) return 'trolleybus';
  if (routeType === 0 || routeType === 900) return 'tram';
  return 'bus';
}

const TYPE_ORDER: Record<LineType, number> = { tram: 0, trolleybus: 1, bus: 2 };

export async function GET(
  _request: NextRequest,
  { params }: { params: { stopId: string } }
) {
  const { stopId } = params;
  const gtfs = await getStaticGtfs();

  const stop = gtfs.stops.get(stopId);
  if (!stop) {
    return NextResponse.json({ error: 'Stop not found' }, { status: 404 });
  }

  const stopTimes = gtfs.stopTimesByStop.get(stopId) ?? [];

  const routeData = new Map<
    string,
    { shortName: string; type: LineType; headsigns: Set<string> }
  >();

  for (const st of stopTimes) {
    const trip = gtfs.trips.get(st.trip_id);
    if (!trip) continue;
    const route = gtfs.routes.get(trip.route_id);
    if (!route) continue;

    if (!routeData.has(route.route_id)) {
      routeData.set(route.route_id, {
        shortName: route.route_short_name,
        type: getLineType(route.route_type),
        headsigns: new Set(),
      });
    }
    const d = routeData.get(route.route_id)!;
    if (d.headsigns.size < 3 && trip.trip_headsign) {
      d.headsigns.add(trip.trip_headsign);
    }
  }

  const lines = Array.from(routeData.entries())
    .map(([routeId, d]) => ({
      routeId,
      shortName: d.shortName,
      type: d.type,
      headsigns: Array.from(d.headsigns),
    }))
    .sort((a, b) => {
      const tc = TYPE_ORDER[a.type] - TYPE_ORDER[b.type];
      if (tc !== 0) return tc;
      const an = parseInt(a.shortName);
      const bn = parseInt(b.shortName);
      if (!isNaN(an) && !isNaN(bn)) return an - bn;
      return a.shortName.localeCompare(b.shortName);
    });

  return NextResponse.json({ stopId, stopName: stop.stop_name, lines });
}
