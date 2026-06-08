'use client';

import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
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
          aria-label="Back to home"
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#13131f] border border-[#1e1e30] text-[#8888cc] text-lg hover:text-white hover:border-[#3333aa] active:scale-95 transition-all duration-100"
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
        <p className="text-sm text-[#9090cc] leading-relaxed mb-6">
          A personal Sofia public transport app, built because I got tired of checking the stops in Google Maps.
        </p>

        <Divider />

        <Section title="What it does">
          <p className="text-sm text-[#8080cc] leading-relaxed">
            Shows live and scheduled departures for stops you care about, organised into From Home and To Home views.
            You configure your own stops once, and it just works. No account. No ads. No data collected.
          </p>
        </Section>

        <Divider />

        <Section title="Data">
          <p className="text-sm text-[#8080cc] leading-relaxed mb-3">
            Transit data is provided by Sofia Urban Mobility Center under Creative Commons Attribution 4.0 International (CC BY 4.0).
          </p>
          <div className="text-xs text-[#555577] font-mono leading-relaxed">
            <p>Source: gtfs.sofiatraffic.bg</p>
            <p>License: creativecommons.org/licenses/by/4.0</p>
          </div>
        </Section>

        <Divider />

        <Section title="Open source">
          <p className="text-sm text-[#8080cc] leading-relaxed mb-3">
            The source code is published under the MIT License and available on GitHub.
            You can self-host it, fork it, or adapt it for another city's GTFS feed.
          </p>
          <p className="text-xs text-[#555577] font-mono">
            → github.com/coldkubernetes/la-busche
          </p>
        </Section>

        <Divider />

        <Section title="Disclaimer">
          <p className="text-sm text-[#8080cc] leading-relaxed">
            This app is provided as-is, with no warranty of any kind. Departure times depend on open data
            feeds that may be delayed, incomplete, or temporarily unavailable. Don't use this as your only
            source of truth when timing matters.
          </p>
        </Section>

        <Divider />

        <Section title="Contact">
          {/* Email rendered in reverse with RTL override — reads correctly in browser, not parseable by scrapers */}
          <p
            className="text-sm text-[#8080cc] font-mono select-all"
            style={{ direction: 'rtl', unicodeBidi: 'bidi-override' }}
          >
            ten.lufesutsomal@ehcsub-al
          </p>
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
      <h2 className="text-xs font-bold text-[#555577] tracking-widest uppercase">{title}</h2>
      {children}
    </div>
  );
}
