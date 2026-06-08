'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { loadConfig, type TileConfig } from '@/lib/tile-config';
import { useTranslation } from '@/lib/i18n';
import { BrandLoading } from '@/app/BrandLoading';

interface Departure {
  line: string;
  headsign: string;
  scheduled: string;
  estimated: string;
  scheduledEpoch: number;
  estimatedEpoch: number;
  delay_minutes: number;
  status: 'on_time' | 'delayed' | 'early';
}

interface DeparturesResponse {
  stop_name: string;
  departures: Departure[];
  fetched_at: string;
}

function minsUntil(epochSeconds: number): number {
  return Math.round((epochSeconds - Date.now() / 1000) / 60);
}

export default function BoardPage() {
  const params = useParams();
  const cardId = params.cardId as string;
  const { t } = useTranslation();

  const [tile, setTile] = useState<TileConfig | null>(null);
  const [tileLoaded, setTileLoaded] = useState(false);
  const [data, setData] = useState<DeparturesResponse | null>(null);
  const [phase, setPhase] = useState<'loading' | 'ok' | 'refreshing' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const config = loadConfig();
    setTile(config.tiles.find((t) => t.tileId === cardId) ?? null);
    setTileLoaded(true);
  }, [cardId]);

  const fetchData = useCallback(
    async (initial: boolean) => {
      if (!tile) return;
      setPhase(initial ? 'loading' : 'refreshing');
      try {
        const qs = new URLSearchParams({ stop: tile.stopId });
        if (tile.lines.length > 0) qs.set('lines', tile.lines.join(','));

        const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
        const res = await fetch(`${base}/api/departures?${qs}`);
        const json: DeparturesResponse = await res.json();
        if (!res.ok) throw new Error((json as unknown as { error: string }).error ?? 'Request failed');
        setData(json);
        setPhase('ok');
        setErrorMsg('');
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
        setPhase('error');
      }
    },
    [tile]
  );

  // Initial load + 30 s auto-refresh
  useEffect(() => {
    if (!tile) return;
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 30_000);
    return () => clearInterval(interval);
  }, [fetchData, tile]);

  // Countdown tick every 15 s
  useEffect(() => {
    const interval = setInterval(() => setTick((n) => n + 1), 15_000);
    return () => clearInterval(interval);
  }, []);

  void tick;

  if (!tileLoaded) {
    return <div className="min-h-screen bg-[#0c0c16]" />;
  }

  if (!tile) {
    return (
      <div className="min-h-screen bg-[#0c0c16] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#8080cc] mb-4">{t('board.unknown')}</p>
          <Link href="/" className="text-indigo-400 text-sm hover:text-indigo-300">
            ← {t('board.back')}
          </Link>
        </div>
      </div>
    );
  }

  const isOutbound = tile.category === 'from_home';
  const activeDepartures = data?.departures.filter((d) => minsUntil(d.estimatedEpoch) >= -1) ?? [];

  return (
    <div
      className="min-h-screen bg-[#0c0c16] flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-[#0c0c16]/95 backdrop-blur-md border-b border-[#1e1e30]">
        <div className="px-4 pt-4 pb-3">
          {/* Nav row */}
          <div className="flex items-center justify-between mb-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[#8888cc] text-sm hover:text-white transition-colors"
            >
              <span>←</span> {t('board.back')}
            </Link>

            <div className="flex items-center gap-3">
              {phase === 'refreshing' && (
                <span className="text-[0.65rem] tracking-widest uppercase text-[#7070bb] animate-pulse-soft">
                  {t('board.refreshing')}
                </span>
              )}
              <button
                onClick={() => fetchData(false)}
                aria-label={t('board.refresh.aria')}
                className="text-[#8888cc] hover:text-white transition-colors text-xl leading-none p-1 rounded-lg hover:bg-white/5"
              >
                ↻
              </button>
            </div>
          </div>

          {/* Destination info */}
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none">{tile.emoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white leading-tight">{tile.label}</h1>
                <span
                  className={[
                    'text-xs font-bold px-1.5 py-0.5 rounded-md',
                    isOutbound ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300',
                  ].join(' ')}
                >
                  {isOutbound ? '→' : '←'}
                </span>
              </div>
              <p className="text-xs text-[#8080cc] mt-0.5">
                {tile.lines.length > 0
                  ? t('board.filtered_lines', { lines: tile.lines.join(', ') })
                  : t('board.all_lines')}
              </p>
            </div>
          </div>

          {data && (
            <p className="text-[0.65rem] text-[#5555aa] font-mono mt-2 tracking-wide">
              {data.stop_name} · {t('board.stop_label')} {tile.stopId}
            </p>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 px-4 py-4">
        {phase === 'loading' && (
          <BrandLoading message={t('loading.arrivals')} className="mt-20" />
        )}

        {phase === 'error' && !data && (
          <div className="mt-12 text-center">
            <p className="text-rose-400/80 text-sm mb-1">{t('board.error')}</p>
            <p className="text-[#7070bb] text-xs mb-5">{errorMsg}</p>
            <button
              onClick={() => fetchData(true)}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {t('board.try_again')}
            </button>
          </div>
        )}

        {(phase === 'ok' || phase === 'refreshing' || (phase === 'error' && data)) && (
          <>
            {activeDepartures.length === 0 ? (
              <EmptyState tile={tile} />
            ) : (
              <div className="flex flex-col gap-2">
                {activeDepartures.map((dep) => (
                  <DepartureRow key={`${dep.line}-${dep.scheduledEpoch}`} dep={dep} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer brand */}
      <footer
        className="px-4 pt-2 text-center"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <p className="text-[0.6rem] text-[#22224a] tracking-widest uppercase font-semibold">
          {t('board.footer')}
        </p>
      </footer>
    </div>
  );
}

function DepartureRow({ dep }: { dep: Departure }) {
  const { t } = useTranslation();
  const mins = minsUntil(dep.estimatedEpoch);
  const isNow = mins <= 0;
  const isUrgent = mins <= 2 && mins > 0;
  const countdownColor = isNow ? 'text-amber-300' : isUrgent ? 'text-amber-200' : 'text-white';

  return (
    <div
      className={[
        'rounded-2xl p-4 border bg-[#13131f]',
        isNow || isUrgent ? 'border-amber-500/25 bg-amber-500/5' : 'border-[#1e1e30]',
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-500/15 border border-indigo-500/25">
          <span className="text-indigo-300 font-black text-sm tabular-nums">{dep.line}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-[0.9rem] leading-snug truncate">{dep.headsign}</p>
          <div className="flex items-center gap-2 mt-1">
            <StatusChip dep={dep} />
            <span className="text-[#4444aa] text-xs">·</span>
            <span className="text-[#8080cc] text-xs font-mono">{dep.estimated}</span>
          </div>
        </div>

        <div className="flex-shrink-0 text-right min-w-[3rem]">
          {isNow ? (
            <span className="text-amber-300 font-black text-xl leading-none">{t('board.now')}</span>
          ) : (
            <>
              <span className={`font-black text-2xl leading-none tabular-nums ${countdownColor}`}>
                {mins}
              </span>
              <p className="text-[0.62rem] text-[#7070bb] mt-0.5 font-semibold uppercase tracking-wider">
                {t('board.min')}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusChip({ dep }: { dep: Departure }) {
  const { t } = useTranslation();
  if (dep.status === 'on_time') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
        {t('board.status.on_time')}
      </span>
    );
  }
  if (dep.status === 'early') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-sky-400 font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />
        {t('board.status.early')}
      </span>
    );
  }
  const isMinor = dep.delay_minutes <= 3;
  return (
    <span className={['inline-flex items-center gap-1 text-xs font-semibold', isMinor ? 'text-amber-400' : 'text-rose-400'].join(' ')}>
      <span className={['w-1.5 h-1.5 rounded-full inline-block', isMinor ? 'bg-amber-400' : 'bg-rose-400'].join(' ')} />
      {t('board.delay', { minutes: dep.delay_minutes })}
    </span>
  );
}

function EmptyState({ tile }: { tile: TileConfig }) {
  const { t } = useTranslation();
  return (
    <div className="mt-14 text-center px-6">
      <div className="text-4xl mb-4">🚌</div>
      <p className="text-[#9090cc] text-sm font-medium">
        {tile.lines.length > 0
          ? t('board.no_departures_line', { lines: tile.lines.join(', ') })
          : t('board.no_departures')}
      </p>
      <p className="text-[#6060aa] text-xs mt-2">{t('board.auto_refresh')}</p>
    </div>
  );
}
