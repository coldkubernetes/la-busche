import { loadConfig, validateConfig, STORAGE_KEY, type AppConfig } from '@/lib/tile-config';
import { downloadFile, uploadFile, isConnected } from './dropboxSync';
import { updateLastSynced } from './syncState';

const FILE_PATH = '/la-busche-config.json';
const THROTTLE_MS = 5 * 60 * 1000;
const DEBOUNCE_MS = 2500;

let syncing = false;
let runAgain = false;
let lastSyncAt = 0;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

async function performSync(): Promise<void> {
  if (!isConnected()) return;

  const local = loadConfig();

  let remote: AppConfig | null = null;
  try {
    const raw = await downloadFile(FILE_PATH);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (validateConfig(parsed)) {
        remote = parsed;
      } else {
        console.warn('[la-busche sync] Remote config invalid — uploading local');
        await uploadFile(FILE_PATH, JSON.stringify(local));
        updateLastSynced();
        return;
      }
    }
  } catch (err) {
    console.warn('[la-busche sync] Download error:', err);
    return;
  }

  if (!remote) {
    await uploadFile(FILE_PATH, JSON.stringify(local));
    updateLastSynced();
    return;
  }

  const localTime = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
  const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;

  if (remoteTime > localTime) {
    // Remote wins — write directly to preserve its updatedAt
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
      window.dispatchEvent(new CustomEvent('la-busche:config-updated'));
    }
  } else if (localTime > remoteTime) {
    await uploadFile(FILE_PATH, JSON.stringify(local));
  }
  // equal → no-op

  updateLastSynced();
}

async function runSyncInternal(): Promise<void> {
  if (syncing) {
    runAgain = true;
    return;
  }
  syncing = true;
  try {
    await performSync();
  } catch (err) {
    console.warn('[la-busche sync] Sync error:', err);
  } finally {
    syncing = false;
    lastSyncAt = Date.now();
    if (runAgain) {
      runAgain = false;
      await runSyncInternal();
    }
  }
}

export function runBackgroundSync(): void {
  if (Date.now() - lastSyncAt < THROTTLE_MS) return;
  void runSyncInternal();
}

export function requestSync(): void {
  if (debounceTimer !== null) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void runSyncInternal();
  }, DEBOUNCE_MS);
}

export async function syncNow(): Promise<void> {
  await runSyncInternal();
}
