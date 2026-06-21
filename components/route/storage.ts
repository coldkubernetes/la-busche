/**
 * Route — persisted bests. One localStorage key holding the best run per layout:
 * the fastest completion time and the highest score seen for each route id. This
 * is the whole "stake" — you compete only with your own ghost-best, nothing and
 * no one else. Kept separate from the water toys' keys.
 *
 * Forgets silently in private mode / on quota errors, exactly like the toys.
 */

const KEY = 'la-busche.route';

export interface RouteBest {
  /** Fastest completion, in ms. */
  bestMs: number;
  /** Highest score. */
  bestScore: number;
}

/** Map of layout id → best run. */
type RouteStore = Record<string, RouteBest>;

function readStore(): RouteStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as RouteStore;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: RouteStore): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* private mode / quota — the game simply forgets its bests, which is fine. */
  }
}

/** The best run recorded for a layout, or null if it has never been finished. */
export function readBest(layoutId: string): RouteBest | null {
  const b = readStore()[layoutId];
  if (!b || typeof b.bestMs !== 'number' || typeof b.bestScore !== 'number') return null;
  return b;
}

/**
 * Fold a finished run into the store. Returns what's notable about it so the
 * complete beat can say "new best" quietly. Time and score bests are tracked
 * independently — a slower run can still set a score best, and vice versa.
 */
export function recordRun(
  layoutId: string,
  ms: number,
  score: number,
): { newTime: boolean; newScore: boolean; best: RouteBest } {
  const store = readStore();
  const prev = store[layoutId];
  const newTime = !prev || ms < prev.bestMs;
  const newScore = !prev || score > prev.bestScore;
  const best: RouteBest = {
    bestMs: prev ? Math.min(prev.bestMs, ms) : ms,
    bestScore: prev ? Math.max(prev.bestScore, score) : score,
  };
  store[layoutId] = best;
  writeStore(store);
  return { newTime, newScore, best };
}
