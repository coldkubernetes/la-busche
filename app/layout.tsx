import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AutoSync } from '@/components/sync/AutoSync';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'La Busche',
  description: 'Personal Sofia public transport arrivals',
  appleWebApp: {
    capable: true,
    title: 'La Busche',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0c0c16',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg" className={inter.variable}>
      <body className="desktop-backdrop min-h-screen bg-[#0c0c16] text-[#f0f0ff] font-sans md:relative md:flex md:h-screen md:items-center md:justify-center md:overflow-hidden">
        <AutoSync />
        {/* Desktop-only decorative backdrop: faint La Busche wordmark in the
            gutters either side of the mobile shell. Hidden on mobile. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden select-none items-center justify-between px-[5vw] md:flex"
        >
          <span className="rotate-180 text-7xl font-black tracking-tight text-[#16162a] [writing-mode:vertical-rl]">
            La Busche
          </span>
          <span className="text-7xl font-black tracking-tight text-[#16162a] [writing-mode:vertical-rl]">
            La Busche
          </span>
        </div>
        {/* Mobile shell: full width on mobile (unchanged); a centered 480px
            column with its own scroll, border and soft shadow on desktop. */}
        <div className="relative z-10 w-full bg-[#0c0c16] md:h-full md:w-[480px] md:overflow-y-auto md:overflow-x-hidden md:border-x md:border-[#1e1e30] md:shadow-[0_0_60px_rgba(0,0,0,0.55)]">
          {children}
        </div>
      </body>
    </html>
  );
}
