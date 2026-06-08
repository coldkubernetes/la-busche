'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { loadConfig, saveConfig, type TileConfig } from '@/lib/tile-config';
import { requestSync } from '@/lib/sync/backgroundSync';
import { EMOJI_SET } from '@/lib/config';
import { useTranslation } from '@/lib/i18n';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardState {
  category: 'from_home' | 'to_home';
  label: string;
  emoji: string;
  stopId: string;
  stopName: string;
  selectedLines: string[];
}

interface StopResult {
  stopId: string;
  stopName: string;
  stopCode: string;
  directionHint: string;
  lineCount: number;
}

interface LineResult {
  routeId: string;
  shortName: string;
  type: 'bus' | 'trolleybus' | 'tram';
  headsigns: string[];
}

interface LinesResponse {
  stopId: string;
  stopName: string;
  lines: LineResult[];
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TileWizardProps {
  mode: 'new' | 'edit';
  existingTile?: TileConfig;
}

const INITIAL_STATE: WizardState = {
  category: 'from_home',
  label: '',
  emoji: '🚌',
  stopId: '',
  stopName: '',
  selectedLines: [],
};

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={[
            'rounded-full transition-all duration-200',
            i + 1 === current
              ? 'w-5 h-2 bg-indigo-400'
              : i + 1 < current
              ? 'w-2 h-2 bg-indigo-500/60'
              : 'w-2 h-2 bg-[#2a2a44]',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

// ─── Main wizard component ────────────────────────────────────────────────────

export function TileWizard({ mode, existingTile }: TileWizardProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(() =>
    existingTile
      ? {
          category: existingTile.category,
          label: existingTile.label,
          emoji: existingTile.emoji,
          stopId: existingTile.stopId,
          stopName: existingTile.stopName,
          selectedLines: existingTile.lines,
        }
      : INITIAL_STATE
  );

  // Stop search state — pre-fill with existing stop name in edit mode
  const [stopQuery, setStopQuery] = useState(existingTile?.stopName ?? '');
  const [stopResults, setStopResults] = useState<StopResult[]>([]);
  const [stopSearching, setStopSearching] = useState(false);

  // Lines state
  const [availableLines, setAvailableLines] = useState<LineResult[]>([]);
  const [linesLoading, setLinesLoading] = useState(false);

  // ── Stop search with debounce ───────────────────────────────────────────────
  useEffect(() => {
    if (stopQuery.length < 2) { setStopResults([]); return; }
    const timer = setTimeout(async () => {
      setStopSearching(true);
      try {
        const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
        const res = await fetch(`${base}/api/stops/search?q=${encodeURIComponent(stopQuery)}`);
        setStopResults(await res.json());
      } catch { /* ignore */ } finally {
        setStopSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [stopQuery]);

  // ── Load lines when stop is set ────────────────────────────────────────────
  useEffect(() => {
    if (!state.stopId) return;
    setLinesLoading(true);
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
    fetch(`${base}/api/stops/${state.stopId}/lines`)
      .then((r) => r.json() as Promise<LinesResponse>)
      .then((data) => setAvailableLines(data.lines))
      .catch(() => {/* ignore */})
      .finally(() => setLinesLoading(false));
  }, [state.stopId]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goNext = useCallback(() => setStep((s) => Math.min(4, s + 1)), []);
  const goBack = useCallback(() => {
    if (step === 1) router.push('/setup');
    else setStep((s) => s - 1);
  }, [step, router]);

  // ── Save ───────────────────────────────────────────────────────────────────
  function handleSave() {
    const config = loadConfig();
    if (mode === 'edit' && existingTile) {
      const updated: TileConfig = {
        ...existingTile,
        category: state.category,
        label: state.label.trim(),
        emoji: state.emoji,
        stopId: state.stopId,
        stopName: state.stopName,
        lines: state.selectedLines,
      };
      saveConfig({
        ...config,
        tiles: config.tiles.map((t) => (t.tileId === existingTile.tileId ? updated : t)),
      });
    } else {
      const newTile: TileConfig = {
        tileId: nanoid(8),
        category: state.category,
        label: state.label.trim(),
        emoji: state.emoji,
        stopId: state.stopId,
        stopName: state.stopName,
        lines: state.selectedLines,
        order: config.tiles.length,
      };
      saveConfig({ ...config, tiles: [...config.tiles, newTile] });
    }
    requestSync();
    router.push('/setup');
  }

  // ── Can proceed checks ─────────────────────────────────────────────────────
  const canGoStep2 = state.label.trim().length > 0;
  const canGoStep3 = !!state.stopId;
  const canSave = state.selectedLines.length > 0;

  // ── Slide direction (simple fade-between-steps) ────────────────────────────
  const titleMap: Record<number, string> = {
    1: t('wizard.step1.title'),
    2: t('wizard.step2.title'),
    3: t('wizard.step3.title'),
    4: t('wizard.step4.title'),
  };

  return (
    <div
      className="bg-[#0c0c16] flex flex-col"
      style={{
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Wizard header */}
      <header className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-[#1e1e30]">
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={goBack}
            className="flex items-center justify-center text-[#8888cc] hover:text-white transition-colors"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <span>{step === 1 ? t('wizard.cancel') : t('wizard.back')}</span>
          </button>
          <span className="text-sm font-bold text-white">{titleMap[step]}</span>
          <div style={{ minWidth: 44 }} />
        </div>
        <StepDots current={step} total={4} />
      </header>

      {/* Step body — scrolls independently */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-6 pb-4">
        {step === 1 && <Step1 state={state} onChange={(p) => setState((s) => ({ ...s, ...p }))} />}
        {step === 2 && (
          <Step2
            query={stopQuery}
            setQuery={setStopQuery}
            results={stopResults}
            searching={stopSearching}
            selectedId={state.stopId}
            selectedName={state.stopName}
            onSelect={(stop) => {
              setState((s) => ({
                ...s,
                stopId: stop.stopId,
                stopName: stop.stopName,
                selectedLines: [],
              }));
            }}
          />
        )}
        {step === 3 && (
          <Step3
            lines={availableLines}
            loading={linesLoading}
            selected={state.selectedLines}
            onChange={(lines) => setState((s) => ({ ...s, selectedLines: lines }))}
          />
        )}
        {step === 4 && <Step4 state={state} />}
      </div>

      {/* Sticky bottom action */}
      <div className="flex-shrink-0 px-4 pt-2 pb-3">
        {step < 4 ? (
          <button
            onClick={goNext}
            disabled={
              (step === 1 && !canGoStep2) ||
              (step === 2 && !canGoStep3) ||
              (step === 3 && !canSave)
            }
            className="w-full py-4 rounded-2xl bg-indigo-500 text-white font-black text-base active:scale-[0.98] transition-transform duration-100 disabled:opacity-40 disabled:pointer-events-none"
          >
            {t('wizard.next')}
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-2xl bg-indigo-500 text-white font-black text-base active:scale-[0.98] transition-transform duration-100"
          >
            {mode === 'edit' ? t('wizard.save_changes') : t('wizard.save')}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 1: Basics ───────────────────────────────────────────────────────────

function Step1({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-8">
      {/* Category */}
      <div>
        <p className="text-xs text-[#8080cc] font-semibold uppercase tracking-widest mb-3">
          {t('wizard.step1.category_label')}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(['from_home', 'to_home'] as const).map((cat) => {
            const active = state.category === cat;
            return (
              <button
                key={cat}
                onClick={() => onChange({ category: cat })}
                className={[
                  'py-5 rounded-2xl border text-center font-black text-sm transition-all duration-100 active:scale-[0.97]',
                  active
                    ? cat === 'from_home'
                      ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-200'
                      : 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200'
                    : 'bg-[#13131f] border-[#1e1e30] text-[#8080cc]',
                ].join(' ')}
              >
                {cat === 'from_home' ? t('wizard.step1.from_home') : t('wizard.step1.to_home')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Label */}
      <div>
        <label className="text-xs text-[#8080cc] font-semibold uppercase tracking-widest mb-3 block">
          {t('wizard.step1.label_label')}
        </label>
        <input
          type="text"
          value={state.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder={t('wizard.step1.label_placeholder')}
          className="w-full px-4 py-4 rounded-2xl bg-[#13131f] border border-[#1e1e30] text-white placeholder-[#555577] text-base focus:outline-none focus:border-indigo-500/60 transition-colors"
        />
      </div>

      {/* Emoji picker */}
      <div>
        <p className="text-xs text-[#8080cc] font-semibold uppercase tracking-widest mb-3">
          {t('wizard.step1.emoji_label')}
          <span className="ml-3 text-white normal-case tracking-normal font-normal">
            {state.emoji}
          </span>
        </p>
        <div className="grid grid-cols-8 gap-1 max-h-52 overflow-y-auto rounded-2xl bg-[#13131f] border border-[#1e1e30] p-2">
          {EMOJI_SET.map((em) => (
            <button
              key={em}
              onClick={() => onChange({ emoji: em })}
              className={[
                'flex items-center justify-center rounded-xl text-2xl transition-all duration-100 active:scale-90',
                state.emoji === em
                  ? 'bg-indigo-500/30 ring-1 ring-indigo-400/60'
                  : 'hover:bg-white/5',
              ].join(' ')}
              style={{ minWidth: 44, minHeight: 48 }}
            >
              {em}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Stop selection ───────────────────────────────────────────────────

function Step2({
  query,
  setQuery,
  results,
  searching,
  selectedId,
  selectedName,
  onSelect,
}: {
  query: string;
  setQuery: (q: string) => void;
  results: StopResult[];
  searching: boolean;
  selectedId: string;
  selectedName: string;
  onSelect: (s: StopResult) => void;
}) {
  const { t } = useTranslation();

  // Is the selected stop visible in the current results?
  const selectedInResults = results.some((r) => r.stopId === selectedId);

  return (
    <div className="flex flex-col gap-4">
      {/* Currently selected stop — always visible when a stop is chosen */}
      {selectedId && !selectedInResults && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-indigo-500/15 border border-indigo-500/50">
          <span className="text-indigo-400 text-base">✓</span>
          <div className="flex-1 min-w-0">
            <p className="text-indigo-200 font-bold text-sm leading-snug truncate">
              {selectedName}{' '}
              <span className="text-indigo-400/70 font-normal">({selectedId})</span>
            </p>
            <p className="text-xs text-indigo-400/60 mt-0.5">{t('wizard.step2.selected_hint')}</p>
          </div>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('wizard.step2.placeholder')}
          autoFocus
          className="w-full px-4 py-4 rounded-2xl bg-[#13131f] border border-[#1e1e30] text-white placeholder-[#555577] text-base focus:outline-none focus:border-indigo-500/60 transition-colors pr-10"
        />
        {searching && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8080cc] text-xs animate-pulse-soft">
            {t('wizard.step2.searching')}
          </span>
        )}
      </div>

      {/* Results */}
      {results.length === 0 && query.length >= 2 && !searching && (
        <p className="text-center text-[#8080cc] text-sm py-8">{t('wizard.step2.no_results')}</p>
      )}
      <div className="flex flex-col gap-2">
        {results.map((stop) => {
          const isSelected = stop.stopId === selectedId;
          return (
            <button
              key={stop.stopId}
              onClick={() => onSelect(stop)}
              className={[
                'text-left px-4 py-4 rounded-2xl border transition-all duration-100 active:scale-[0.98]',
                isSelected
                  ? 'bg-indigo-500/15 border-indigo-500/50'
                  : 'bg-[#13131f] border-[#1e1e30] hover:border-[#3333aa]',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm leading-snug">
                    {stop.stopName}{' '}
                    <span className="text-[#8080cc] font-normal">({stop.stopCode})</span>
                  </p>
                  {stop.directionHint && (
                    <p className="text-xs text-[#7777aa] mt-1 truncate">{stop.directionHint}</p>
                  )}
                </div>
                {stop.lineCount > 0 && (
                  <span className="flex-shrink-0 text-xs text-[#7070bb] font-semibold mt-0.5">
                    {t('wizard.step2.lines_count', { count: stop.lineCount })}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 3: Line selection ───────────────────────────────────────────────────

function Step3({
  lines,
  loading,
  selected,
  onChange,
}: {
  lines: LineResult[];
  loading: boolean;
  selected: string[];
  onChange: (lines: string[]) => void;
}) {
  const { t } = useTranslation();

  const buses = lines.filter((l) => l.type === 'bus');
  const trolleybuses = lines.filter((l) => l.type === 'trolleybus');
  const trams = lines.filter((l) => l.type === 'tram');

  const allNames = lines.map((l) => l.shortName);
  const allSelected = allNames.every((n) => selected.includes(n));

  function toggle(name: string) {
    onChange(selected.includes(name) ? selected.filter((s) => s !== name) : [...selected, name]);
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2 mt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-2xl bg-[#13131f] border border-[#1a1a2a] animate-pulse" style={{ opacity: 1 - i * 0.2 }} />
        ))}
      </div>
    );
  }

  function LineGroup({ title, items }: { title: string; items: LineResult[] }) {
    if (items.length === 0) return null;
    return (
      <div>
        <p className="text-xs text-[#8080cc] font-semibold uppercase tracking-widest mb-3">{title}</p>
        <div className="flex flex-wrap gap-2">
          {items.map((line) => {
            const active = selected.includes(line.shortName);
            return (
              <button
                key={line.routeId}
                onClick={() => toggle(line.shortName)}
                className={[
                  'flex flex-col items-center px-4 py-3 rounded-2xl border font-bold text-sm transition-all duration-100 active:scale-95 min-w-[56px]',
                  active
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
                    : 'bg-[#13131f] border-[#1e1e30] text-[#9090cc]',
                ].join(' ')}
                style={{ minHeight: 56 }}
              >
                <span className="text-base leading-tight">{line.shortName}</span>
                {line.headsigns[0] && (
                  <span className="text-[0.6rem] mt-0.5 max-w-[64px] truncate opacity-70 font-normal">
                    {line.headsigns[0]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Select-all shortcut */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#9090cc]">
          {selected.length === 0
            ? t('wizard.step3.all_hint')
            : t('wizard.step3.lines_selected', { count: selected.length })}
        </p>
        <button
          onClick={() => onChange(allSelected ? [] : allNames)}
          className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 transition-colors px-2 py-1"
          style={{ minHeight: 44 }}
        >
          {allSelected ? t('wizard.step3.deselect_all') : t('wizard.step3.select_all')}
        </button>
      </div>

      <LineGroup title={t('wizard.step3.trams')} items={trams} />
      <LineGroup title={t('wizard.step3.trolleybuses')} items={trolleybuses} />
      <LineGroup title={t('wizard.step3.buses')} items={buses} />
    </div>
  );
}

// ─── Step 4: Review ───────────────────────────────────────────────────────────

function Step4({ state }: { state: WizardState }) {
  const { t } = useTranslation();

  const rows = [
    { label: t('wizard.step4.direction'), value: state.category === 'from_home' ? t('wizard.step1.from_home') : t('wizard.step1.to_home') },
    { label: t('wizard.step4.label'), value: state.label },
    { label: t('wizard.step4.stop'), value: `${state.stopName} (${state.stopId})` },
    { label: t('wizard.step4.lines'), value: state.selectedLines.length > 0 ? state.selectedLines.join(', ') : t('wizard.step4.all_lines') },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Big tile preview */}
      <div className="relative overflow-hidden rounded-3xl p-6 bg-[#13131f] border border-[#1e1e30]">
        <div className={['absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-20', state.category === 'from_home' ? 'bg-indigo-500' : 'bg-emerald-500'].join(' ')} />
        <div className="relative z-10 flex items-center gap-4">
          <span className="text-5xl leading-none">{state.emoji}</span>
          <div>
            <p className="text-2xl font-black text-white leading-tight">{state.label || '—'}</p>
            <span className={['text-xs font-bold px-2 py-0.5 rounded-full border mt-1 inline-block', state.category === 'from_home' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'].join(' ')}>
              {state.category === 'from_home' ? '→' : '←'}
            </span>
          </div>
        </div>
      </div>

      {/* Summary rows */}
      <div className="flex flex-col gap-0 rounded-2xl bg-[#13131f] border border-[#1e1e30] overflow-hidden">
        {rows.map((row, i) => (
          <div key={row.label} className={['px-4 py-4 flex items-start justify-between gap-4', i > 0 ? 'border-t border-[#1a1a2a]' : ''].join(' ')}>
            <p className="text-xs text-[#7777aa] font-semibold uppercase tracking-wider flex-shrink-0 pt-0.5">{row.label}</p>
            <p className="text-sm text-white font-semibold text-right">{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
