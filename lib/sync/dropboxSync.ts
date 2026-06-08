const APP_KEY = process.env.NEXT_PUBLIC_LA_BUSCHE_DROPBOX_APP_KEY ?? '';
const TOKEN_KEY = 'la-busche:dropbox:tokens';
const PKCE_VERIFIER_KEY = 'la-busche:dropbox:pkce_verifier';
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export interface DropboxTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  accountId: string;
  displayName?: string;
  email?: string;
}

export function hasAppKey(): boolean {
  return APP_KEY.length > 0;
}

function getRedirectUri(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}${BASE_PATH}/setup`;
}

// ─── PKCE helpers ─────────────────────────────────────────────────────────────

function base64urlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generatePkce(): Promise<{ verifier: string; challenge: string }> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = base64urlEncode(array.buffer);
  const encoded = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  const challenge = base64urlEncode(digest);
  return { verifier, challenge };
}

export async function buildAuthUrl(): Promise<string> {
  const { verifier, challenge } = await generatePkce();
  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);

  const params = new URLSearchParams({
    client_id: APP_KEY,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    code_challenge: challenge,
    code_challenge_method: 'S256',
    token_access_type: 'offline',
  });
  return `https://www.dropbox.com/oauth2/authorize?${params}`;
}

export async function exchangeCode(code: string): Promise<void> {
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
  if (!verifier) throw new Error('PKCE verifier missing — did you initiate the flow from this browser?');

  const body = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    client_id: APP_KEY,
    redirect_uri: getRedirectUri(),
    code_verifier: verifier,
  });

  const res = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const data = await res.json() as {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
    account_id: string;
  };

  let displayName: string | undefined;
  let email: string | undefined;
  try {
    const acctRes = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
      method: 'POST',
      headers: { Authorization: `Bearer ${data.access_token}`, 'Content-Type': 'application/json' },
      body: 'null',
    });
    if (acctRes.ok) {
      const acct = await acctRes.json() as { name?: { display_name?: string }; email?: string };
      displayName = acct.name?.display_name;
      email = acct.email;
    }
  } catch { /* non-fatal */ }

  const tokens: DropboxTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in ?? 14400) * 1000,
    accountId: data.account_id,
    displayName,
    email,
  };

  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
}

// ─── Token management ─────────────────────────────────────────────────────────

export function getTokens(): DropboxTokens | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as DropboxTokens) : null;
  } catch {
    return null;
  }
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

export function isConnected(): boolean {
  return getTokens() !== null;
}

async function refreshTokens(tokens: DropboxTokens): Promise<DropboxTokens> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: tokens.refreshToken,
    client_id: APP_KEY,
  });
  const res = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const data = await res.json() as { access_token: string; expires_in?: number };
  const updated: DropboxTokens = {
    ...tokens,
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 14400) * 1000,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(updated));
  return updated;
}

export async function ensureFreshToken(): Promise<string> {
  const tokens = getTokens();
  if (!tokens) throw new Error('Not connected to Dropbox');
  if (tokens.expiresAt - Date.now() < 5 * 60 * 1000) {
    const refreshed = await refreshTokens(tokens);
    return refreshed.accessToken;
  }
  return tokens.accessToken;
}

// ─── File operations ──────────────────────────────────────────────────────────

export async function uploadFile(path: string, content: string): Promise<void> {
  const token = await ensureFreshToken();
  const res = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({ path, mode: 'overwrite', autorename: false, mute: true }),
    },
    body: content,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
}

export async function downloadFile(path: string): Promise<string | null> {
  const token = await ensureFreshToken();
  const res = await fetch('https://content.dropboxapi.com/2/files/download', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Dropbox-API-Arg': JSON.stringify({ path }),
    },
  });
  if (res.status === 409) return null; // file not found
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return res.text();
}
