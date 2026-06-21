'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadConfig, saveConfig, validateConfig, STORAGE_KEY, type AppConfig, type TileConfig } from '@/lib/tile-config';
import { useTranslation } from '@/lib/i18n';
import { hasAppKey, buildAuthUrl, exchangeCode, getTokens, clearTokens, isConnected, downloadFile, type DropboxTokens } from '@/lib/sync/dropboxSync';
import { getSyncState, setSyncState, updateLastSynced, formatLastSynced } from '@/lib/sync/syncState';
import { requestSync, syncNow } from '@/lib/sync/backgroundSync';
import { SettingsDrawer } from '@/components/SettingsDrawer';

// ─── Draggable tile list ──────────────────────────────────────────────────────

const ITEM_HEIGHT = 80;

function DraggableTileList({
  tiles,
  onReorder,
  onEdit,
  onDelete,
}: {
  tiles: TileConfig[];
  onReorder: (tiles: TileConfig[]) => void;
  onEdit: (tileId: string) => void;
  onDelete: (tileId: string) => void;
}) {
  const { t } = useTranslation();
  const [items, setItems] = useState<TileConfig[]>(tiles);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const dragRef = useRef<{
    id: string;
    currentIndex: number;
    startY: number;
    currentItems: TileConfig[];
  } | null>(null);

  useEffect(() => { setItems(tiles); }, [tiles]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, tileId: string, index: number) => {
      e.preventDefault();

      dragRef.current = {
        id: tileId,
        currentIndex: index,
        startY: e.clientY,
        currentItems: [...items],
      };
      setDraggingId(tileId);

      function onMove(ev: PointerEvent) {
        const d = dragRef.current;
        if (!d) return;
        const dy = ev.clientY - d.startY;
        const delta = Math.round(dy / ITEM_HEIGHT);
        const newIdx = Math.max(0, Math.min(d.currentItems.length - 1, d.currentIndex + delta));
        if (newIdx !== d.currentIndex) {
          const next = [...d.currentItems];
          const [removed] = next.splice(d.currentIndex, 1);
          next.splice(newIdx, 0, removed);
          d.currentItems = next;
          d.currentIndex = newIdx;
          d.startY = ev.clientY;
          setItems(next);
        }
      }

      function onUp() {
        const d = dragRef.current;
        if (!d) return;
        const final = d.currentItems.map((t, i) => ({ ...t, order: i }));
        setItems(final);
        onReorder(final);
        dragRef.current = null;
        setDraggingId(null);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      }

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [items, onReorder]
  );

  return (
    <div className="flex flex-col gap-2">
      {items.map((tile, index) => {
        const isDragging = draggingId === tile.tileId;
        const isFromHome = tile.category === 'from_home';
        return (
          <div
            key={tile.tileId}
            className={[
              'flex items-center gap-1 rounded-2xl bg-[#13131f] border transition-all duration-150',
              isDragging
                ? 'border-indigo-500/40 bg-indigo-500/5 shadow-xl scale-[1.01]'
                : 'border-[#1e1e30]',
            ].join(' ')}
            style={{ minHeight: ITEM_HEIGHT }}
          >
            {/* Drag handle */}
            <div
              onPointerDown={(e) => handlePointerDown(e, tile.tileId, index)}
              className="touch-none flex-shrink-0 flex items-center justify-center text-[#444466] cursor-grab active:cursor-grabbing select-none"
              style={{ minWidth: 44, minHeight: ITEM_HEIGHT }}
            >
              <span className="text-xl leading-none">⠿</span>
            </div>

            {/* Tile info */}
            <div className="flex-1 min-w-0 flex items-center gap-3 py-3">
              <span className="text-2xl leading-none flex-shrink-0">{tile.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-bold text-sm leading-snug truncate max-w-[140px]">
                    {tile.label}
                  </p>
                  <span
                    className={[
                      'flex-shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-md',
                      isFromHome
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'bg-emerald-500/20 text-emerald-300',
                    ].join(' ')}
                  >
                    {isFromHome ? '→' : '←'}
                  </span>
                </div>
                <p className="text-xs text-[#7777aa] mt-0.5 truncate">{tile.stopName}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center flex-shrink-0">
              <button
                onClick={() => onEdit(tile.tileId)}
                aria-label={t('setup.tile.edit.aria')}
                className="flex items-center justify-center text-[#8888cc] hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                style={{ minWidth: 44, minHeight: 44 }}
              >
                <span className="text-base">✏️</span>
              </button>
              <button
                onClick={() => onDelete(tile.tileId)}
                aria-label={t('setup.tile.delete.aria')}
                className="flex items-center justify-center text-[#8888cc] hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors mr-1"
                style={{ minWidth: 44, minHeight: 44 }}
              >
                <span className="text-base">🗑️</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Setup page ───────────────────────────────────────────────────────────────

export default function SetupPage() {
  return (
    <Suspense fallback={null}>
      <SetupPageInner />
    </Suspense>
  );
}

function SetupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeView = searchParams.get('view') === 'backup' ? 'backup' : 'routes';
  const { t } = useTranslation();
  const [config, setConfig] = useState<AppConfig>({ version: 1, tiles: [], updatedAt: new Date(0).toISOString() });
  const [mounted, setMounted] = useState(false);
  const [importError, setImportError] = useState('');
  const [importPending, setImportPending] = useState<{
    data: AppConfig;
    currentCount: number;
    importedCount: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state
  const [dropboxKey, setDropboxKey] = useState(false);
  const [tokens, setTokens] = useState<DropboxTokens | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [oauthPending, setOauthPending] = useState(false);
  const [restorePrompt, setRestorePrompt] = useState<{
    remoteConfig: AppConfig;
    tileCount: number;
    date: string;
  } | null>(null);
  const [, setTick] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const cfg = loadConfig();
    setConfig(cfg);
    setMounted(true);

    // Sync state init
    setDropboxKey(hasAppKey());
    setTokens(getTokens());
    setLastSynced(getSyncState().lastSynced);

    // Listen for config updates pushed by background sync (remote wins)
    function onConfigUpdated() {
      setConfig(loadConfig());
      setLastSynced(getSyncState().lastSynced);
    }
    window.addEventListener('la-busche:config-updated', onConfigUpdated);

    // Tick every minute to keep "X minutes ago" fresh
    const tickId = setInterval(() => setTick((n) => n + 1), 60_000);

    // If router.replace caused a remount, the OAuth .then() ran on the old component.
    // Pick up the restore candidate that was stashed before the navigation.
    const restoreCandidateRaw = sessionStorage.getItem('la-busche:restore-candidate');
    if (restoreCandidateRaw) {
      sessionStorage.removeItem('la-busche:restore-candidate');
      try {
        const parsed: unknown = JSON.parse(restoreCandidateRaw);
        if (validateConfig(parsed) && parsed.tiles.length > 0) {
          setRestorePrompt({ remoteConfig: parsed, tileCount: parsed.tiles.length, date: parsed.updatedAt });
        }
      } catch { /* ignore */ }
    }

    // Handle OAuth callback
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setOauthPending(true);
      exchangeCode(code)
        .then(async () => {
          const t = getTokens();
          setTokens(t);
          setSyncState({ provider: 'dropbox' });

          // If local is empty, check whether Dropbox has a backup to restore
          const localCfg = loadConfig();
          if (localCfg.tiles.length === 0) {
            try {
              const raw = await downloadFile('/la-busche-config.json');
              if (raw) {
                const parsed: unknown = JSON.parse(raw);
                if (validateConfig(parsed) && parsed.tiles.length > 0) {
                  // Stash in sessionStorage BEFORE router.replace — if Next.js
                  // remounts the component, the mount effect will pick it up.
                  sessionStorage.setItem('la-busche:restore-candidate', raw);
                  setRestorePrompt({ remoteConfig: parsed, tileCount: parsed.tiles.length, date: parsed.updatedAt });
                  router.replace('/setup');
                  return;
                }
              }
            } catch { /* non-fatal — fall through to normal sync */ }
          }

          router.replace('/setup');
          void syncNow().then(() => setLastSynced(getSyncState().lastSynced));
        })
        .catch(() => setSyncError(t('sync.error.connect_failed')))
        .finally(() => setOauthPending(false));
    }

    return () => {
      window.removeEventListener('la-busche:config-updated', onConfigUpdated);
      clearInterval(tickId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedTiles = [...config.tiles].sort((a, b) => a.order - b.order);

  function handleReorder(newTiles: TileConfig[]) {
    const updated: AppConfig = { ...config, tiles: newTiles };
    setConfig(updated);
    saveConfig(updated);
    requestSync();
  }

  function handleDelete(tileId: string) {
    if (!confirm(t('setup.delete.confirm'))) return;
    const updated: AppConfig = {
      ...config,
      tiles: config.tiles
        .filter((t) => t.tileId !== tileId)
        .map((t, i) => ({ ...t, order: i })),
    };
    setConfig(updated);
    saveConfig(updated);
    requestSync();
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  function handleExport() {
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'la-busche-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Import ─────────────────────────────────────────────────────────────────
  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!validateConfig(data)) {
          setImportError(t('setup.import.invalid'));
          return;
        }
        setImportPending({
          data: data as AppConfig,
          currentCount: config.tiles.length,
          importedCount: (data as AppConfig).tiles.length,
        });
      } catch {
        setImportError(t('setup.import.invalid'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function confirmImport() {
    if (!importPending) return;
    setConfig(importPending.data);
    saveConfig(importPending.data);
    setImportPending(null);
    requestSync();
  }

  // ── Dropbox sync actions ────────────────────────────────────────────────────
  async function handleConnect() {
    const url = await buildAuthUrl();
    window.location.href = url;
  }

  async function handleSyncNow() {
    setSyncing(true);
    setSyncError('');
    try {
      await syncNow();
      setLastSynced(getSyncState().lastSynced);
      setConfig(loadConfig());
    } catch {
      setSyncError(t('sync.error.sync_failed'));
    } finally {
      setSyncing(false);
    }
  }

  function handleDisconnect() {
    clearTokens();
    setSyncState({ provider: null });
    setTokens(null);
    setLastSynced(null);
  }

  function confirmRestore() {
    sessionStorage.removeItem('la-busche:restore-candidate');
    if (!restorePrompt) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(restorePrompt.remoteConfig));
    setConfig(restorePrompt.remoteConfig);
    window.dispatchEvent(new CustomEvent('la-busche:config-updated'));
    setRestorePrompt(null);
    void syncNow().then(() => setLastSynced(getSyncState().lastSynced));
  }

  function dismissRestore() {
    sessionStorage.removeItem('la-busche:restore-candidate');
    setRestorePrompt(null);
    void syncNow().then(() => setLastSynced(getSyncState().lastSynced));
  }

  return (
    <main
      className="h-screen bg-[#0c0c16] flex flex-col overflow-hidden"
      style={{ paddingTop: 'max(3rem, env(safe-area-inset-top))' }}
    >
      {/* Header — fixed, never scrolls away, so the menu is always reachable */}
      <header className="flex-shrink-0 px-4 pt-3 pb-4 flex items-center justify-between border-b border-[#1e1e30]">
        <Link
          href="/"
          className="flex items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/30 px-3 text-indigo-300 font-bold text-sm hover:bg-indigo-500/20 hover:border-indigo-500/50 active:scale-[0.97] transition-all duration-150"
          style={{ minHeight: 44 }}
        >
          {t('setup.done')}
        </Link>
        <h1 className="text-lg font-black text-white">
          {activeView === 'backup' ? t('setup.menu.backup') : t('setup.title')}
        </h1>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label={t('setup.menu.aria')}
          className="flex flex-col items-center justify-center gap-[3px]"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <span className="block w-5 h-0.5 rounded-full bg-[#c7c7f0]" />
          <span className="block w-5 h-0.5 rounded-full bg-[#c7c7f0]" />
          <span className="block w-5 h-0.5 rounded-full bg-[#c7c7f0]" />
        </button>
      </header>

      {/* Body — only this area scrolls */}
      <div
        className="flex-1 overflow-y-auto px-4 pt-6 flex flex-col gap-6"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        {activeView === 'routes' ? (
          <div className="flex flex-col gap-3">
            <Link
              href="/setup/new"
              className="flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-indigo-500/40 text-indigo-400 font-bold text-sm hover:bg-indigo-500/5 hover:border-indigo-500/60 active:scale-[0.97] transition-all duration-100"
            >
              {t('setup.add')}
            </Link>
            {mounted && sortedTiles.length > 0 && (
              <p className="text-xs text-[#8080cc] font-semibold uppercase tracking-widest mt-1">
                {t('setup.tiles_section')}
              </p>
            )}
            {!mounted ? (
              <div className="flex flex-col gap-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 rounded-2xl bg-[#13131f] border border-[#1a1a2a] animate-pulse" style={{ opacity: 1 - i * 0.3 }} />
                ))}
              </div>
            ) : sortedTiles.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl mb-3 block">🚌</span>
                <p className="text-[#8080cc] text-sm whitespace-pre-line">{t('setup.empty')}</p>
              </div>
            ) : (
              <DraggableTileList
                tiles={sortedTiles}
                onReorder={handleReorder}
                onEdit={(id) => router.push(`/setup/edit/${id}`)}
                onDelete={handleDelete}
              />
            )}
          </div>
        ) : (
          <>
            {/* Dropbox Sync */}
            <div className="flex flex-col gap-3">
              <p className="text-xs text-[#555577] font-semibold uppercase tracking-widest">
                {t('sync.section_title')}
              </p>

              {oauthPending ? (
                <div className="px-4 py-4 rounded-2xl bg-[#13131f] border border-[#1e1e30] text-center text-sm text-[#8080cc] animate-pulse">
                  {t('sync.connecting')}
                </div>
              ) : !dropboxKey ? (
                <div className="px-4 py-4 rounded-2xl bg-[#13131f] border border-[#1e1e30]">
                  <p className="text-sm text-[#7777aa] leading-relaxed">
                    {t('sync.no_key.before')}{' '}
                    <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded text-[#aaaadd]">
                      NEXT_PUBLIC_LA_BUSCHE_DROPBOX_APP_KEY
                    </code>{' '}
                    {t('sync.no_key.after')}
                  </p>
                </div>
              ) : isConnected() && tokens ? (
                <div className="flex flex-col gap-3">
                  <div className="px-4 py-4 rounded-2xl bg-[#13131f] border border-[#1e1e30] flex flex-col gap-1">
                    <p className="text-sm font-semibold text-white">
                      {tokens.displayName ?? t('sync.dropbox_account')}
                    </p>
                    {tokens.email && (
                      <p className="text-xs text-[#7777aa]">{tokens.email}</p>
                    )}
                    <p className="text-xs text-[#555577] mt-1">
                      {t('sync.last_synced', { time: formatLastSynced(lastSynced) })}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleSyncNow}
                      disabled={syncing}
                      className="py-4 rounded-2xl bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 font-semibold text-sm hover:bg-indigo-500/25 active:scale-[0.97] transition-all duration-100 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {syncing ? t('sync.syncing') : t('sync.sync_now')}
                    </button>
                    <button
                      onClick={handleDisconnect}
                      className="py-4 rounded-2xl bg-[#13131f] border border-[#1e1e30] text-[#9090cc] font-semibold text-sm hover:border-rose-500/40 hover:text-rose-400 active:scale-[0.97] transition-all duration-100"
                    >
                      {t('sync.disconnect')}
                    </button>
                  </div>
                  {syncError && (
                    <p className="text-xs text-rose-400 px-1">{syncError}</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleConnect}
                    className="py-4 rounded-2xl bg-[#13131f] border border-[#2a2a5a] text-indigo-300 font-semibold text-sm hover:bg-indigo-500/10 hover:border-indigo-500/50 active:scale-[0.97] transition-all duration-100"
                  >
                    {t('sync.connect')}
                  </button>
                  {syncError && (
                    <p className="text-xs text-rose-400 px-1">{syncError}</p>
                  )}
                </div>
              )}
            </div>

            {/* JSON file */}
            <div className="border-t border-[#1e1e30] pt-6 flex flex-col gap-3">
              <p className="text-xs text-[#555577] font-semibold uppercase tracking-widest">
                {t('setup.backup.json_section')}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleExport}
                  className="py-4 rounded-2xl bg-[#13131f] border border-[#1e1e30] text-[#9090cc] font-semibold text-sm hover:border-[#3333aa] hover:text-white active:scale-[0.97] transition-all duration-100"
                >
                  {t('setup.export')}
                </button>
                <button
                  onClick={handleImportClick}
                  className="py-4 rounded-2xl bg-[#13131f] border border-[#1e1e30] text-[#9090cc] font-semibold text-sm hover:border-[#3333aa] hover:text-white active:scale-[0.97] transition-all duration-100"
                >
                  {t('setup.import')}
                </button>
              </div>
              <p className="text-xs text-[#555577]">{t('setup.backup.json_hint')}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </>
        )}
      </div>

      {/* Menu drawer */}
      <SettingsDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Dropbox restore prompt */}
      {restorePrompt && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-[#13131f] border border-[#2a2a44] rounded-3xl p-6 w-full max-w-sm">
            <p className="text-white font-bold text-base mb-3">{t('sync.restore.title')}</p>
            <p className="text-sm text-[#9090cc] mb-6">
              {t('sync.restore.before_date')}{' '}
              <span className="text-white">{new Date(restorePrompt.date).toLocaleString()}</span>{' '}
              {t('sync.restore.before_count')}{' '}
              <span className="text-white">
                {restorePrompt.tileCount === 1
                  ? t('sync.restore.tile_one', { count: restorePrompt.tileCount })
                  : t('sync.restore.tile_other', { count: restorePrompt.tileCount })}
              </span>.{' '}
              {t('sync.restore.after')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={dismissRestore}
                className="py-3 rounded-2xl bg-[#1a1a2e] text-[#9090cc] font-semibold text-sm active:scale-95 transition-transform"
              >
                {t('sync.restore.start_fresh')}
              </button>
              <button
                onClick={confirmRestore}
                className="py-3 rounded-2xl bg-indigo-500 text-white font-bold text-sm active:scale-95 transition-transform"
              >
                {t('sync.restore.restore')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import confirmation overlay */}
      {importPending && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-[#13131f] border border-[#2a2a44] rounded-3xl p-6 w-full max-w-sm">
            <p className="text-white font-bold text-base mb-3">{t('setup.import.title')}</p>
            <p className="text-sm text-[#9090cc] mb-6">
              {t('setup.import.confirm', {
                current: importPending.currentCount,
                imported: importPending.importedCount,
              })}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setImportPending(null)}
                className="py-3 rounded-2xl bg-[#1a1a2e] text-[#9090cc] font-semibold text-sm active:scale-95 transition-transform"
              >
                {t('wizard.cancel')}
              </button>
              <button
                onClick={confirmImport}
                className="py-3 rounded-2xl bg-indigo-500 text-white font-bold text-sm active:scale-95 transition-transform"
              >
                {t('setup.import.replace')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import error toast */}
      {importError && (
        <div
          className="fixed bottom-6 left-4 right-4 z-50 px-4 py-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-sm font-semibold flex items-center justify-between gap-3"
          style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          <span>{importError}</span>
          <button
            onClick={() => setImportError('')}
            className="text-rose-400 hover:text-white text-lg leading-none flex-shrink-0"
            style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
        </div>
      )}
    </main>
  );
}
