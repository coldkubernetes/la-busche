/**
 * Runs once when the server process starts (Next.js instrumentation hook).
 * Warming the static GTFS cache here means the download/parse happens during
 * deploy, not when the first user taps a tile after a restart.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { warmStaticGtfs } = await import('./lib/gtfs-static');
    warmStaticGtfs();
  }
}
