# La Busche

Personal Sofia public transport arrival times app. Displays live arrivals for a fixed set of commute routes using Sofia Urban Mobility Center GTFS data — no API key required.

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
