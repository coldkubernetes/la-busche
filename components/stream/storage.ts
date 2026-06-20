/**
 * The entire persisted footprint of the toy: one localStorage key holding two
 * numbers. No backend, no network. `closedAt` drives the kept-going effect;
 * `stirEnergy` is the single rolling value behind the hand-shape whisper.
 *
 * The rare-drift "seed" is deliberately NOT stored — it is derived from the
 * calendar day (see particles.ts) so there is nothing extra to persist.
 */

const KEY = 'la-busche.stream';

export interface StreamState {
  /** Epoch ms when the stream was last closed/hidden. */
  closedAt: number;
  /** Rolling 0..1 sense of how the user tends to stir. Never shown. */
  stirEnergy: number;
}

const DEFAULT: StreamState = { closedAt: 0, stirEnergy: 0.5 };

export function readStreamState(): StreamState {
  if (typeof window === 'undefined') return { ...DEFAULT };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw) as Partial<StreamState>;
    return {
      closedAt: typeof parsed.closedAt === 'number' ? parsed.closedAt : 0,
      stirEnergy:
        typeof parsed.stirEnergy === 'number'
          ? Math.min(1, Math.max(0, parsed.stirEnergy))
          : 0.5,
    };
  } catch {
    return { ...DEFAULT };
  }
}

export function writeStreamState(state: StreamState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota — the toy simply forgets, which is fine. */
  }
}
