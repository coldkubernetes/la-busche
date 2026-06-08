export interface TileConfig {
  tileId: string;
  category: 'from_home' | 'to_home';
  label: string;
  emoji: string;
  stopId: string;
  stopName: string;
  lines: string[];
  order: number;
}

export interface AppConfig {
  version: 1;
  tiles: TileConfig[];
  updatedAt: string;
}

export const STORAGE_KEY = 'la-busche-config';

const EMPTY_CONFIG: AppConfig = {
  version: 1,
  tiles: [],
  updatedAt: new Date(0).toISOString(),
};

export function loadConfig(): AppConfig {
  if (typeof window === 'undefined') return { ...EMPTY_CONFIG };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_CONFIG };
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    if (parsed.version !== 1 || !Array.isArray(parsed.tiles)) return { ...EMPTY_CONFIG };
    return {
      version: 1,
      tiles: parsed.tiles,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date(0).toISOString(),
    };
  } catch {
    return { ...EMPTY_CONFIG };
  }
}

export function saveConfig(config: AppConfig): void {
  if (typeof window === 'undefined') return;
  const stamped: AppConfig = { ...config, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
}

export function initConfig(): AppConfig {
  if (typeof window === 'undefined') return { ...EMPTY_CONFIG };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial: AppConfig = { version: 1, tiles: [], updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  return loadConfig();
}

export function validateConfig(data: unknown): data is AppConfig {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (d.version !== 1) return false;
  if (!Array.isArray(d.tiles)) return false;
  for (const tile of d.tiles as unknown[]) {
    if (!tile || typeof tile !== 'object') return false;
    const t = tile as Record<string, unknown>;
    if (typeof t.tileId !== 'string') return false;
    if (t.category !== 'from_home' && t.category !== 'to_home') return false;
    if (typeof t.label !== 'string') return false;
    if (typeof t.emoji !== 'string') return false;
    if (typeof t.stopId !== 'string') return false;
    if (typeof t.stopName !== 'string') return false;
    if (!Array.isArray(t.lines)) return false;
    if (typeof t.order !== 'number') return false;
  }
  return true;
}
