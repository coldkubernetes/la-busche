'use client';

/**
 * On-brand loading indicator: the La Busche wordmark, a short contextual
 * message, and a trio of gently pulsing dots. Designed to feel intentional
 * rather than like a broken/empty screen.
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

      {/* Pulsing dots */}
      <div className="flex items-center gap-1.5" role="status" aria-live="polite">
        <span className="sr-only">{message}</span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-indigo-400/80 animate-pulse-soft"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
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
