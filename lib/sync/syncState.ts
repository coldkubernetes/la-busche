const SYNC_STATE_KEY = 'la-busche:sync:state';

export type SyncProvider = 'dropbox' | null;

export interface SyncState {
  provider: SyncProvider;
  lastSynced: string | null;
}

const DEFAULT: SyncState = { provider: null, lastSynced: null };

export function getSyncState(): SyncState {
  if (typeof window === 'undefined') return { ...DEFAULT };
  try {
    const raw = localStorage.getItem(SYNC_STATE_KEY);
    return raw ? (JSON.parse(raw) as SyncState) : { ...DEFAULT };
  } catch {
    return { ...DEFAULT };
  }
}

export function setSyncState(partial: Partial<SyncState>): void {
  if (typeof window === 'undefined') return;
  const current = getSyncState();
  localStorage.setItem(SYNC_STATE_KEY, JSON.stringify({ ...current, ...partial }));
}

export function updateLastSynced(): void {
  setSyncState({ lastSynced: new Date().toISOString() });
}

export function formatLastSynced(lastSynced: string | null): string {
  if (!lastSynced) return 'Never';
  const diff = Date.now() - new Date(lastSynced).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  return new Date(lastSynced).toLocaleDateString();
}
