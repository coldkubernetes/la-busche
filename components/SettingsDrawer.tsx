'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslation, setLanguage } from '@/lib/i18n';
import { Stream } from '@/components/stream/Stream';
import { TAPS_TO_REVEAL, TAP_RESET_WINDOW_MS } from '@/components/stream/constants';

function itemClass(active: boolean) {
  return [
    'flex items-center gap-3 px-4 py-3 rounded-2xl border font-bold text-sm transition-all duration-100',
    active
      ? 'bg-indigo-500/15 border-indigo-500/45 text-white'
      : 'bg-[#13131f] border-[#1e1e30] text-[#d6d6f5] hover:border-[#2a2a5a]',
  ].join(' ');
}

export function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get('view');

  const isHome = pathname === '/';
  const isRoutes = pathname === '/setup' && view !== 'backup';
  const isBackup = pathname === '/setup' && view === 'backup';
  const isAbout = pathname === '/about';

  // A quiet door: five taps on the menu's own empty background reveal the
  // stream. Taps on actual items do nothing toward it. The count is per-open
  // and ephemeral — we never remember that someone found it.
  const [streamOpen, setStreamOpen] = useState(false);
  const taps = useRef<{ n: number; at: number }>({ n: 0, at: 0 });

  // Re-hide the door whenever the menu itself closes.
  useEffect(() => {
    if (!open) {
      setStreamOpen(false);
      taps.current = { n: 0, at: 0 };
    }
  }, [open]);

  const onPanelPointerDown = (e: React.PointerEvent) => {
    if (streamOpen) return;
    // Only empty panel background counts — never a link, button, or input.
    if ((e.target as HTMLElement).closest('a,button,input,select,[role="button"]')) {
      return;
    }
    const now = Date.now();
    const t = taps.current;
    t.n = now - t.at > TAP_RESET_WINDOW_MS ? 1 : t.n + 1;
    t.at = now;
    if (t.n >= TAPS_TO_REVEAL) {
      t.n = 0;
      setStreamOpen(true);
    }
  };

  return (
    <>
      {open && (
        <div
          className={[
            'fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-500',
            streamOpen ? 'opacity-0 pointer-events-none' : 'opacity-100',
          ].join(' ')}
          onClick={onClose}
        />
      )}
      <nav
        onPointerDown={onPanelPointerDown}
        className={[
          // The menu dissolves into water on reveal (opacity, not a slide), and
          // reforms from the same place when the stream settles closed.
          'fixed top-0 right-0 bottom-0 w-[80%] max-w-[300px] bg-[#0e0e1a] border-l border-[#1e1e30] z-50 flex flex-col transition-all duration-500',
          open ? 'translate-x-0' : 'translate-x-full',
          streamOpen ? 'opacity-0 pointer-events-none' : 'opacity-100',
        ].join(' ')}
        style={{ paddingTop: 'max(2.4rem, env(safe-area-inset-top))' }}
      >
        <div className="px-5 pb-4 flex items-center justify-between border-b border-[#1e1e30]">
          <span className="font-black text-white text-base">{t('setup.menu.title')}</span>
          <button
            onClick={onClose}
            aria-label={t('setup.menu.close.aria')}
            className="text-[#8080cc] hover:text-white"
            style={{ minWidth: 36, minHeight: 36 }}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
          <Link href="/" onClick={onClose} className={itemClass(isHome)} style={{ minHeight: 44 }}>
            <span className="text-lg">🏠</span>
            {t('setup.menu.home')}
            <span className="ml-auto text-[#444466]">›</span>
          </Link>

          <Link
            href="/setup?view=routes"
            onClick={onClose}
            className={itemClass(isRoutes)}
            style={{ minHeight: 44 }}
          >
            <span className="text-lg">🚌</span>
            {t('setup.menu.routes')}
            <span className="ml-auto text-[#444466]">›</span>
          </Link>

          <Link
            href="/setup?view=backup"
            onClick={onClose}
            className={itemClass(isBackup)}
            style={{ minHeight: 44 }}
          >
            <span className="text-lg">📦</span>
            {t('setup.menu.backup')}
            <span className="ml-auto text-[#444466]">›</span>
          </Link>

          {/* Language — selects in place, no navigation */}
          <div className="mt-2 px-4 py-3 rounded-2xl bg-[#13131f] border border-[#1e1e30] flex flex-col gap-2">
            <p className="flex items-center gap-3 font-bold text-sm text-[#d6d6f5]">
              <span className="text-lg">🌐</span>
              {t('setup.language_section')}
            </p>
            <div className="flex gap-2">
              {(['en', 'bg'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={[
                    'flex-1 py-2 rounded-xl border font-bold text-xs transition-all duration-100 active:scale-[0.97]',
                    lang === l
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
                      : 'bg-[#0c0c16] border-[#1e1e30] text-[#8080cc] hover:border-[#3333aa] hover:text-white',
                  ].join(' ')}
                  style={{ minHeight: 40 }}
                >
                  {l === 'en' ? 'English' : 'Български'}
                </button>
              ))}
            </div>
          </div>

          <Link
            href="/about"
            onClick={onClose}
            className={`mt-2 ${itemClass(isAbout)}`}
            style={{ minHeight: 44 }}
          >
            <span className="text-lg">ℹ️</span>
            {t('welcome.about')}
            <span className="ml-auto text-[#444466]">›</span>
          </Link>
        </div>
      </nav>

      {/* The stream: surfaces above the dissolving menu, fades in like water. */}
      {streamOpen && (
        <div className="fixed inset-0 z-[60] bg-[#0c0c16] animate-[fadeIn_700ms_ease-out]">
          <Stream onClose={() => setStreamOpen(false)} />
        </div>
      )}
    </>
  );
}
