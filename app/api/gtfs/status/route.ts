import { NextResponse } from 'next/server';
import { isStaticGtfsReady, warmStaticGtfs } from '@/lib/gtfs-static';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Lightweight readiness probe for the static GTFS cache. The home screen polls
 * this on cold start: when the data is already cached it returns immediately
 * ({ ready: true }); otherwise it triggers a background warm-up and reports
 * { ready: false } so the client can show its loading state.
 */
export async function GET() {
  const ready = isStaticGtfsReady();
  if (!ready) warmStaticGtfs();
  return NextResponse.json({ ready });
}
