'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export default function AboutPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  // Assembled client-side only — absent from SSR HTML, invisible to scrapers
  useEffect(() => {
    setEmail('la-busche' + String.fromCharCode(64) + 'almostuseful.net');
  }, []);

  return (
    <main
      className="min-h-screen bg-[#0c0c16] flex flex-col px-5"
      style={{
        paddingTop: 'max(3rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/"
          aria-label={t('about.back.aria')}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#13131f] border border-[#1e1e30] text-[#9595d4] text-lg hover:text-white hover:border-[#3333aa] active:scale-95 transition-all duration-100"
        >
          ←
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[1.8rem] leading-none">🚌</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[2rem] font-black tracking-tight text-white leading-none">La</span>
            <span className="text-[2rem] font-black tracking-tight leading-none bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Busche
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-md mx-auto flex flex-col">
        <p className="text-sm text-[#9595d4] leading-relaxed mb-6">
          {t('about.intro')}
        </p>

        <Divider />

        <Section title={t('about.section.what')}>
          <p className="text-sm text-[#9595d4] leading-relaxed">
            {t('about.what.body')}
          </p>
        </Section>

        <Divider />

        <Section title={t('about.section.data')}>
          <p className="text-sm text-[#9595d4] leading-relaxed mb-3">
            {t('about.data.body')}
          </p>
          <div className="text-xs text-[#9595d4] font-mono leading-relaxed">
            <p>{t('about.data.source')}</p>
            <p>{t('about.data.license')}</p>
          </div>
        </Section>

        <Divider />

        <Section title={t('about.section.opensource')}>
          <p className="text-sm text-[#9595d4] leading-relaxed mb-3">
            {t('about.opensource.body')}
          </p>
          <p className="text-xs text-[#9595d4] font-mono">
            {t('about.opensource.link')}
          </p>
        </Section>

        <Divider />

        <Section title={t('about.section.disclaimer')}>
          <p className="text-sm text-[#9595d4] leading-relaxed">
            {t('about.disclaimer.body')}
          </p>
        </Section>

        <Divider />

        <Section title={t('about.section.contact')}>
          <p className="text-sm text-[#9595d4] font-mono select-all">{email}</p>
        </Section>
      </div>
    </main>
  );
}

function Divider() {
  return <div className="h-px bg-[#1e1e30] my-5" />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-bold text-[#9595d4] tracking-widest uppercase">{title}</h2>
      {children}
    </div>
  );
}
