'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { initConfig } from '@/lib/tile-config';
import { useTranslation, setLanguage } from '@/lib/i18n';

type WelcomeMode = 'firstRun' | 'about';

const POINTS = [
  { emoji: '⏱️', titleKey: 'welcome.point1.title', descKey: 'welcome.point1.desc' },
  { emoji: '🚏', titleKey: 'welcome.point2.title', descKey: 'welcome.point2.desc' },
  { emoji: '📱', titleKey: 'welcome.point3.title', descKey: 'welcome.point3.desc' },
  { emoji: '☁️', titleKey: 'welcome.point4.title', descKey: 'welcome.point4.desc' },
] as const;

export function Welcome({ mode, onDismiss }: { mode: WelcomeMode; onDismiss?: () => void }) {
  const router = useRouter();
  const { t, lang } = useTranslation();

  function handleSetup() {
    initConfig();
    router.push('/setup/new');
  }

  function handleSkip() {
    initConfig();
    onDismiss?.();
  }

  function handleClose() {
    router.back();
  }

  return (
    <main
      className="min-h-screen bg-[#0c0c16] flex flex-col px-5"
      style={{
        paddingTop: 'max(3rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Language toggle — top-right, always visible before any text */}
      <div className="flex justify-end gap-1 pt-1">
        {(['en', 'bg'] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLanguage(l)}
            className={[
              'px-3 rounded-xl text-xs font-bold transition-all duration-100 active:scale-[0.97]',
              lang === l
                ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-200'
                : 'text-[#9595d4] hover:text-white',
            ].join(' ')}
            style={{ minHeight: 36, minWidth: 44 }}
          >
            {l === 'en' ? 'EN' : 'БГ'}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-center w-full max-w-md mx-auto py-6">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-[2.5rem] leading-none">🚌</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[2.6rem] font-black tracking-tight text-white leading-none">La</span>
            <span className="text-[2.6rem] font-black tracking-tight leading-none bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Busche
            </span>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-center text-sm text-[#9595d4] mb-8">
          {t('welcome.tagline')}
        </p>

        {/* Feature points */}
        <div className="flex flex-col gap-3 mb-8">
          {POINTS.map((point) => (
            <div
              key={point.titleKey}
              className="flex items-start gap-3 rounded-2xl bg-[#13131f] border border-[#1e1e30] p-4"
            >
              <span className="text-2xl leading-none flex-shrink-0">{point.emoji}</span>
              <div className="min-w-0">
                <p className="text-white font-bold text-sm leading-snug">{t(point.titleKey)}</p>
                <p className="text-xs text-[#9595d4] mt-0.5 leading-relaxed">{t(point.descKey)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Credit */}
        <p className="text-center text-xs text-[#9595d4] leading-relaxed mb-3 px-2">
          {t('welcome.credit')}
        </p>

        {/* Language availability note */}
        <p className="text-center text-xs text-[#9595d4] leading-relaxed mb-8 px-2">
          {t('welcome.language_note')}
        </p>

        {/* Actions */}
        {mode === 'firstRun' ? (
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleSetup}
              className="w-full py-4 rounded-2xl bg-indigo-500 text-white font-bold text-sm hover:bg-indigo-400 active:scale-[0.97] transition-all duration-100"
            >
              {t('welcome.cta')}
            </button>
            <button
              onClick={handleSkip}
              className="text-sm font-semibold text-[#9595d4] hover:text-white transition-colors"
              style={{ minHeight: 44 }}
            >
              {t('welcome.skip')}
            </button>
            <Link
              href="/about"
              className="text-[0.65rem] text-[#9595d4] hover:text-white tracking-widest uppercase font-semibold transition-colors"
            >
              About · Open Source · CC BY 4.0
            </Link>
          </div>
        ) : (
          <button
            onClick={handleClose}
            className="w-full py-4 rounded-2xl bg-[#13131f] border border-[#1e1e30] text-[#9090cc] font-bold text-sm hover:border-[#3333aa] hover:text-white active:scale-[0.97] transition-all duration-100"
          >
            {t('welcome.close')}
          </button>
        )}
      </div>
    </main>
  );
}
