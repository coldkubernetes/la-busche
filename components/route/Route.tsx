'use client';

/**
 * Route — a small bus-eats-dots game. The THIRD hidden experience, and the
 * deliberate contrast to the two ambient water toys: this one HAS a goal, a
 * score and levels. You drive a bus through a street maze collecting waiting
 * passengers (dots) and bus-stop pellets. There are NO enemies, the bus cannot
 * die or lose — the stakes are completion, efficiency (time) and flow (an
 * unbroken-pickup multiplier), all kept quiet. See constants.ts for the feel
 * (BUS_SPEED_TPS, FLOW_DECAY_PER_SEC, TURN_BUFFER_MS first), layouts.ts for the
 * handcrafted ASCII mazes, grid.ts for the tile model + center-to-center
 * movement rule, and storage.ts for the per-route best run.
 *
 * Pure client component. Canvas 2D + vanilla logic, no engine, no physics lib.
 * Shares only the toys' light primitives (palette + soft glow sprite). The loop
 * stops on tab-hidden / blur and resumes on focus. Single pointer; touch + mouse
 * + arrow keys, no holding, no multi-touch. Fully independent of toys A and B —
 * trivially removable by deleting this folder and its door in SettingsDrawer.
 *
 * It's decoupled from how it's mounted: it only needs an onClose. The hidden
 * swipe-door wires it today, but a visible entry point could mount it identically.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BUS_SPEED_TPS,
  FLOW_DECAY_PER_SEC,
  TURN_BUFFER_MS,
  FLOW_MAX,
  FLOW_GAIN_PER_DOT,
  FLOW_STOP_BOOST,
  FLOW_BACKTRACK_PENALTY,
  FLOW_IDLE_DECAY_PER_SEC,
  DOT_VALUE,
  STOP_VALUE,
  COMPLETE_HOLD_MS,
  BOARD_PADDING,
  CHANNEL_FRAC,
  DOT_RADIUS_FRAC,
  STOP_RADIUS_FRAC,
  BUS_SIZE_FRAC,
  STEER_SWIPE_MIN,
  CLOSE_HOLD_MS,
  CLOSE_MOVE_TOLERANCE,
} from './constants';
import { LAYOUTS } from './layouts';
import { Tile, parseLayout, isTraversable } from './grid';
import { readBest, recordRun, readDaylight, writeDaylight, RouteBest } from './storage';
import { makePalette, presetForDay } from '../stream/palette';

/** A finished run, surfaced to the React layer for the "route complete" beat. */
interface RunResult {
  label: string;
  ms: number;
  score: number;
  newTime: boolean;
  newScore: boolean;
  best: RouteBest;
}

/** m:ss.d — restrained, the way a timetable would show it. */
function formatTime(ms: number): string {
  const total = Math.max(0, ms) / 1000;
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  const d = Math.floor((total * 10) % 10);
  return `${m}:${s.toString().padStart(2, '0')}.${d}`;
}

// The bus: a single warm accent against the cool field — confident, not a
// mascot. Its windows glow with the same cool light as the dots, tying it to
// the toys' visual language. Tweak here; everything else is in constants.ts.
const BUS_BODY = '#e7b24a';
const BUS_BODY_DIM = '#c9963a';
const BUS_FILL = '#ffd986';
const BUS_WINDOW = 'rgba(196, 212, 255, 0.9)';

export function Route({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Which layout is in play, and the finished-run beat (null while playing).
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<RunResult | null>(null);

  // Daylight (high-contrast) mode for bright light. State drives the toggle's
  // look; the ref lets the render loop read it live without re-initialising.
  const [daylight, setDaylight] = useState(false);
  const daylightRef = useRef(false);
  useEffect(() => {
    const d = readDaylight();
    setDaylight(d);
    daylightRef.current = d;
  }, []);
  const toggleDaylight = useCallback(() => {
    setDaylight((d) => {
      const next = !d;
      daylightRef.current = next;
      writeDaylight(next);
      return next;
    });
  }, []);

  // Live HUD spans, written imperatively each frame to avoid per-frame React
  // re-renders. Route label + best are static per layout and live in JSX.
  const scoreRef = useRef<HTMLSpanElement>(null);
  const multRef = useRef<HTMLSpanElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  // The engine reports completion through this ref so the closure stays stable.
  const reportCompleteRef = useRef<(r: RunResult) => void>(() => {});
  reportCompleteRef.current = (r) => setResult(r);

  const layout = LAYOUTS[index];
  const bestBefore = readBest(layout.id);

  // Fade the one-time control hint once the player gives any direction.
  const hideHint = useCallback(() => {
    if (hintRef.current) hintRef.current.style.opacity = '0';
  }, []);

  const advance = useCallback(() => {
    setResult(null);
    setIndex((i) => (i + 1) % LAYOUTS.length);
  }, []);

  // The "route complete" beat: hold the finished board, then dissolve onward.
  // A tap (on the overlay) continues immediately.
  useEffect(() => {
    if (!result) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hold = reduced ? COMPLETE_HOLD_MS * 1.4 : COMPLETE_HOLD_MS;
    const timer = window.setTimeout(advance, hold);
    return () => window.clearTimeout(timer);
  }, [result, advance]);

  // ── The game engine — re-initialised per layout (deps: [index]) ────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const calm = reduced ? 0.4 : 1; // damps the twinkle; no camera moves to calm

    const grid = parseLayout(LAYOUTS[index]);
    const { cols, rows, tiles } = grid; // tiles is a private mutable copy
    let dotsRemaining = grid.dotCount;
    const totalDots = grid.dotCount;

    // ── Light language, shared with the toys ──────────────────────────────────
    const preset = presetForDay(Math.floor(Date.now() / 86_400_000));
    const palette = makePalette(preset, 0.5);
    const makeSprite = (color: string): HTMLCanvasElement => {
      const s = 64;
      const c = document.createElement('canvas');
      c.width = c.height = s;
      const g = c.getContext('2d')!;
      const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      grad.addColorStop(0, color);
      grad.addColorStop(0.4, color);
      grad.addColorStop(1, 'transparent');
      g.fillStyle = grad;
      g.fillRect(0, 0, s, s);
      return c;
    };
    const dotSprite = makeSprite(palette.dot);
    const stopSprite = makeSprite(palette.rare);

    // ── Board geometry (recomputed on resize) ─────────────────────────────────
    let w = 0;
    let h = 0;
    let dpr = 1;
    let tile = 0;
    let originX = 0;
    let originY = 0;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      tile = Math.floor(
        Math.min((w - 2 * BOARD_PADDING) / cols, (h - 2 * BOARD_PADDING) / rows),
      );
      originX = (w - cols * tile) / 2;
      originY = (h - rows * tile) / 2;
    };
    resize();
    window.addEventListener('resize', resize);
    // Pixel centre of a tile coord (tile centres sit at integer col/row).
    const px = (col: number) => originX + (col + 0.5) * tile;
    const py = (row: number) => originY + (row + 0.5) * tile;

    // ── Bus + run state ────────────────────────────────────────────────────────
    const bus = {
      x: grid.spawn.col,
      y: grid.spawn.row,
      dir: { x: 0, y: 0 }, // current heading; {0,0} = stopped
      target: { x: grid.spawn.col, y: grid.spawn.row }, // tile centre headed to
      face: { x: 0, y: -1 }, // last non-zero heading, for drawing orientation
    };
    let want: { x: number; y: number } | null = null; // buffered turn
    let wantAt = 0;
    let flow = 0;
    let score = 0;
    let elapsedMs = 0;
    let finished = false;
    let steered = false; // has the player given any direction yet (hint fade)

    const trav = (col: number, row: number) => isTraversable(grid, col, row);

    // Set the desired direction. A reversal applies instantly (and costs a
    // little flow); any other turn is buffered for the next valid junction; from
    // a standstill at a centre it starts immediately if the way is clear.
    const setDirection = (nx: number, ny: number, now: number) => {
      if (!steered) hideHint();
      steered = true;
      if (nx === bus.dir.x && ny === bus.dir.y) return; // already going that way
      const reversing = bus.dir.x !== 0 || bus.dir.y !== 0
        ? nx === -bus.dir.x && ny === -bus.dir.y
        : false;
      if (reversing) {
        // Head back to the centre we just left; no junction needed.
        bus.target = { x: bus.target.x - bus.dir.x, y: bus.target.y - bus.dir.y };
        bus.dir = { x: nx, y: ny };
        bus.face = { x: nx, y: ny };
        want = null;
        flow = Math.max(0, flow - FLOW_BACKTRACK_PENALTY);
        return;
      }
      // Standing still and aligned on a centre → start at once if clear.
      if (bus.dir.x === 0 && bus.dir.y === 0 && bus.x === bus.target.x && bus.y === bus.target.y) {
        const cx = Math.round(bus.x);
        const cy = Math.round(bus.y);
        if (trav(cx + nx, cy + ny)) {
          bus.dir = { x: nx, y: ny };
          bus.face = { x: nx, y: ny };
          bus.target = { x: cx + nx, y: cy + ny };
          want = null;
          return;
        }
      }
      want = { x: nx, y: ny };
      wantAt = now;
    };

    const finish = () => {
      finished = true;
      bus.dir = { x: 0, y: 0 };
      const rec = recordRun(LAYOUTS[index].id, elapsedMs, score);
      reportCompleteRef.current({
        label: LAYOUTS[index].label,
        ms: elapsedMs,
        score,
        newTime: rec.newTime,
        newScore: rec.newScore,
        best: rec.best,
      });
    };

    const eatAt = (cx: number, cy: number) => {
      const idx = cy * cols + cx;
      const t = tiles[idx];
      if (t !== Tile.Dot && t !== Tile.Stop) return;
      const mult = 1 + flow;
      if (t === Tile.Dot) {
        score += Math.round(DOT_VALUE * mult);
        flow = Math.min(FLOW_MAX, flow + FLOW_GAIN_PER_DOT);
      } else {
        score += Math.round(STOP_VALUE * mult);
        flow = Math.min(FLOW_MAX, flow + FLOW_STOP_BOOST); // the brief flow boost
      }
      tiles[idx] = Tile.Empty;
      dotsRemaining--;
      if (dotsRemaining <= 0 && !finished) finish();
    };

    // Reached a tile centre: eat, then decide the next heading.
    const reachCentre = (now: number) => {
      const cx = Math.round(bus.x);
      const cy = Math.round(bus.y);
      bus.x = cx;
      bus.y = cy;
      eatAt(cx, cy);
      if (finished) {
        bus.target = { x: cx, y: cy };
        return;
      }
      if (want && now - wantAt <= TURN_BUFFER_MS && trav(cx + want.x, cy + want.y)) {
        bus.dir = { x: want.x, y: want.y };
        bus.face = { x: want.x, y: want.y };
        want = null;
      } else if ((bus.dir.x || bus.dir.y) && !trav(cx + bus.dir.x, cy + bus.dir.y)) {
        bus.dir = { x: 0, y: 0 }; // wall ahead, no valid turn → idle
      }
      bus.target =
        bus.dir.x || bus.dir.y ? { x: cx + bus.dir.x, y: cy + bus.dir.y } : { x: cx, y: cy };
    };

    const step = (dt: number, now: number) => {
      if (finished) return;
      elapsedMs += dt * 1000;
      if (want && now - wantAt > TURN_BUFFER_MS) want = null; // stale buffer expires

      // From a standstill, try to pick up a buffered turn at the current centre.
      if (bus.dir.x === 0 && bus.dir.y === 0) {
        const cx = Math.round(bus.x);
        const cy = Math.round(bus.y);
        if (want && now - wantAt <= TURN_BUFFER_MS && trav(cx + want.x, cy + want.y)) {
          bus.dir = { x: want.x, y: want.y };
          bus.face = { x: want.x, y: want.y };
          bus.target = { x: cx + want.x, y: cy + want.y };
          want = null;
        }
      }

      let move = BUS_SPEED_TPS * dt;
      let guard = 0;
      while (move > 1e-6 && (bus.dir.x !== 0 || bus.dir.y !== 0) && guard++ < 64) {
        const dx = bus.target.x - bus.x;
        const dy = bus.target.y - bus.y;
        const dist = Math.abs(dx) + Math.abs(dy); // axis-aligned: one term is 0
        if (dist <= move + 1e-9) {
          bus.x = bus.target.x;
          bus.y = bus.target.y;
          move -= dist;
          reachCentre(now);
        } else {
          bus.x += Math.sign(dx) * move;
          bus.y += Math.sign(dy) * move;
          move = 0;
        }
      }

      // Flow always bleeds; idling bleeds it faster. Eating outruns the decay.
      const idle = bus.dir.x === 0 && bus.dir.y === 0;
      flow = Math.max(
        0,
        flow - FLOW_DECAY_PER_SEC * dt - (idle ? FLOW_IDLE_DECAY_PER_SEC * dt : 0),
      );
    };

    // ── Drawing ────────────────────────────────────────────────────────────────
    const drawRoundRect = (
      x: number,
      y: number,
      ww: number,
      hh: number,
      r: number,
    ) => {
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, ww, hh, r);
      } else {
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + ww, y, x + ww, y + hh, r);
        ctx.arcTo(x + ww, y + hh, x, y + hh, r);
        ctx.arcTo(x, y + hh, x, y, r);
        ctx.arcTo(x, y, x + ww, y, r);
        ctx.closePath();
      }
    };

    const draw = (t: number) => {
      const day = daylightRef.current;

      ctx.globalCompositeOperation = 'source-over';
      // Daylight lifts the backdrop off pure-black so the maze separates from
      // screen glare; the dark default stays moody.
      ctx.fillStyle = day ? '#1a1c2e' : palette.bg;
      ctx.fillRect(0, 0, w, h);

      // Streets as soft channels — round-capped strokes between adjacent street
      // centres, one path, one stroke. Reads as light channels, not walls. In
      // daylight they're far more opaque so the network is legible in sun.
      ctx.strokeStyle = day ? 'rgba(168, 180, 245, 0.42)' : 'rgba(128, 138, 214, 0.10)';
      ctx.lineWidth = tile * CHANNEL_FRAC;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (tiles[row * cols + col] === Tile.Wall) continue;
          const cx = px(col);
          const cy = py(row);
          if (trav(col + 1, row)) {
            ctx.moveTo(cx, cy);
            ctx.lineTo(px(col + 1), cy);
          }
          if (trav(col, row + 1)) {
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx, py(row + 1));
          }
        }
      }
      ctx.stroke();

      // Pellets — soft radial glows by default (passengers under the lights).
      // In daylight, soft additive glow washes out, so we draw crisp solid
      // discs with a small glow halo instead: same light language, far more
      // legible in sun.
      const dotR = tile * DOT_RADIUS_FRAC;
      const stopR = tile * STOP_RADIUS_FRAC;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const tt = tiles[row * cols + col];
          if (tt !== Tile.Dot && tt !== Tile.Stop) continue;
          const cx = px(col);
          const cy = py(row);
          const phase = (col * 7 + row * 13) * 0.5;
          const twinkle = 0.7 + 0.3 * Math.sin(t * 0.0018 + phase) * calm;
          const r = tt === Tile.Stop ? stopR : dotR;
          const sprite = tt === Tile.Stop ? stopSprite : dotSprite;
          if (day) {
            // halo (additive) + crisp solid core (opaque)
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.5 * twinkle;
            ctx.drawImage(sprite, cx - r, cy - r, r * 2, r * 2);
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
            ctx.fillStyle = tt === Tile.Stop ? palette.rare : palette.dot;
            ctx.beginPath();
            ctx.arc(cx, cy, r * (tt === Tile.Stop ? 0.66 : 0.78), 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = Math.min(1, (tt === Tile.Stop ? 0.95 : 0.85) * twinkle);
            ctx.drawImage(sprite, cx - r, cy - r, r * 2, r * 2);
            if (tt === Tile.Stop) {
              // a small bright core so a stop reads as a landmark
              const cr = r * 0.5;
              ctx.drawImage(sprite, cx - cr, cy - cr, cr * 2, cr * 2);
            }
          }
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // The bus — a confident rounded shape, longer along travel, with two
      // cool-glowing windows toward the front. It subtly fills as it collects.
      const bx = px(bus.x);
      const by = py(bus.y);
      const size = tile * BUS_SIZE_FRAC;
      const horiz = bus.face.x !== 0;
      const bw = horiz ? size : size * 0.74;
      const bh = horiz ? size * 0.74 : size;
      const r = Math.min(bw, bh) * 0.3;
      const x0 = bx - bw / 2;
      const y0 = by - bh / 2;

      drawRoundRect(x0, y0, bw, bh, r);
      ctx.fillStyle = finished ? BUS_BODY_DIM : BUS_BODY;
      ctx.fill();
      if (day) {
        // a thin dark rim keeps the bus crisp against the brighter daylight field
        ctx.strokeStyle = 'rgba(20, 20, 36, 0.55)';
        ctx.lineWidth = Math.max(1, tile * 0.04);
        ctx.stroke();
      }

      // Collected-fill: a brighter wash rising from the bottom, clipped to body.
      const fill = totalDots > 0 ? (totalDots - dotsRemaining) / totalDots : 0;
      if (fill > 0) {
        ctx.save();
        ctx.clip();
        ctx.fillStyle = BUS_FILL;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(x0, y0 + bh * (1 - fill), bw, bh * fill);
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      // Windows: two cool glints near the front edge.
      const front = 0.2;
      const wx = bx + bus.face.x * bw * front;
      const wy = by + bus.face.y * bh * front;
      const ws = size * 0.18;
      const gap = size * 0.2;
      const perpX = horiz ? 0 : 1;
      const perpY = horiz ? 1 : 0;
      ctx.fillStyle = BUS_WINDOW;
      for (const s of [-1, 1]) {
        drawRoundRect(
          wx + perpX * s * gap - ws / 2,
          wy + perpY * s * gap - ws / 2,
          ws,
          ws,
          ws * 0.35,
        );
        ctx.fill();
      }

      // HUD: live score + the quiet flow multiplier (faint at rest).
      if (scoreRef.current) scoreRef.current.textContent = String(score);
      if (multRef.current) {
        multRef.current.textContent = `×${(1 + flow).toFixed(1)}`;
        multRef.current.style.opacity = String(Math.min(1, 0.22 + flow / FLOW_MAX));
      }
    };

    // ── Loop, paused on hidden/blur ───────────────────────────────────────────
    let raf = 0;
    let running = true;
    let last = performance.now();
    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05); // clamp to avoid tunneling
      last = now;
      step(dt, now);
      draw(now);
      raf = requestAnimationFrame(frame);
    };
    const startLoop = () => {
      if (running && raf) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stopLoop = () => {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => (document.hidden ? stopLoop() : startLoop());
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', stopLoop);
    window.addEventListener('focus', startLoop);

    // ── Input: single pointer (swipe to steer, hold still to close) + keys ─────
    let closeTimer: number | null = null;
    let downX = 0;
    let downY = 0;
    let anchorX = 0;
    let anchorY = 0;
    const clearClose = () => {
      if (closeTimer !== null) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }
    };
    const pointerPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const steerByDelta = (dx: number, dy: number, now: number) => {
      if (Math.abs(dx) > Math.abs(dy)) setDirection(Math.sign(dx), 0, now);
      else setDirection(0, Math.sign(dy), now);
    };
    const onDown = (e: PointerEvent) => {
      const p = pointerPos(e);
      downX = anchorX = p.x;
      downY = anchorY = p.y;
      clearClose();
      // Guilt-free close: hold STILL and the game dissolves away (same as toys).
      closeTimer = window.setTimeout(() => onCloseRef.current(), CLOSE_HOLD_MS);
      canvas.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (closeTimer === null && e.buttons === 0 && e.pointerType === 'mouse') return;
      const p = pointerPos(e);
      // Any real movement cancels the hold-to-close.
      if (Math.hypot(p.x - downX, p.y - downY) > CLOSE_MOVE_TOLERANCE) clearClose();
      // Moving-anchor steering: each leg of a drag past the threshold issues a
      // turn and re-anchors, so one continuous drag can string turns together.
      const dx = p.x - anchorX;
      const dy = p.y - anchorY;
      if (Math.hypot(dx, dy) >= STEER_SWIPE_MIN) {
        steerByDelta(dx, dy, performance.now());
        anchorX = p.x;
        anchorY = p.y;
      }
    };
    const onUp = () => clearClose();
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    const onKey = (e: KeyboardEvent) => {
      let d: [number, number] | null = null;
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          d = [-1, 0];
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          d = [1, 0];
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          d = [0, -1];
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          d = [0, 1];
          break;
        case 'Escape':
          onCloseRef.current();
          return;
      }
      if (d) {
        e.preventDefault();
        setDirection(d[0], d[1], performance.now());
      }
    };
    window.addEventListener('keydown', onKey);

    startLoop();

    // ── Teardown ────────────────────────────────────────────────────────────────
    return () => {
      stopLoop();
      clearClose();
      window.removeEventListener('resize', resize);
      window.removeEventListener('blur', stopLoop);
      window.removeEventListener('focus', startLoop);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
    // Re-init whenever the layout changes; everything inside is imperative.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <div className="absolute inset-0 select-none">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />

      {/* HUD — restrained, no clutter, no hearts, no lives. Tailwind for layout. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-5 text-white"
        style={{ paddingTop: 'max(1.4rem, env(safe-area-inset-top))' }}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-black tracking-wide">{layout.label}</span>
          {bestBefore && (
            <span className="text-[11px] font-semibold text-[#7a7ab0]">
              best {formatTime(bestBefore.bestMs)}
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span ref={scoreRef} className="text-base font-black tabular-nums">
            0
          </span>
          <span ref={multRef} className="text-[11px] font-bold text-[#9aa0e0]">
            ×1.0
          </span>
        </div>
      </div>

      {/* Bright-light toggle — a small, restrained contrast switch for playing
          in sun. Sits top-centre, out of the steering field; remembers itself. */}
      <button
        onClick={toggleDaylight}
        aria-label="Toggle bright-light contrast"
        aria-pressed={daylight}
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full text-lg leading-none transition-colors"
        style={{
          top: 'max(1.1rem, env(safe-area-inset-top))',
          minWidth: 40,
          minHeight: 40,
          color: daylight ? '#e7b24a' : '#5b5b88',
        }}
      >
        ◐
      </button>

      {/* One-time control whisper, fades on first input. */}
      <div
        ref={hintRef}
        className="pointer-events-none absolute inset-x-0 bottom-10 text-center text-[11px] font-semibold tracking-wide text-[#5b5b88] transition-opacity duration-700"
      >
        swipe to drive · hold still to leave
      </div>

      {/* The "route complete" beat — a gentle dissolve, no confetti. Tap continues. */}
      {result && (
        <button
          onClick={advance}
          aria-label="Continue to the next route"
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0c0c16]/70 backdrop-blur-sm animate-[fadeIn_700ms_ease-out]"
        >
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#7a7ab0]">
            route complete
          </span>
          <span className="text-2xl font-black text-white">{result.label}</span>
          <span className="text-sm font-semibold tabular-nums text-[#c6c6f0]">
            {formatTime(result.ms)} · {result.score} pts
          </span>
          {(result.newTime || result.newScore) && (
            <span className="mt-1 text-[11px] font-bold uppercase tracking-widest text-[#e7b24a]">
              {result.newTime && result.newScore
                ? 'new best'
                : result.newTime
                  ? 'new best time'
                  : 'new best score'}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
