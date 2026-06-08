import { NextRequest, NextResponse } from 'next/server';
import { getStaticGtfs } from '@/lib/gtfs-static';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface StopResult {
  stopId: string;
  stopName: string;
  stopCode: string;
  directionHint: string;
  lineCount: number;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json([]);

  const gtfs = await getStaticGtfs();
  const query = q.toLowerCase();

  const scored: Array<{ code: string; name: string; score: number }> = [];

  for (const [code, stop] of Array.from(gtfs.stops)) {
    const nameLC = stop.stop_name.toLowerCase();
    let score = 0;

    if (code === query) score = 100;
    else if (code.startsWith(query)) score = 80;
    else if (nameLC === query) score = 70;
    else if (nameLC.startsWith(query)) score = 60;
    else if (nameLC.includes(query)) score = 40;
    else continue;

    scored.push({ code, name: stop.stop_name, score });
  }

  scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'bg'));

  const results: StopResult[] = scored.slice(0, 10).map((s) => {
    const headsigns = gtfs.stopHeadsigns.get(s.code) ?? [];
    const lineCount = gtfs.stopLineCounts.get(s.code) ?? 0;
    return {
      stopId: s.code,
      stopName: s.name,
      stopCode: s.code,
      directionHint: headsigns.length > 0 ? `→ ${headsigns.join(', ')}` : '',
      lineCount,
    };
  });

  return NextResponse.json(results);
}
