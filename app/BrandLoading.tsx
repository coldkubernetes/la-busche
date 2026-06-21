'use client';

import { useEffect, useRef, useState } from 'react';

const DOT_COUNT = 9;
const TRIP_MS = 1500;

function easeInOutSine(x: number) {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/**
 * The bus drives across a row of dots, "eating" the ones it has already
 * passed, then flips around and drives — and eats — back the other way.
 *
 * Pass `message` to use it as a live-region loading indicator; omit it to
 * use it purely as a decorative flourish (hidden from screen readers).
 * Honors prefers-reduced-motion by parking the bus instead of animating it.
 */
export function BusRoad({ message, className }: { message?: string; className?: string }) {
  const [position, setPosition] = useState(0); // 0 (left) .. 1 (right)
  const [direction, setDirection] = useState<1 | -1>(1);
  const directionRef = useRef<1 | -1>(1);
  const legStartRef = useRef<number | null>(null);
  const rafRef = useRef<number>();
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    function tick(now: number) {
      if (legStartRef.current === null) legStartRef.current = now;
      let t = (now - legStartRef.current) / TRIP_MS;
      if (t >= 1) {
        t = 0;
        legStartRef.current = now;
        directionRef.current = directionRef.current === 1 ? -1 : 1;
        setDirection(directionRef.current);
      }
      const eased = easeInOutSine(t);
      setPosition(directionRef.current === 1 ? eased : 1 - eased);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reducedMotion]);

  const busPosition = reducedMotion ? 0.5 : position;

  return (
    <div
      role={message ? 'status' : undefined}
      aria-live={message ? 'polite' : undefined}
      aria-hidden={message ? undefined : true}
      className={['w-44', className].filter(Boolean).join(' ')}
    >
      {message && <span className="sr-only">{message}</span>}
      <div className="relative h-6">
        <span
          aria-hidden="true"
          className="absolute top-1/2 text-xl leading-none"
          style={{
            left: `${busPosition * 100}%`,
            transform: `translate(-50%, -50%) scaleX(${direction === 1 ? -1 : 1})`,
          }}
        >
          🚌
        </span>
      </div>
      <div className="flex items-center justify-between" aria-hidden="true">
        {Array.from({ length: DOT_COUNT }).map((_, i) => {
          const dotPosition = i / (DOT_COUNT - 1);
          const eaten =
            !reducedMotion && (direction === 1 ? busPosition > dotPosition : busPosition < dotPosition);
          return (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-indigo-400 transition-opacity duration-150"
              style={{ opacity: eaten ? 0.15 : 0.8 }}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * On-brand loading indicator: the La Busche wordmark, a short contextual
 * message, and a bus driving back and forth eating the dots on the road.
 * Designed to feel intentional rather than like a broken/empty screen.
 *
 * Used full-screen on cold start (static GTFS warming up) and inside the
 * arrival board while a departures request is in flight.
 */
export function BrandLoading({
  message,
  fullScreen = false,
  className,
}: {
  message: string;
  fullScreen?: boolean;
  className?: string;
}) {
  const inner = (
    <div className={['flex flex-col items-center text-center', className].filter(Boolean).join(' ')}>
      {/* Brand */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-[2.2rem] leading-none">🚌</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[2.2rem] font-black tracking-tight text-white leading-none">La</span>
          <span className="text-[2.2rem] font-black tracking-tight leading-none bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Busche
          </span>
        </div>
      </div>

      {/* Contextual message */}
      <p className="text-sm text-[#8080cc] mb-5">{message}</p>

      {/* Bus on the road */}
      <BusRoad message={message} />
    </div>
  );

  if (!fullScreen) return inner;

  return (
    <main
      className="min-h-screen bg-[#0c0c16] flex flex-col items-center justify-center px-5"
      style={{
        paddingTop: 'max(3rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      }}
    >
      {inner}
    </main>
  );
}
