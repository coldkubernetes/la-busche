import { NextResponse } from 'next/server';
import AdmZip from 'adm-zip';
import Papa from 'papaparse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATIC_GTFS_URL = 'https://gtfs.sofiatraffic.bg/api/v1/static';

export async function GET() {
  const response = await fetch(STATIC_GTFS_URL, { cache: 'no-store' });
  if (!response.ok) {
    return NextResponse.json({ error: `Fetch failed: ${response.status}` }, { status: 500 });
  }

  const zip = new AdmZip(Buffer.from(await response.arrayBuffer()));

  // List all files in the ZIP
  const zipFiles = zip.getEntries().map((e) => e.entryName);

  // Raw first 5 rows of stops.txt
  const rawStops = parseFirst(zip, 'stops.txt', 5);

  // Raw first 5 rows of stop_times.txt
  const rawStopTimes = parseFirst(zip, 'stop_times.txt', 5);

  // Raw first 5 rows of trips.txt
  const rawTrips = parseFirst(zip, 'trips.txt', 5);

  // Find route with short_name containing "73"
  const route73 = parseFirst(zip, 'routes.txt', 9999).filter(
    (r: Record<string, string>) => r.route_short_name === '73'
  );

  return NextResponse.json({
    zip_files: zipFiles,
    raw_stops_sample: rawStops,
    raw_stop_times_sample: rawStopTimes,
    raw_trips_sample: rawTrips,
    route_73: route73,
  });
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
