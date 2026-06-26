# La Busche

Personal Sofia public transport arrival times app. Displays live arrivals for a fixed set of commute routes using Sofia Urban Mobility Center GTFS data — no API key required.

## Features

- **Tile dashboard** — configure your own commute tiles (home/work, outbound/inbound) on the Home screen; each opens a live arrivals board.
- **Live arrivals board** — per-tile detail page (`/board/[cardId]`) with countdowns, on-time / delayed / early status chips, GTFS-RT real-time delays, and 30 s auto-refresh.
- **Real-time data** — combines static GTFS with GTFS-RT trip updates; works for buses, trolleybuses and trams.
- **Bilingual UI** — full English 🇬🇧 / Български 🇧🇬 interface, switchable from the menu.
- **No accounts** — all configuration lives in the browser's `localStorage`. Optional Dropbox sync keeps it backed up and shared across devices (see below).
- **PWA-friendly** — installable icons, native pull-to-refresh on mobile, safe-area aware layout, and a branded bus-driving loading animation.
- **Hidden gems** — two quiet easter eggs tucked behind the settings menu (see [Hidden gems](#hidden-gems)).

## Tech stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS
- GTFS static + GTFS-RT (protobuf) from `gtfs.sofiatraffic.bg`

## Requirements

- Node.js 18+
- npm 9+

## Install

```bash
cd la-busche
npm install
```

## Development

```bash
npm run dev
```

Opens at http://localhost:3000. First request will take a few seconds while the static GTFS ZIP is fetched and parsed; subsequent requests use the in-memory cache (valid for 24h).

## Production

```bash
npm run build
npm start
```

## VPS deployment with PM2

```bash
cd la-busche
npm install
npm run build

# Start with PM2
pm2 start npm --name "la-busche" -- start

# Or with an ecosystem file
pm2 start ecosystem.config.js

# Persist across reboots
pm2 save
pm2 startup
```

Example `ecosystem.config.js`:
```js
module.exports = {
  apps: [{
    name: 'la-busche',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/la-busche',
    env: { NODE_ENV: 'production', PORT: 3001 },
  }],
};
```

## Data sources

| Feed | URL | Caching |
|------|-----|---------|
| Static GTFS (ZIP) | `https://gtfs.sofiatraffic.bg/api/v1/static` | In-memory, 24h TTL |
| GTFS-RT trip updates | `https://gtfs.sofiatraffic.bg/api/v1/trip-updates` | Per request |

No environment variables or API keys needed.

## API

`GET /api/departures?stop=STOP_ID[&lines=LINE1,LINE2][&minutes=N][&max=N]`

| Param | Required | Description |
|-------|----------|-------------|
| `stop` | yes | Stop code (e.g. `2327`) |
| `lines` | no | Comma-separated route short names to filter (e.g. `73,204`) |
| `minutes` | no | Time window in minutes when no line filter (default 20) |
| `max` | no | Max results to return |

`GET /api/stops/search?q=QUERY` — search stops by name or code, returns top 10.

`GET /api/stops/STOP_CODE/lines` — all lines serving a stop, grouped by type.

`GET /api/gtfs/status` — GTFS cache status (last fetch, TTL).

### Pages

| Route | Description |
|-------|-------------|
| `/` | Home dashboard of commute tiles |
| `/board/[cardId]` | Live arrivals board for a single tile |
| `/setup` | Manage tiles (`?view=routes`) and backup/sync (`?view=backup`) |
| `/about` | About, data credit, contact |

---

## Hidden gems

Two small, deliberately undocumented-in-app experiences hide behind the empty
background of the settings menu (the ☰ drawer). They never sit on a link or
button, share the same dead space, and can't collide — each is fully optional,
self-contained, and trivially removable by deleting its folder under
`components/`.

- **Stream** (`components/stream/`) — an ambient water surface you stir with one
  finger. No score, no timer, nothing to lose; lift your finger and it settles
  to glass on its own. The scene quietly moves on while you're away, and a rare
  "drift day" sends a single object passing through. **Reveal it with five quick
  taps** on the menu's empty background. Press and hold still to close.

- **Route** (`components/route/`) — a tiny bus-eats-dots maze game and the
  deliberate opposite of Stream: it *has* a goal, a score and levels. Drive a bus
  through handcrafted Sofia-flavoured street mazes collecting waiting passengers
  and bus-stop pellets, chasing completion, time and an unbroken-pickup *flow*
  multiplier. No enemies, the bus can't die. Six routes, a high-contrast
  "daylight" mode, and a saved best run per route. **Reveal it with one clear
  directional swipe** across the same empty menu background. Touch, mouse and
  arrow keys all steer; press and hold still to close.

Both respect `prefers-reduced-motion`, store nothing about having been found, and
have zero impact on the rest of the app.

---

## Open Source & Self-Hosting

La Busche is open-source and designed to run on your own hardware. All user configuration lives in the browser's `localStorage` — no accounts, no database, no server-side personal data.

### Fork & run locally

```bash
git clone https://github.com/YOUR_USER/la-busche
cd la-busche
npm install
npm run dev        # http://localhost:3000
```

No API keys or environment variables are required.

### Deploy on a VPS with Node.js + PM2

```bash
npm run build
pm2 start npm --name "la-busche" -- start
pm2 save && pm2 startup   # persist across reboots
```

To run on a custom port, set the `PORT` env variable:

```bash
PORT=3001 pm2 start npm --name "la-busche" -- start
```

Put Nginx or Caddy in front for HTTPS.

## Dropbox Sync

Optional feature — the app works fine without it.

Sync keeps your tile configuration automatically backed up to Dropbox and shared across devices/browsers. Each device maintains its own `localStorage`; Dropbox is the shared source of truth between them. Last-write-wins on the whole config (no per-tile merging needed for a personal app).

### Setup

1. Create a free Dropbox developer app at [dropbox.com/developers/apps](https://www.dropbox.com/developers/apps):
   - Access type: **Scoped access**
   - Folder access: **App folder** (sandboxes the app to its own folder)
   - Any name, e.g. `la-busche`
2. In the app's settings page, add your redirect URI under **OAuth 2 → Redirect URIs**: `https://yourdomain.com/la-busche/setup`
3. Copy the **App key** (no app secret needed — this uses the PKCE flow)
4. Set the environment variable and redeploy:

```
NEXT_PUBLIC_LA_BUSCHE_DROPBOX_APP_KEY=your_app_key_here
```

5. Open ⚙️ Setup → **Connect Dropbox** and complete the OAuth flow

### How it works

- **Auto-sync:** triggers on page load and whenever the tab becomes visible again (throttled to once per 5 minutes)
- **After changes:** any tile add/edit/delete/reorder triggers a sync 2.5 seconds later
- **Merge strategy:** compares `updatedAt` timestamps; the newer config wins entirely
- **Disconnect:** clears local tokens only — the remote file in your Dropbox App folder is not deleted

---

### Backing up your config

Your tiles are stored in `localStorage` under the key `la-busche-config`.

**Export:** Open ⚙️ Setup → *Export config* to download `la-busche-config.json`.

**Import:** Open ⚙️ Setup → *Import config* and select the file. Useful for transferring your setup between devices or browsers.

### Data credit

Transit data is provided by **Sofia Urban Mobility Center** (Столична дирекция "Транспорт") via their public GTFS feeds at `gtfs.sofiatraffic.bg`, licensed under **CC BY-SA 4.0**. No personal data is stored server-side.
