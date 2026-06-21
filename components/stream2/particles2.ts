/**
 * Stream v2 — the marble/water field.
 *
 * The whole point of v2 lives in step2(): velocity is REBUILT from scratch each
 * frame from exactly two sources — a radial displacement field around the
 * pointer, and a restoring spring toward an even spread — and then damped hard.
 * The finger's travel velocity is never read, so nothing is ever inherited and
 * nothing coasts. Contrast v1's step()/applyPointer(), which add the drag
 * velocity and let it persist.
 *
 * No physics library. Cheap math. Decoupled from rendering. Reuses v1's
 * day-seeded rare-drift helpers so there is nothing extra to maintain.
 */

import {
  PARTICLE_COUNT,
  DAMPING,
  RESTORING_STRENGTH,
  POINTER_RADIUS,
  DISPLACE_STRENGTH,
  HOME_JITTER,
  AMBIENT,
  GLINT_CHANCE,
  DRIFT_RATE,
  MAX_DRIFT_PX,
} from './constants2';

// Reuse v1's light primitives: the per-day rare-drift seeding is identical.
export { isDriftDay, dayIndex } from '../stream/particles';

/** Visual class. Motes are many and faint; glints are few, bigger, brighter. */
export type ParticleClass = 'mote' | 'glint';

export interface Particle2 {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Home anchor in the even spread. The restoring spring pulls here. */
  hx: number;
  hy: number;
  size: number;
  /** Base brightness multiplier (0..1), before twinkle. */
  bright: number;
  /** Per-particle twinkle phase, so neighbours shimmer out of step. */
  phase: number;
  cls: ParticleClass;
}

/** Lay out (or re-lay-out) home anchors as a jittered grid filling w×h. */
function layoutHomes(pool: Particle2[], w: number, h: number): void {
  const n = pool.length;
  // Aspect-aware grid so the spread stays even on any screen.
  const cols = Math.max(1, Math.round(Math.sqrt((n * w) / Math.max(1, h))));
  const rows = Math.ceil(n / cols);
  const cellW = w / cols;
  const cellH = h / rows;
  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = (i / cols) | 0;
    const jx = (Math.random() - 0.5) * cellW * HOME_JITTER;
    const jy = (Math.random() - 0.5) * cellH * HOME_JITTER;
    pool[i].hx = (col + 0.5) * cellW + jx;
    pool[i].hy = (row + 0.5) * cellH + jy;
  }
}

/** Give a particle its visual identity (mote vs glint). */
function dress(p: Particle2): void {
  if (Math.random() < GLINT_CHANCE) {
    p.cls = 'glint';
    p.size = 2.8 + Math.random() * 1.8;
    p.bright = 0.7 + Math.random() * 0.3;
  } else {
    p.cls = 'mote';
    p.size = 1.1 + Math.random() * 1.4;
    p.bright = 0.28 + Math.random() * 0.28;
  }
  p.phase = Math.random() * Math.PI * 2;
}

/** Create the fixed pool, homes laid out and each particle sitting at home. */
export function createPool2(w: number, h: number): Particle2[] {
  const pool: Particle2[] = new Array(PARTICLE_COUNT);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    pool[i] = { x: 0, y: 0, vx: 0, vy: 0, hx: 0, hy: 0, size: 0, bright: 0, phase: 0, cls: 'mote' };
    dress(pool[i]);
  }
  layoutHomes(pool, w, h);
  for (const p of pool) {
    p.x = p.hx;
    p.y = p.hy;
  }
  return pool;
}

/** On resize, move the homes to the new dimensions; particles spring to follow. */
export function relayout(pool: Particle2[], w: number, h: number): void {
  layoutHomes(pool, w, h);
}

/**
 * Step the whole field one frame. THIS is where v2 differs from v1.
 *
 * Per particle, every frame, velocity is rebuilt from scratch:
 *   1. Displacement: if the finger is near, push the particle radially OUTWARD,
 *      away from the pointer. Direction is (p − pointer)/d — the finger's own
 *      travel velocity is never read, so nothing is inherited.
 *   2. Restoring: a gentle spring toward home (a slowly breathing anchor in the
 *      even spread). This is what makes the field always want to be full.
 *   3. Damping: velocity *= DAMPING (<1) — viscosity. Residual motion dies in a
 *      handful of frames, so nothing coasts and the field can't be cleared.
 *
 * `calm` (0..1) scales the autonomous breathing for prefers-reduced-motion.
 */
export function step2(
  pool: Particle2[],
  t: number,
  calm: number,
  pointer: { active: boolean; x: number; y: number },
): void {
  const px = pointer.x;
  const py = pointer.y;
  const usePointer = pointer.active;
  for (let i = 0; i < pool.length; i++) {
    const p = pool[i];

    // 1. Displacement — the finger parts the marbles, radially outward only.
    if (usePointer) {
      const dx = p.x - px;
      const dy = p.y - py;
      const d = Math.hypot(dx, dy) || 0.0001;
      if (d < POINTER_RADIUS) {
        const falloff = 1 - d / POINTER_RADIUS; // 1 at finger, 0 at edge
        const push = falloff * falloff * DISPLACE_STRENGTH; // soft shoulder
        p.vx += (dx / d) * push;
        p.vy += (dy / d) * push;
      }
    }

    // 2. Restoring — spring toward a slowly breathing home; the field refills.
    const ax = p.hx + Math.sin(t * 0.0004 + p.phase) * AMBIENT * calm;
    const ay = p.hy + Math.cos(t * 0.0003 + p.phase * 1.3) * AMBIENT * calm;
    p.vx += (ax - p.x) * RESTORING_STRENGTH;
    p.vy += (ay - p.y) * RESTORING_STRENGTH;

    // 3. Damping — heavy viscosity. Velocity bleeds off hard; nothing coasts.
    p.vx *= DAMPING;
    p.vy *= DAMPING;

    p.x += p.vx;
    p.y += p.vy;
  }
}

/**
 * "It kept going without you." — v2 flavour.
 *
 * The suspended field has gently rearranged while you were away: home anchors
 * have drifted a little (capped hard), and a couple of particles have changed
 * their twinkle/identity. A long absence is still a small, legible difference,
 * never chaos and never an emptier field. Returns px of drift applied (flavour).
 */
export function advanceForward2(
  pool: Particle2[],
  w: number,
  h: number,
  elapsedMs: number,
): number {
  if (elapsedMs <= 0) return 0;
  const accrued = (elapsedMs / 1000) * DRIFT_RATE;
  const shift = Math.min(MAX_DRIFT_PX, accrued);
  if (shift <= 0) return 0;

  for (let i = 0; i < pool.length; i++) {
    const p = pool[i];
    p.hx = Math.max(0, Math.min(w, p.hx + (Math.random() - 0.5) * 2 * shift));
    p.hy = Math.max(0, Math.min(h, p.hy + (Math.random() - 0.5) * 2 * shift));
    // Snap a few back to home so the return reads instantly settled, not mid-stir.
    if (Math.random() < 0.5) {
      p.x = p.hx;
      p.y = p.hy;
      p.vx = p.vy = 0;
    }
  }

  // One or two glints have come and gone — re-dress a couple for a quiet "oh".
  const reseed = Math.min(2, 1 + (Math.random() < 0.4 ? 1 : 0));
  for (let i = 0; i < reseed; i++) {
    const p = pool[(Math.random() * pool.length) | 0];
    dress(p);
  }
  return shift;
}
