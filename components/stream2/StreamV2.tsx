'use client';

/**
 * Stream v2 — suspended light in dark water, stirred like a jar of marbles.
 *
 * A SECOND variant of the hidden ambient toy, alongside v1 — not a replacement.
 * Same spirit (no score, no timer, nothing to lose, guilt-free close, quietly
 * rewarded reopen) but a fundamentally different interaction model: the finger
 * is a DISPLACEMENT field that parts the field and lets it close back in, with
 * heavy damping and a restoring spring so it always wants to be full and can
 * never be emptied. See particles2.ts/step2 for where velocity comes from and
 * goes; constants2.ts for the two numbers (DAMPING, RESTORING_STRENGTH) first.
 *
 * Pure client component. Canvas 2D + vanilla logic, no engine, no physics lib.
 * Reuses v1's light primitives (palette + hand-tint whisper, optional tone,
 * the per-day rare drift) so the added bundle is near zero.
 */

import { useEffect, useRef } from 'react';
import {
  CLOSE_HOLD_MS,
  CLOSE_MOVE_TOLERANCE,
  TWINKLE_SPEED,
  CONFLUENCE_TONE,
} from './constants2';
import {
  Particle2,
  createPool2,
  relayout,
  step2,
  advanceForward2,
  isDriftDay,
  dayIndex,
} from './particles2';
import { makePalette, presetForDay, Palette } from '../stream/palette';
import { ConfluenceTone } from '../stream/audio';
import { readStreamV2State, writeStreamV2State } from './storage2';

export function StreamV2({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const calm = reduced ? 0.4 : 1;

    // ── Field state ─────────────────────────────────────────────────────────
    let w = 0;
    let h = 0;
    let dpr = 1;
    let pool: Particle2[] = [];
    let palette: Palette;

    const state = readStreamV2State();
    const preset = presetForDay(dayIndex());

    // Rolling stir-energy, persisted across sessions. Drives the hand whisper —
    // the same single, barely-perceptible hue drift as v1 (deletable identically).
    let stirEnergy = state.stirEnergy;

    // Soft pre-rendered glow sprite — no hard edges, soft radial light.
    const makeSprite = (color: string): HTMLCanvasElement => {
      const s = 64;
      const c = document.createElement('canvas');
      c.width = c.height = s;
      const g = c.getContext('2d')!;
      const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      grad.addColorStop(0, color);
      grad.addColorStop(0.35, color);
      grad.addColorStop(1, 'transparent');
      g.globalAlpha = 0.9;
      g.fillStyle = grad;
      g.fillRect(0, 0, s, s);
      return c;
    };
    let sprite: HTMLCanvasElement;
    let rareSprite: HTMLCanvasElement;
    const rebuildPalette = () => {
      palette = makePalette(preset, stirEnergy);
      sprite = makeSprite(palette.dot);
      rareSprite = makeSprite(palette.rare);
    };
    rebuildPalette();

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (pool.length === 0) pool = createPool2(w, h);
      else relayout(pool, w, h); // keep the spread even on rotate/resize
    };
    resize();
    window.addEventListener('resize', resize);

    // ── The kept-going effect on open ───────────────────────────────────────
    const elapsed = state.closedAt ? Date.now() - state.closedAt : 0;
    advanceForward2(pool, w, h, reduced ? 0 : elapsed);

    // ── The rare drift (once per open, only on a seeded drift day) ───────────
    type Rare = { x: number; y: number; vy: number; vx: number } | null;
    let rare: Rare = null;
    if (isDriftDay()) {
      rare = {
        x: w * (0.2 + Math.random() * 0.6),
        y: -40,
        vy: (reduced ? 0.22 : 0.4),
        vx: (Math.random() - 0.5) * 0.2,
      };
    }

    // ── Pointer (single pointer only; the displacement source) ──────────────
    const pointer = { active: false, x: 0, y: 0 };
    let lastX = 0;
    let lastY = 0;

    // Press-and-hold STILL to close — the same guilt-free dismissal as v1.
    let holdTimer: number | null = null;
    let holdStartX = 0;
    let holdStartY = 0;
    const clearHold = () => {
      if (holdTimer !== null) {
        window.clearTimeout(holdTimer);
        holdTimer = null;
      }
    };
    const armHold = () => {
      clearHold();
      holdTimer = window.setTimeout(() => closeStream(), CLOSE_HOLD_MS);
    };

    const tone = CONFLUENCE_TONE ? new ConfluenceTone() : null;

    const pointerPos = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onDown = (e: PointerEvent) => {
      const pos = pointerPos(e);
      pointer.active = true;
      pointer.x = lastX = holdStartX = pos.x;
      pointer.y = lastY = holdStartY = pos.y;
      armHold();
      tone?.start(); // audio only ever begins on a real gesture
      canvas.setPointerCapture?.(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!pointer.active) return;
      const pos = pointerPos(e);
      pointer.x = pos.x;
      pointer.y = pos.y;
      // Any real movement cancels the still-hold-to-close.
      if (Math.hypot(pos.x - holdStartX, pos.y - holdStartY) > CLOSE_MOVE_TOLERANCE) {
        clearHold();
      }
      // Roll stir-energy toward how fast they tend to move (slow EMA, so it
      // becomes "theirs" only over many sessions). NOTE: used ONLY for the hand
      // whisper — never fed back into the physics, so nothing is inherited.
      const speed = Math.min(1, Math.hypot(pos.x - lastX, pos.y - lastY) / 22);
      stirEnergy += (speed - stirEnergy) * 0.01;
      lastX = pos.x;
      lastY = pos.y;
    };

    const onUp = () => {
      pointer.active = false;
      clearHold();
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    // ── Persist + close helpers ─────────────────────────────────────────────
    const persist = () => {
      writeStreamV2State({ closedAt: Date.now(), stirEnergy });
    };
    let closing = false;
    const closeStream = () => {
      if (closing) return;
      closing = true;
      persist();
      onCloseRef.current();
    };

    // ── Loop, paused on hidden/blur ─────────────────────────────────────────
    let raf = 0;
    let running = true;
    let t0 = performance.now();

    const frame = (now: number) => {
      if (!running) return;
      const t = now - t0;

      // Soft trail fill — gentle fade, no hard clears, so motion reads glassy.
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = palette.trail;
      ctx.fillRect(0, 0, w, h);

      step2(pool, t, calm, pointer);

      // Additive light — suspended glows in dark water, with a slow twinkle.
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < pool.length; i++) {
        const p = pool[i];
        const twinkle = 0.72 + 0.28 * Math.sin(t * TWINKLE_SPEED + p.phase) * calm;
        const r = p.size * (p.cls === 'glint' ? 5 : 3.6);
        ctx.globalAlpha = Math.min(1, p.bright * twinkle);
        ctx.drawImage(sprite, p.x - r, p.y - r, r * 2, r * 2);
        // Glints get a small bright core for that occasional caught-light glance.
        if (p.cls === 'glint') {
          const cr = r * 0.5;
          ctx.globalAlpha = Math.min(1, p.bright * twinkle * 0.9);
          ctx.drawImage(sprite, p.x - cr, p.y - cr, cr * 2, cr * 2);
        }
      }

      // The rare drift: one distinct, slightly warmer object passing through.
      if (rare) {
        rare.y += rare.vy * calm;
        rare.x += rare.vx;
        const rr = 9;
        ctx.globalAlpha = 0.85;
        ctx.drawImage(rareSprite, rare.x - rr, rare.y - rr, rr * 2, rr * 2.4);
        if (rare.y > h + 60) rare = null; // gone for this open — just an "oh"
      }

      ctx.globalAlpha = 1;

      if (tone) {
        // Crude readout: how much the field is moving right now drives the tone.
        const mid = pool[(pool.length / 2) | 0];
        tone.update(pointer.active ? 1 : 0.4, Math.min(1, Math.hypot(mid.vx, mid.vy) * 3));
      }

      raf = requestAnimationFrame(frame);
    };

    const startLoop = () => {
      if (running && raf) return;
      running = true;
      t0 = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stopLoop = () => {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onVisibility = () => {
      if (document.hidden) {
        persist();
        stopLoop();
      } else {
        const s = readStreamV2State();
        if (s.closedAt && !reduced) {
          advanceForward2(pool, w, h, Date.now() - s.closedAt);
        }
        startLoop();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', stopLoop);
    window.addEventListener('focus', startLoop);

    startLoop();

    // ── Teardown ────────────────────────────────────────────────────────────
    return () => {
      stopLoop();
      persist();
      clearHold();
      tone?.stop();
      window.removeEventListener('resize', resize);
      window.removeEventListener('blur', stopLoop);
      window.removeEventListener('focus', startLoop);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
    // Mount once; everything inside is imperative and self-managing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full touch-none select-none"
      // No chrome, no instructions. The toy teaches itself by being touched.
      aria-hidden="true"
    />
  );
}
