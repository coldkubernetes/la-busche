/**
 * Stream v2's persisted footprint: one localStorage key, two numbers — kept
 * SEPARATE from v1's key so the two variants never clobber each other's
 * kept-going timestamp or hand-shape whisper. Same shape, same near-zero
 * footprint, same "forgets silently in private mode" behaviour as v1.
 */

const KEY = 'la-busche.stream2';

export interface StreamV2State {
  /** Epoch ms when v2 was last closed/hidden. Drives the kept-going effect. */
  closedAt: number;
  /** Rolling 0..1 sense of how the user tends to stir. Never shown. */
  stirEnergy: number;
}

const DEFAULT: StreamV2State = { closedAt: 0, stirEnergy: 0.5 };

export function readStreamV2State(): StreamV2State {
  if (typeof window === 'undefined') return { ...DEFAULT };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw) as Partial<StreamV2State>;
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

export function writeStreamV2State(state: StreamV2State): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota — the toy simply forgets, which is fine. */
  }
}
