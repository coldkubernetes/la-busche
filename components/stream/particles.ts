/**
 * The light primitives: a capped, reused particle pool, a downward flow field,
 * a pointer-influence falloff, and the elapsed-time "advance forward" function.
 *
 * No physics library. Cheap math over realism. All functions are pure-ish and
 * decoupled from rendering so they can be lifted out and reused.
 */

import {
  PARTICLE_COUNT,
  CURRENT_STRENGTH,
  SWAY_STRENGTH,
  SETTLE_RATE,
  POINTER_RADIUS,
  POINTER_STRENGTH,
  DRIFT_RATE,
  MAX_ARRIVALS_ON_RETURN,
  RARE_DRIFT_CHANCE,
} from './constants';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  /** Per-particle phase, so the flow field varies between neighbours. */
  seed: number;
}

/** Cheap deterministic hash → [0,1). Used for day-seeded decisions. */
function hash01(n: number): number {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

/** Integer index of the current calendar day (local). */
export function dayIndex(now = Date.now()): number {
  return Math.floor((now - new Date(now).getTimezoneOffset() * 60000) / 86400000);
}

/** Is today a "drift day"? Deterministic per calendar day, uncommon. */
export function isDriftDay(now = Date.now()): boolean {
  return hash01(dayIndex(now) * 7.0 + 1.0) < RARE_DRIFT_CHANCE;
}

/** Place (or recycle) a particle as a fresh arrival near the top of the surface. */
export function spawn(p: Particle, w: number, h: number, atTop = true): void {
  p.x = Math.random() * w;
  p.y = atTop ? -Math.random() * h * 0.15 : Math.random() * h;
  p.vx = (Math.random() - 0.5) * 0.2;
  p.vy = CURRENT_STRENGTH * (0.6 + Math.random() * 0.8);
  p.size = 1.5 + Math.random() * 2.5;
  p.seed = Math.random() * Math.PI * 2;
}

/** Create the fixed pool. Allocated once, never grown. */
export function createPool(w: number, h: number): Particle[] {
  const pool: Particle[] = new Array(PARTICLE_COUNT);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p: Particle = { x: 0, y: 0, vx: 0, vy: 0, size: 0, seed: 0 };
    spawn(p, w, h, false); // initial fill spreads them across the whole surface
    pool[i] = p;
  }
  return pool;
}

/**
 * The flow field: a steady downward current plus a slow horizontal sway. The
 * sway makes neighbouring particles drift together and apart — the "confluence"
 * where streams merge. `calm` (0..1) scales motion down for reduced-motion.
 */
export function flowAt(x: number, y: number, t: number, p: Particle, calm: number) {
  const sway =
    Math.sin(y * 0.012 + t * 0.0005 + p.seed) * SWAY_STRENGTH +
    Math.sin(x * 0.008 - t * 0.0003) * SWAY_STRENGTH * 0.5;
  return { fx: sway * calm, fy: CURRENT_STRENGTH * calm };
}

/**
 * Nudge a particle toward a drag, with a soft radial falloff around the finger.
 * The nudge is a suggestion only — the per-frame settle (below) lets the current
 * win it back. Returns nothing; mutates the particle's velocity.
 */
export function applyPointer(
  p: Particle,
  px: number,
  py: number,
  dragVx: number,
  dragVy: number,
): void {
  const dx = p.x - px;
  const dy = p.y - py;
  const d = Math.hypot(dx, dy);
  if (d > POINTER_RADIUS) return;
  const falloff = 1 - d / POINTER_RADIUS; // 1 at finger, 0 at edge
  const f = falloff * falloff * POINTER_STRENGTH;
  p.vx += dragVx * f;
  p.vy += dragVy * f;
}

/**
 * Step the whole pool one frame. The current is re-asserted every frame via a
 * blend toward the flow field at SETTLE_RATE — so a lifted finger means the
 * surface eases back to glassy on its own. Recycles particles that fall away.
 */
export function step(pool: Particle[], w: number, h: number, t: number, calm: number): void {
  const margin = 24;
  for (let i = 0; i < pool.length; i++) {
    const p = pool[i];
    const flow = flowAt(p.x, p.y, t, p, calm);
    // Current always wins eventually: ease velocity back toward the flow.
    p.vx += (flow.fx - p.vx) * SETTLE_RATE;
    p.vy += (flow.fy - p.vy) * SETTLE_RATE;
    p.x += p.vx;
    p.y += p.vy;
    // gentle horizontal wrap; recycle off the bottom as a fresh arrival up top
    if (p.x < -margin) p.x = w + margin;
    else if (p.x > w + margin) p.x = -margin;
    if (p.y > h + margin) spawn(p, w, h, true);
  }
}

/**
 * "It kept going without you."
 *
 * Given how long the surface was unattended, advance it forward by a CHEAP
 * amount: drift everything downstream a little, and let ONE or TWO fresh things
 * arrive. Capped hard so a long absence still reads as a small, legible change
 * rather than chaos. Returns how many arrivals happened (for optional flavour).
 */
export function advanceForward(
  pool: Particle[],
  w: number,
  h: number,
  elapsedMs: number,
): number {
  if (elapsedMs <= 0) return 0;
  const accrued = (elapsedMs / 1000) * DRIFT_RATE;
  const arrivals = Math.min(MAX_ARRIVALS_ON_RETURN, Math.floor(accrued));

  // A little drained: everything has drifted on a touch while you were away.
  // Kept gentle and capped so the scene moved on, it didn't empty out.
  const downstream = Math.min(h * 0.5, accrued * h * 0.25);
  for (let i = 0; i < pool.length; i++) {
    pool[i].y += downstream;
    if (pool[i].y > h + 24) spawn(pool[i], w, h, true);
  }

  // One or two new things drifted in: recycle a couple to the very top edge.
  for (let i = 0; i < arrivals; i++) {
    const p = pool[(Math.random() * pool.length) | 0];
    spawn(p, w, h, true);
    p.y = -Math.random() * h * 0.1; // sitting right at the headwater
  }
  return arrivals;
}
