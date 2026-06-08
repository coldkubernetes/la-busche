'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { loadConfig, STORAGE_KEY, type TileConfig } from '@/lib/tile-config';
import { useTranslation } from '@/lib/i18n';
import { Welcome } from './Welcome';
import { BrandLoading } from './BrandLoading';

type Tab = 'from_home' | 'to_home';

// Cold-start polling: how often to re-check GTFS readiness, and how long to
// wait before giving up and rendering anyway (e.g. if upstream GTFS is down —
// the per-tile arrival board has its own error handling).
const STATUS_POLL_MS = 1500;
const STATUS_MAX_ATTEMPTS = 30;

function getDefaultTab(): Tab {
  const hour = new Date().getHours();
  // Morning (5–11): you're leaving home
  return hour >= 5 && hour < 12 ? 'from_home' : 'to_home';
}

export default function HomePage() {
  const { t } = useTranslation();
  const [tiles, setTiles] = useState<TileConfig[]>([]);
  const [tab, setTab] = useState<Tab>('from_home');
  const [mounted, setMounted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  // null = still checking; false = cold start in progress; true = ready/cached.
  const [gtfsReady, setGtfsReady] = useState<boolean | null>(null);

  // Cold start: only show the full-screen loader when the static GTFS data
  // isn't cached yet. When it's already warm the first probe returns ready and
  // tiles render immediately, just like before.
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

    async function check() {
      let ready = false;
      try {
        const res = await fetch(`${base}/api/gtfs/status`);
        const json = (await res.json()) as { ready?: boolean };
        ready = Boolean(json.ready);
      } catch {
        // Network/parse error — treat as not-ready and retry below.
      }
      if (cancelled) return;
      if (ready) {
        setGtfsReady(true);
        return;
      }
      setGtfsReady(false);
      attempts += 1;
      if (attempts >= STATUS_MAX_ATTEMPTS) {
        // Give up waiting and render anyway rather than loading forever.
        setGtfsReady(true);
        return;
      }
      timer = setTimeout(check, STATUS_POLL_MS);
    }

    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    setTab(getDefaultTab());
    // First run: no config has ever been written. Show the welcome screen and
    // defer writing the empty config until the user dismisses it.
    if (localStorage.getItem(STORAGE_KEY) === null) {
      setShowWelcome(true);
      setMounted(true);
      return;
    }
    const config = loadConfig();
    setTiles([...config.tiles].sort((a, b) => a.order - b.order));
    setMounted(true);
  }, []);

  function handleWelcomeDismiss() {
    const config = loadConfig();
    setTiles([...config.tiles].sort((a, b) => a.order - b.order));
    setShowWelcome(false);
  }

  if (showWelcome) {
    return <Welcome mode="firstRun" onDismiss={handleWelcomeDismiss} />;
  }

  // Cold start in progress: the static GTFS data is being fetched/parsed on the
  // server. Show a branded full-screen loader instead of tiles that couldn't
  // load arrivals yet.
  if (gtfsReady === false) {
    return <BrandLoading fullScreen message={t('loading.cold_start')} />;
  }

  const visibleTiles = tiles.filter((t) => t.category === tab);
  const isFromHome = tab === 'from_home';

  return (
    <main
      className="min-h-screen bg-[#0c0c16] flex flex-col px-5"
      style={{
        paddingTop: 'max(4rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Brand + gear icon */}
      <header className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[2rem] leading-none">🚌</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[2.2rem] font-black tracking-tight text-white leading-none">La</span>
              <span className="text-[2.2rem] font-black tracking-tight leading-none bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Busche
              </span>
            </div>
          </div>
          <p className="text-xs text-[#7777bb] mt-1.5 tracking-widest uppercase font-semibold">
            {t('app.tagline')}
          </p>
        </div>

        <Link
          href="/setup"
          aria-label={t('home.setup.aria')}
          className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#13131f] border border-[#1e1e30] text-[#8888cc] hover:text-white hover:border-[#3333aa] active:scale-95 transition-all duration-100"
        >
          <span className="text-xl leading-none">⚙️</span>
        </Link>
      </header>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-2xl bg-[#13131f] border border-[#1e1e30] mb-5">
        <TabButton
          active={tab === 'from_home'}
          onClick={() => setTab('from_home')}
          label={t('home.tab.from_home')}
          color="indigo"
        />
        <TabButton
          active={tab === 'to_home'}
          onClick={() => setTab('to_home')}
          label={t('home.tab.to_home')}
          color="emerald"
        />
      </div>

      {/* Tiles */}
      {!mounted || gtfsReady !== true ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-[128px] rounded-2xl bg-[#13131f] border border-[#1a1a2a] animate-pulse"
              style={{ opacity: 1 - i * 0.3 }}
            />
          ))}
        </div>
      ) : visibleTiles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-14">
          <span className="text-5xl mb-4">{isFromHome ? '🏠' : '🏡'}</span>
          <h2 className="text-lg font-black text-white mb-2">
            {isFromHome ? t('home.empty.from_home.title') : t('home.empty.to_home.title')}
          </h2>
          <p className="text-sm text-[#8080cc] mb-7">
            {isFromHome ? t('home.empty.from_home.message') : t('home.empty.to_home.message')}
          </p>
          <Link
            href="/setup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#13131f] border border-[#1e1e30] text-[#9090cc] font-bold text-sm active:scale-[0.97] transition-transform duration-100"
          >
            <span>⚙️</span>
            <span>{t('home.empty.cta')}</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {visibleTiles.map((tile) => (
            <TileCard key={tile.tileId} tile={tile} />
          ))}
        </div>
      )}

      <footer className="mt-8 flex flex-col items-center gap-2.5">
        <Link
          href="/about"
          className="text-[0.6rem] text-[#555588] hover:text-[#8888cc] tracking-widest uppercase font-semibold transition-colors"
        >
          {t('welcome.about')}
        </Link>
        <p className="text-[0.6rem] text-[#333366] tracking-widest uppercase font-semibold">
          {t('app.footer')}
        </p>
      </footer>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color: 'indigo' | 'emerald';
}) {
  const activeClass =
    color === 'indigo'
      ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30'
      : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30';

  return (
    <button
      onClick={onClick}
      className={[
        'flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-150 active:scale-[0.97]',
        active ? activeClass : 'text-[#7777aa] border border-transparent',
      ].join(' ')}
      style={{ minHeight: 44 }}
    >
      {label}
    </button>
  );
}

function TileCard({ tile }: { tile: TileConfig }) {
  const isFromHome = tile.category === 'from_home';

  const glowStyle: React.CSSProperties = isFromHome
    ? {
        borderColor: 'rgba(99,102,241,0.22)',
        boxShadow: [
          '0 0 24px -2px rgba(99,102,241,0.18)',
          '0 0 0 1px rgba(99,102,241,0.09)',
          '0 6px 24px rgba(0,0,0,0.55)',
          'inset 0 1px 0 rgba(255,255,255,0.055)',
        ].join(', '),
      }
    : {
        borderColor: 'rgba(52,211,153,0.20)',
        boxShadow: [
          '0 0 24px -2px rgba(52,211,153,0.15)',
          '0 0 0 1px rgba(52,211,153,0.08)',
          '0 6px 24px rgba(0,0,0,0.55)',
          'inset 0 1px 0 rgba(255,255,255,0.045)',
        ].join(', '),
      };

  return (
    <Link href={`/board/${tile.tileId}`} className="block">
      <div
        className="relative overflow-hidden rounded-2xl p-4 h-[128px] bg-[#111120] border active:scale-[0.96] transition-transform duration-100 flex flex-col justify-between"
        style={glowStyle}
      >
        <div
          className={[
            'absolute -top-5 -right-5 w-14 h-14 rounded-full blur-2xl opacity-25',
            isFromHome ? 'bg-indigo-500' : 'bg-emerald-500',
          ].join(' ')}
        />

        <div className="flex items-start justify-between relative z-10">
          <span className="text-2xl leading-none">{tile.emoji}</span>
          <span
            className={[
              'text-xs font-bold px-2 py-0.5 rounded-full border',
              isFromHome
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            ].join(' ')}
          >
            {isFromHome ? '→' : '←'}
          </span>
        </div>

        <div className="relative z-10">
          <p className="font-bold text-white text-base leading-tight truncate">{tile.label}</p>
          <p className="text-xs text-[#8080cc] mt-0.5 truncate">{tile.stopName}</p>
        </div>
      </div>
    </Link>
  );
}
