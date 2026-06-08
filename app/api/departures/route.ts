import { NextRequest, NextResponse } from 'next/server';
import { getStaticGtfs } from '@/lib/gtfs-static';
import { fetchTripUpdates } from '@/lib/gtfs-realtime';
import { computeDepartures } from '@/lib/departures';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const stopId = searchParams.get('stop');
  if (!stopId) {
    return NextResponse.json({ error: 'Missing required parameter: stop' }, { status: 400 });
  }

  // Accept 'lines=73,204' (new) or legacy 'line=73' (single)
  const linesParam = searchParams.get('lines');
  const lineParam = searchParams.get('line');
  const lines = linesParam
    ? linesParam.split(',').map((l) => l.trim()).filter(Boolean)
    : lineParam
    ? [lineParam]
    : undefined;

  const minutesRaw = searchParams.get('minutes');
  const maxRaw = searchParams.get('max');
  const minutes = minutesRaw ? parseInt(minutesRaw) : 20;
  const maxResults = maxRaw ? parseInt(maxRaw) : undefined;

  try {
    const [gtfs, tripUpdates] = await Promise.all([
      getStaticGtfs(),
      fetchTripUpdates().catch((err) => {
        console.warn('[API] GTFS-RT unavailable, using scheduled times only:', err.message);
        return new Map();
      }),
    ]);

    const { stopName, departures } = computeDepartures(gtfs, tripUpdates, {
      stopId,
      lines,
      minutes: isNaN(minutes) ? 20 : minutes,
      maxResults: maxResults && !isNaN(maxResults) ? maxResults : undefined,
    });

    return NextResponse.json({
      stop_name: stopName,
      departures,
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] departures error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
