# Apple Music on Cloudflare + Unified Artist/Playlist Search — Design Spec

**Date:** 2026-06-16
**Status:** Approved
**Scope:** parolla (Cloudflare Pages Functions + frontend) and parolla-strapi (slim-down). Single spec, sequenced plan.
**Branch (both repos):** `feature/music-quiz-playlist`
**Builds on:** the playlist feature in `2026-06-16-music-quiz-playlist-frontend-design.md` (parolla) and `2026-06-16-music-quiz-playlist-backend-design.md` (parolla-strapi).

## Problem

The just-shipped playlist feature routes Apple Music **AMP** calls (token scrape + playlist enrich/songs) through the Strapi VPS. Two issues at scale: a single VPS egress IP risks Apple rate-limiting/banning, and it loads the VPS. Also, we now want the music-quiz search box to find **playlists** as well as artists, with grouped results.

Decision: **token-gated AMP calls move to Cloudflare Pages Functions** (the edge, where `/api/itunes/search` already runs); the public **iTunes** calls (artist search + artist songs) stay client-side exactly as today (no token, no worker quota wasted). Strapi keeps only the admin-curated playlist-ID collection.

## Key constraint: what runs where

| Call | API | Auth | Runs where |
|------|-----|------|-----------|
| Artist **search** | iTunes `/search` (public) | none | **Client** (desktop direct; mobile `/api/itunes/search` — unchanged) |
| Artist **songs** | iTunes `/lookup` (public) | none | **Client direct** `itunes.apple.com/lookup` (unchanged) |
| Playlist **search** | AMP `/search?types=playlists` | Bearer token | **CF Function** (new) |
| Playlist **enrich** (curated cards) | AMP `/playlists/{id}` | Bearer token | **CF Function** (migrated from Strapi) |
| Playlist **songs** | AMP `/playlists/{id}?include=tracks` | Bearer token | **CF Function** (migrated from Strapi) |
| Token scrape | `music.apple.com` | — | **CF Function**, cached in Workers KV |

Rationale: AMP needs a scraped Bearer token + `Origin: music.apple.com` (browser can't do either — verified: `music.apple.com` returns 403 + no CORS to other origins; AMP only sets ACAO for `music.apple.com`). iTunes is public and works client-side (its localhost CORS fragility is accepted — it works in prod and we keep the existing structure to avoid wasting worker quota).

## Verified facts (live, 2026-06-16)

- AMP `GET /v1/catalog/{sf}/search?term=…&types=artists,playlists&limit=N&l=en-US` → `results.playlists.data[]` and `results.artists.data[]`, each item `{ id, type, attributes: { name, artwork: { url } , genreNames? } }`.
- AMP artist `id` === iTunes `artistId` (e.g. `127389488` = Ceza in both). (Not needed now since artists stay on iTunes, but confirms parity.)
- Token scrape: `GET https://music.apple.com/us/new` (follow redirects) → bundle `/assets/index~*.js` → JWT regex `eyJ…\.eyJ…\..`. Proven against live AMP.
- Prod = `nuxt generate` (static) on **Cloudflare Pages + Pages Functions**; local dev = plain `nuxt` (functions not served → needs `wrangler pages dev`).

## Hedef-dışı (YAGNI)

- iTunes artist search/songs migration to the worker (explicitly kept client-side).
- Artist results from AMP (artists stay on iTunes).
- Caching playlist DATA (names/covers/songs) — always live; only the **token** is cached (KV).
- Rewriting the iTunes artist-song selection logic.
- Scoring changes.

## Mimari kararlar

### 1. Cloudflare Pages Functions (`parolla/functions/api/music/`)

All token-gated AMP work. Pages Functions are bundled (esbuild), so local module imports work; files prefixed `_` are not routes.

- **`_apple.js`** (shared util, not a route):
  - `getToken(env)`: if `env.APPLE_MUSIC_TOKEN` set → use it. Else read `env.MUSIC_KV.get('amp_token')`; if present and not within 60s of expiry → return. Else `scrapeToken()` (fetch `https://music.apple.com/us/new` → find `/assets/index~*.js` (non-legacy) → fetch bundle → regex JWT), then `env.MUSIC_KV.put('amp_token', token, { expiration: jwtExp })`. Decode `exp` from the JWT payload.
  - `ampFetch(env, path)`: `GET https://amp-api.music.apple.com/v1/catalog/{storefront}{path}` with `Authorization: Bearer <token>`, `Origin: https://music.apple.com`. On 401 (and not env-token) → clear KV key, re-scrape once, retry. `storefront = env.APPLE_MUSIC_STOREFRONT || 'us'`.
  - `formatArtwork(url, size)`: replace `{w}`/`{h}`→size, `{f}`→`jpg`.
  - All responses from the route functions include `Access-Control-Allow-Origin: *` and a short `Cache-Control` (mirroring `functions/api/itunes/search.js`).
- **`search-playlists.js`** — `onRequestGet`: `?term=` → `ampFetch('/search?term=…&types=playlists&limit=10&l=en-US')` → `{ data: [{ playlistId: id, name: attributes.name, artworkUrl: formatArtwork(...) }] }`.
- **`playlists.js`** — curated cards: fetch published IDs from the slim Strapi endpoint (below), then enrich each via `ampFetch('/playlists/{id}')` → `{ data: [{ playlistId, name, artworkUrl }] }`. Failed playlists skipped + logged. If token scrape fails → respond 502 so the client can distinguish from "no playlists".
- **`playlist-songs.js`** — `?playlistId=` → `ampFetch('/playlists/{id}?include=tracks&limit[tracks]=300')` → map tracks to the game song shape `{ trackId, trackName, previewUrl, trackViewUrl, artistId:null, artistName, artworkUrl100 }`, filter no-preview, dedupe by name → `{ data, error, meta: { playlistId, total, playlist: { name, artworkUrl } } }`. (Same logic as the retired Strapi util, ported to JS.)

### 2. Workers KV + wrangler + local dev (`parolla`)

- Add `wrangler` devDependency.
- `wrangler.toml`: `pages_build_output_dir = "dist"`, `[[kv_namespaces]]` binding `MUSIC_KV` (id + preview_id). Also create the KV namespace in the Cloudflare Pages project (dashboard) and bind `MUSIC_KV`; set Pages env vars `APPLE_MUSIC_STOREFRONT` (and optional `APPLE_MUSIC_TOKEN`).
- `package.json` script `dev:cf`: run `wrangler pages dev` layered over the Nuxt dev server (proxies the `nuxt` dev port; serves `functions/` + a local KV via Miniflare). Exact flags finalized in the plan. Music features are tested via the `dev:cf` URL; plain `yarn dev` still runs the app (playlist/search calls 404 under plain `nuxt`, which is acceptable and documented).

### 3. Strapi slim-down (`parolla-strapi`)

- **Keep** the `music-playlist` collection + factory controller/routes/service.
- **Remove** `src/utils/apple-music.util.ts`, the `fetchPlaylists` AMP enrichment, and the `fetchSongs` `playlistId` branch (logic moved to CF). Remove the `APPLE_MUSIC_*` env docs.
- **Repurpose** `GET /modes/music/playlists` to return only published IDs: `{ data: [{ playlistId, sortOrder }] }` (sorted by `sortOrder`), a light indexed DB read — consumed by the CF `playlists.js`. (`/modes/music/artists` and `/modes/music/songs` artist logic remain untouched — actually unused by the frontend, which uses iTunes directly; leave as-is.)

### 4. Frontend (`parolla`)

- **`services/music.service.js`** (new): same-origin `fetch('/api/music/…')` helpers — `fetchPlaylists()`, `fetchPlaylistSongs(playlistId)`, `searchPlaylists(term)`. (CF functions are same-origin; no `$appFetch`/Strapi.)
- **`store/music/actions.js`**: `fetchPlaylists` + `fetchPlaylistSongs` → `music.service` (CF). New `searchPlaylists` → `music.service`. `fetchArtists` + `fetchSongs` → **unchanged** (iTunes via `itunes.service`).
- **`MusicArtistSelect`** → unified search:
  - Label → `musicMode.form.searchArtist.label` = "Sanatçı ya da Playlist ara".
  - On `@search-change` (debounced 500ms): call `music/fetchArtists` (artists) and `music/searchPlaylists` (playlists) in parallel; build grouped options for `vue-multiselect` via `group-label`/`group-values`:
    ```
    [{ groupLabel: t('musicMode.groups.artists'), items: artists.map(a => ({...a, type:'artist', key:`artist:${a.artistId}`})) },
     { groupLabel: t('musicMode.groups.playlists'), items: playlists.map(p => ({...p, type:'playlist', key:`playlist:${p.playlistId}`})) }]
    ` ``
    `track-by="key"`, custom `label` resolved per type. Option slot renders cover + name (+ genre for artists); empty groups omitted.
  - `@select`: emit `select` with the option (carrying `type`).
- **`GuessTheSongScene`** selection model:
  - `selectedArtists` (multi, max 3) and `selectedPlaylist` (single) are **mutually exclusive**.
  - Select artist → add to `selectedArtists`, **clear `selectedPlaylist`**.
  - Select playlist (from search OR a curated card) → set `selectedPlaylist` (clear `selectedArtists`); shown in the selected area (cover + name) with a remove control.
  - Curated cards now **selection-state** (tap → `selectedPlaylist`), consistent with search.
  - Play button enabled when `selectedArtists.length || selectedPlaylist`. On click → `selectedPlaylist ? { playlistId } : { artistIds }` query to `MusicMode-GuessTheSong-Play`.
- **`GuessTheSongPlayScene`**: `playlistId` branch already exists; just point its store calls at the CF-backed `music/fetchPlaylistSongs`. (Artist branch unchanged.)

### 5. i18n (`locales/en.js` + `locales/tr.js`)
- `musicMode.form.searchArtist.label` → "Search artist or playlist" / "Sanatçı ya da Playlist ara" (+ placeholder).
- `musicMode.groups.artists` / `musicMode.groups.playlists` → "Artists"/"Sanatçılar", "Playlists"/"Playlistler".

### 6. Hata / token riski
- Search: empty/short term → empty; either source erroring → that group hidden (the other still shows).
- Token scrape from CF edge could be blocked by Apple (datacenter IP) → `APPLE_MUSIC_TOKEN` Pages env var as fallback override. Validate scraping from CF during implementation; if blocked, rely on the env override (rotate ~monthly).
- KV eventual consistency → rare concurrent cold scrape; acceptable.

## Etkilenen / yeni dosyalar

**parolla — yeni:** `functions/api/music/_apple.js`, `search-playlists.js`, `playlists.js`, `playlist-songs.js`; `services/music.service.js`; `wrangler.toml`.
**parolla — değişen:** `store/music/actions.js`; `components/Select/MusicArtistSelect/*` (+scss); `components/Scene/MusicModeScene/GuessTheSongScene/*` (+scss); `GuessTheSongPlayScene` (store calls); `locales/en.js`, `locales/tr.js`; `package.json` (wrangler dep + `dev:cf`).
**parolla-strapi — değişen:** remove `src/utils/apple-music.util.ts`; `src/api/music/controllers/music.ts` (drop AMP enrich + playlistId branch; slim `fetchPlaylists` to IDs); `src/api/music/routes/music.ts` (unchanged routes); `.env.example` (drop APPLE_MUSIC_*).

## Açık riskler
- CF edge → `music.apple.com` scrape may be IP-blocked; mitigated by `APPLE_MUSIC_TOKEN` env override.
- Local dev requires `wrangler pages dev` for music features (documented); plain `yarn dev` won't serve functions.
- Reworking the just-merged Strapi AMP logic (accepted; collection stays).
