'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslation, setLanguage } from '@/lib/i18n';

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

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      <nav
        className={[
          'fixed top-0 right-0 bottom-0 w-[80%] max-w-[300px] bg-[#0e0e1a] border-l border-[#1e1e30] z-50 flex flex-col transition-transform duration-200',
          open ? 'translate-x-0' : 'translate-x-full',
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
    </>
  );
}
