'use client';

/**
 * Stream — a small ambient water surface you stir with one finger.
 *
 * Not a game: no score, no timer, no win/lose, nothing to lose. You stir the
 * surface; the current always wins eventually; lift your finger and it settles
 * to glassy on its own. Closing is guilt-free. Reopening is quietly rewarded —
 * the scene moved on while you were gone (see advanceForward / closedAt).
 *
 * Pure client component. Canvas 2D + vanilla logic, no engine, no physics lib.
 * The visuals live entirely in the canvas; Tailwind is layout only.
 */

import { useEffect, useRef } from 'react';
import {
  HOLD_TO_CLOSE_MS,
  HOLD_MOVE_TOLERANCE,
  CONFLUENCE_TONE,
} from './constants';
import {
  Particle,
  createPool,
  step,
  applyPointer,
  advanceForward,
  spawn,
  isDriftDay,
  dayIndex,
} from './particles';
import { makePalette, presetForDay, Palette } from './palette';
import { readStreamState, writeStreamState } from './storage';
import { ConfluenceTone } from './audio';

export function Stream({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Keep onClose fresh without re-running the heavy effect.
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
    const calm = reduced ? 0.5 : 1; // calmer drift, no sudden motion

    // ── Surface state ───────────────────────────────────────────────────────
    let w = 0;
    let h = 0;
    let dpr = 1;
    let pool: Particle[] = [];
    let palette: Palette;

    const state = readStreamState();
    const preset = presetForDay(dayIndex());

    // Rolling stir-energy, persisted across sessions. Drives the hand whisper.
    let stirEnergy = state.stirEnergy;
    const rebuildPalette = () => {
      palette = makePalette(preset, stirEnergy);
      sprite = makeSprite(palette.dot);
      rareSprite = makeSprite(palette.rare);
    };

    // Soft pre-rendered glow sprite — cheapest way to get no-hard-edges dots.
    const makeSprite = (color: string): HTMLCanvasElement => {
      const s = 64;
      const c = document.createElement('canvas');
      c.width = c.height = s;
      const g = c.getContext('2d')!;
      const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      grad.addColorStop(0, color);
      grad.addColorStop(0.4, color);
      grad.addColorStop(1, 'transparent');
      g.globalAlpha = 0.9;
      g.fillStyle = grad;
      g.fillRect(0, 0, s, s);
      return c;
    };
    let sprite: HTMLCanvasElement;
    let rareSprite: HTMLCanvasElement;
    rebuildPalette();

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (pool.length === 0) pool = createPool(w, h);
    };
    resize();
    window.addEventListener('resize', resize);

    // ── The kept-going effect on open ───────────────────────────────────────
    const elapsed = state.closedAt ? Date.now() - state.closedAt : 0;
    advanceForward(pool, w, h, reduced ? 0 : elapsed);

    // ── The rare drift (once per open, only on a seeded drift day) ───────────
    type Rare = { x: number; y: number; vy: number; vx: number; rot: number } | null;
    let rare: Rare = null;
    if (isDriftDay()) {
      rare = {
        x: w * (0.2 + Math.random() * 0.6),
        y: -40,
        vy: (reduced ? 0.25 : 0.45) * 1,
        vx: (Math.random() - 0.5) * 0.2,
        rot: Math.random() * Math.PI,
      };
    }

    // ── Pointer (single pointer only; touch + mouse) ────────────────────────
    let active = false;
    let px = 0;
    let py = 0;
    let lastX = 0;
    let lastY = 0;
    let dragVx = 0;
    let dragVy = 0;

    // Press-and-hold (still) to close. A subtle, undiscoverable-by-accident
    // dismissal: go still and the stream returns you to where you were.
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
      holdTimer = window.setTimeout(() => closeStream(), HOLD_TO_CLOSE_MS);
    };

    const tone = CONFLUENCE_TONE ? new ConfluenceTone() : null;

    const pointerPos = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onDown = (e: PointerEvent) => {
      const pos = pointerPos(e);
      active = true;
      px = lastX = holdStartX = pos.x;
      py = lastY = holdStartY = pos.y;
      dragVx = dragVy = 0;
      armHold();
      tone?.start(); // audio only ever begins on a real gesture
      canvas.setPointerCapture?.(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!active) return;
      const pos = pointerPos(e);
      px = pos.x;
      py = pos.y;
      dragVx = px - lastX;
      dragVy = py - lastY;
      lastX = px;
      lastY = py;
      // Any real movement cancels the still-hold-to-close.
      if (Math.hypot(px - holdStartX, py - holdStartY) > HOLD_MOVE_TOLERANCE) {
        clearHold();
      }
      // Roll the stir-energy toward how fast they tend to move. Slow EMA so it
      // becomes "theirs" only over many sessions, never in a single stir.
      const speed = Math.min(1, Math.hypot(dragVx, dragVy) / 22);
      stirEnergy += (speed - stirEnergy) * 0.01;
    };

    const onUp = () => {
      active = false;
      dragVx = dragVy = 0;
      clearHold();
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    // ── Persist + close helpers ─────────────────────────────────────────────
    const persist = () => {
      writeStreamState({ closedAt: Date.now(), stirEnergy });
    };
    let closing = false;
    const closeStream = () => {
      if (closing) return;
      closing = true;
      persist();
      onCloseRef.current();
    };

    // ── Loop, paused on hidden/blur (battery + the kept-going timestamp) ─────
    let raf = 0;
    let running = true;
    let t0 = performance.now();

    const frame = (now: number) => {
      if (!running) return;
      const t = now - t0;

      // Soft trail fill — gentle fade, no clears, so motion reads as glassy.
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = palette.trail;
      ctx.fillRect(0, 0, w, h);

      step(pool, w, h, t, calm);
      if (active) {
        for (let i = 0; i < pool.length; i++) {
          applyPointer(pool[i], px, py, dragVx, dragVy);
        }
      }

      // Additive light for the water — soft, luminous, never harsh.
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < pool.length; i++) {
        const p = pool[i];
        const r = p.size * 4;
        ctx.globalAlpha = 0.35;
        ctx.drawImage(sprite, p.x - r, p.y - r, r * 2, r * 2);
      }

      // The rare drift: one distinct, slightly brighter object passing through.
      if (rare) {
        rare.y += rare.vy * calm;
        rare.x += rare.vx;
        const rr = 9;
        ctx.globalAlpha = 0.85;
        ctx.drawImage(rareSprite, rare.x - rr, rare.y - rr, rr * 2, rr * 2.6);
        if (rare.y > h + 60) rare = null; // gone for this open — just an "oh"
      }

      ctx.globalAlpha = 1;

      if (tone) {
        // Crude flow readout at the surface centre drives the ambient tone.
        const mid = pool[(pool.length / 2) | 0];
        tone.update(active ? 1 : 0.4, Math.min(1, Math.abs(mid.vx) * 3));
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

    // Pausing also records closedAt, so a backgrounded tab feeds kept-going.
    const onVisibility = () => {
      if (document.hidden) {
        persist();
        stopLoop();
      } else {
        // Re-advance for the time spent hidden, then resume.
        const s = readStreamState();
        if (s.closedAt && !reduced) {
          advanceForward(pool, w, h, Date.now() - s.closedAt);
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
