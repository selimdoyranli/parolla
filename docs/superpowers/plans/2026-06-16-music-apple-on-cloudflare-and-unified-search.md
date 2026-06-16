# Apple Music on Cloudflare + Unified Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move token-gated Apple Music (AMP) calls to Cloudflare Pages Functions with a Workers-KV token cache, keep public iTunes artist calls client-side, and add a unified grouped artist/playlist search with mutually-exclusive selection.

**Architecture:** New `functions/api/music/*` Pages Functions scrape+cache the AMP Bearer token (KV) and serve playlist search/enrich/songs. The frontend calls these same-origin via a new `music.service.js`; artist search/songs stay on the existing iTunes path. Strapi keeps only the curated playlist-ID collection (AMP logic removed). The music-quiz scene gains a `selectedPlaylist` state, mutually exclusive with `selectedArtists`.

**Tech Stack:** Cloudflare Pages Functions (ESM, Workers runtime), Workers KV, wrangler; Nuxt 2 / Vue 2 + `@nuxtjs/composition-api`, vue-multiselect; Strapi 5 (TS). No test framework — verification = lint (husky), a standalone Node harness for the AMP util against the live API, and `wrangler pages dev` smoke.

**Reference spec:** `docs/superpowers/specs/2026-06-16-music-apple-on-cloudflare-and-unified-search-design.md`

**Repos & branch:** `parolla` (functions + frontend) and `parolla-strapi` (slim-down), both on `feature/music-quiz-playlist`.

**Conventions:**
- parolla: no semicolons, single quotes, pug, composition-api; husky pre-commit runs eslint/stylelint/prettier (CRLF) on staged files (commit = gate). Do NOT stage `auto-imports.d.ts`.
- parolla-strapi: no semicolons, single quotes, `pnpm typecheck`/`pnpm lint`; commit hook runs typecheck.
- Pages Functions are ESM (`export async function onRequestGet(context)`), `context.env` holds bindings (`MUSIC_KV`) and vars (`APPLE_MUSIC_TOKEN`, `APPLE_MUSIC_STOREFRONT`, `STRAPI_API_URL`). Files prefixed `_` are not routes.
- Verified live: AMP `/search?types=artists,playlists` → `results.{artists,playlists}.data[]`; AMP playlist tracks inline under `data[0].relationships.tracks.data[]`; token scrape from `music.apple.com/us/new` bundle.

---

## File Structure

**parolla — create:** `functions/api/music/_apple.js`, `functions/api/music/search-playlists.js`, `functions/api/music/playlists.js`, `functions/api/music/playlist-songs.js`, `services/music.service.js`, `wrangler.toml`.
**parolla — modify:** `store/music/actions.js`, `components/Select/MusicArtistSelect/MusicArtistSelect.component.vue`, `components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.vue` (+`.scss`), `locales/en.js`, `locales/tr.js`, `package.json`.
**parolla-strapi — modify:** delete `src/utils/apple-music.util.ts`; `src/api/music/controllers/music.ts`; `.env.example`.

**Task order:** 1 Strapi slim → 2 `_apple.js` → 3 verify util (live) → 4 search-playlists fn → 5 playlists fn → 6 playlist-songs fn → 7 wrangler/KV/dev:cf → 8 music.service + store → 9 i18n → 10 MusicArtistSelect → 11 scene selection model → 12 final lint + wrangler smoke.

---

## Task 1: Strapi slim-down (remove AMP, keep curated IDs)

**Files (parolla-strapi):** delete `src/utils/apple-music.util.ts`; modify `src/api/music/controllers/music.ts`, `.env.example`.

- [ ] **Step 1: Remove the apple-music util import**

In `src/api/music/controllers/music.ts`, delete lines 6–11 (the block):
```ts
import {
  getPlaylist,
  getPlaylistWithTracks,
  getToken,
  type ApplePlaylistMeta,
} from '../../../utils/apple-music.util'
```
(Keep line 5 `import { artistTransformer, songTransformer } from '../music.transformer'`.)

- [ ] **Step 2: Slim `fetchPlaylists` to return IDs only**

Replace the entire `fetchPlaylists(ctx)` method (currently lines ~119–162) with:
```ts
  async fetchPlaylists(ctx) {
    const entries = await strapi.documents('api::music-playlist.music-playlist').findMany({
      status: 'published',
      sort: ['sortOrder:asc', 'createdAt:asc'],
      fields: ['appleMusicPlaylistId', 'sortOrder'],
    })

    ctx.body = {
      data: entries.map((entry: any) => ({
        playlistId: entry.appleMusicPlaylistId,
        sortOrder: entry.sortOrder,
      })),
      meta: {
        total: entries.length,
      },
    }
  },
```

- [ ] **Step 3: Remove the `playlistId` branch from `fetchSongs`**

In `fetchSongs(ctx)`, delete the playlist branch block that begins with:
```ts
    const query = (ctx.request?.query as Record<string, any>) || {}
    const playlistId =
      typeof query.playlistId === 'string' ? query.playlistId.trim() : ''

    if (playlistId) {
```
…through its closing `}` (the block that calls `getPlaylistWithTracks` and ends with the `catch` returning `ctx.badRequest('Unable to fetch playlist songs')`). The method must resume with its original first line `const artistIdsRaw = (ctx.request?.query as Record<string, any>)?.artistIds`.

- [ ] **Step 4: Delete the util file**

```bash
git rm src/utils/apple-music.util.ts
```

- [ ] **Step 5: Remove APPLE_MUSIC env docs**

In `.env.example`, delete the block:
```
# Apple Music (music quiz playlists)
APPLE_MUSIC_TOKEN=
APPLE_MUSIC_STOREFRONT=us
```

- [ ] **Step 6: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS (no references to the deleted util remain).

- [ ] **Step 7: Commit**

```bash
git add -A src/api/music src/utils .env.example
git commit -m "refactor(music): move AMP logic out of strapi, keep curated playlist ids"
```

---

## Task 2: Cloudflare AMP util (`_apple.js`)

**Files (parolla):** create `functions/api/music/_apple.js`

- [ ] **Step 1: Write the util** (Workers runtime: uses `atob`, global `fetch`, `Date`, no Node Buffer)

`functions/api/music/_apple.js`:
```js
const DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'
const APPLE_MUSIC_HOME = 'https://music.apple.com/us/new'
const AMP_BASE = 'https://amp-api.music.apple.com/v1/catalog'
const JWT_REGEX = /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/
const KV_KEY = 'amp_token'

const decodeJwtExp = token => {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = JSON.parse(atob(payload))

    return typeof json.exp === 'number' ? json.exp : 0
  } catch {
    return 0
  }
}

const scrapeToken = async () => {
  const homeRes = await fetch(APPLE_MUSIC_HOME, { headers: { 'User-Agent': DESKTOP_UA } })

  if (!homeRes.ok) {
    throw new Error(`Apple Music home fetch failed: ${homeRes.status}`)
  }

  const html = await homeRes.text()
  const paths = [...html.matchAll(/\/assets\/index[^"' ]*\.js/g)].map(m => m[0])
  const unique = [...new Set(paths)].filter(p => !p.includes('legacy'))

  if (!unique.length) {
    throw new Error('Apple Music JS bundle not found')
  }

  for (const path of unique) {
    const res = await fetch(`https://music.apple.com${path}`, { headers: { 'User-Agent': DESKTOP_UA } })

    if (!res.ok) {
      continue
    }

    const js = await res.text()
    const match = js.match(JWT_REGEX)

    if (match) {
      return match[0]
    }
  }

  throw new Error('Apple Music token not found')
}

const putToken = async (env, token) => {
  if (!env.MUSIC_KV) {
    return
  }

  const exp = decodeJwtExp(token)
  const now = Math.floor(Date.now() / 1000)

  await env.MUSIC_KV.put(KV_KEY, token, exp - now > 60 ? { expiration: exp } : { expirationTtl: 3600 })
}

export const getToken = async env => {
  if (env.APPLE_MUSIC_TOKEN) {
    return env.APPLE_MUSIC_TOKEN
  }

  const cached = env.MUSIC_KV ? await env.MUSIC_KV.get(KV_KEY) : null

  if (cached && decodeJwtExp(cached) - 60 > Math.floor(Date.now() / 1000)) {
    return cached
  }

  const token = await scrapeToken()

  await putToken(env, token)

  return token
}

const storefront = env => env.APPLE_MUSIC_STOREFRONT || 'us'

export const ampFetch = async (env, path) => {
  const doFetch = token =>
    fetch(`${AMP_BASE}/${storefront(env)}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: 'https://music.apple.com',
        'User-Agent': DESKTOP_UA
      }
    })

  let token = await getToken(env)
  let res = await doFetch(token)

  if (res.status === 401 && !env.APPLE_MUSIC_TOKEN) {
    if (env.MUSIC_KV) {
      await env.MUSIC_KV.delete(KV_KEY)
    }

    token = await scrapeToken()
    await putToken(env, token)
    res = await doFetch(token)
  }

  if (!res.ok) {
    throw new Error(`AMP request failed: ${res.status} ${path}`)
  }

  return res.json()
}

export const formatArtwork = (url, size) => {
  if (!url) {
    return null
  }

  return url
    .replace('{w}', String(size))
    .replace('{h}', String(size))
    .replace('{f}', 'jpg')
}

export const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    }
  })
```

- [ ] **Step 2: Lint**

Run: `npx eslint functions/api/music/_apple.js`
Expected: no errors. (If the eslint config doesn't lint `functions/`, this is a no-op — proceed.)

- [ ] **Step 3: Commit**

```bash
git add functions/api/music/_apple.js
git commit -m "feat(music): add cloudflare AMP token+fetch util with KV cache"
```

---

## Task 3: Verify the AMP util against the live API

**Files:** none committed (temporary harness in `/tmp`).

- [ ] **Step 1: Copy the util as ESM + write a harness**

Run:
```bash
cp functions/api/music/_apple.js /tmp/_apple.mjs
cat > /tmp/verify-music.mjs <<'EOF'
import { getToken, ampFetch, formatArtwork } from '/tmp/_apple.mjs'
const store = new Map()
const env = { MUSIC_KV: { get: async k => store.get(k) ?? null, put: async (k, v) => void store.set(k, v), delete: async k => void store.delete(k) }, APPLE_MUSIC_STOREFRONT: 'us' }
const main = async () => {
  const token = await getToken(env)
  console.log('TOKEN ok len', token.length)
  const search = await ampFetch(env, '/search?term=t%C3%BCrk%C3%A7e&types=playlists&limit=3&l=en-US')
  const pls = search?.results?.playlists?.data ?? []
  console.log('SEARCH playlists:', pls.length, pls[0] && pls[0].attributes?.name)
  const pl = await ampFetch(env, '/playlists/pl.1ef459abf3b541488095d2c5518ec617?include=tracks&limit%5Btracks%5D=5')
  const tracks = pl?.data?.[0]?.relationships?.tracks?.data ?? []
  console.log('PLAYLIST', pl?.data?.[0]?.attributes?.name, '| tracks', tracks.length, '| preview', tracks[0]?.attributes?.previews?.[0]?.url ? 'yes' : 'no')
  console.log('ARTWORK', formatArtwork(pl?.data?.[0]?.attributes?.artwork?.url, 300)?.slice(0, 50))
  if (!token || pls.length === 0 || tracks.length === 0) { console.error('VERIFY FAILED'); process.exit(1) }
  console.log('VERIFY OK')
}
main().catch(e => { console.error('VERIFY ERROR', e?.message || e); process.exit(1) })
EOF
node /tmp/verify-music.mjs
```
Expected: `TOKEN ok len ~268`, `SEARCH playlists: 3 …`, `PLAYLIST Zirvedekiler… | tracks 5 | preview yes`, `ARTWORK https://…`, ending `VERIFY OK`.

> If token scrape is blocked from this host, re-run with `APPLE_MUSIC_TOKEN=<jwt>` prefixed; if that passes, the AMP/parse logic is correct and only scraping is environment-blocked — report it (prod uses the env override fallback).

- [ ] **Step 2: Clean up**

```bash
rm -f /tmp/_apple.mjs /tmp/verify-music.mjs
```
No commit (verification only).

---

## Task 4: `search-playlists` function

**Files (parolla):** create `functions/api/music/search-playlists.js`

- [ ] **Step 1: Write the function**

`functions/api/music/search-playlists.js`:
```js
import { ampFetch, formatArtwork, jsonResponse } from './_apple.js'

export async function onRequestGet(context) {
  const { request, env } = context
  const term = new URL(request.url).searchParams.get('term')

  if (!term || term.trim().length < 2) {
    return jsonResponse({ data: [] })
  }

  try {
    const json = await ampFetch(
      env,
      `/search?term=${encodeURIComponent(term.trim())}&types=playlists&limit=10&l=en-US`
    )
    const items = json?.results?.playlists?.data ?? []
    const data = items.map(p => ({
      playlistId: p.id,
      name: p.attributes?.name,
      artworkUrl: formatArtwork(p.attributes?.artwork?.url, 300)
    }))

    return jsonResponse({ data })
  } catch (err) {
    return jsonResponse({ data: [], error: String((err && err.message) || err) }, 502)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add functions/api/music/search-playlists.js
git commit -m "feat(music): add AMP playlist search cloudflare function"
```

---

## Task 5: `playlists` function (curated enrich)

**Files (parolla):** create `functions/api/music/playlists.js`

- [ ] **Step 1: Write the function** (reads curated IDs from the slim Strapi endpoint, enriches via AMP)

`functions/api/music/playlists.js`:
```js
import { ampFetch, formatArtwork, jsonResponse } from './_apple.js'

export async function onRequestGet(context) {
  const { env } = context
  const strapiBase = env.STRAPI_API_URL || 'https://strapi.parolla.app/api'

  let ids = []

  try {
    const res = await fetch(`${strapiBase}/modes/music/playlists`)
    const body = await res.json()

    ids = (body?.data ?? []).map(entry => entry.playlistId).filter(Boolean)
  } catch (err) {
    return jsonResponse({ data: [], error: 'Failed to load curated playlists' }, 502)
  }

  if (!ids.length) {
    return jsonResponse({ data: [], meta: { total: 0 } })
  }

  try {
    const results = await Promise.all(
      ids.map(async id => {
        try {
          const json = await ampFetch(env, `/playlists/${encodeURIComponent(id)}`)
          const attr = json?.data?.[0]?.attributes

          if (!attr) {
            return null
          }

          return { playlistId: id, name: attr.name, artworkUrl: formatArtwork(attr.artwork?.url, 300) }
        } catch {
          return null
        }
      })
    )
    const data = results.filter(Boolean)

    return jsonResponse({ data, meta: { total: data.length } })
  } catch (err) {
    return jsonResponse({ data: [], error: String((err && err.message) || err) }, 502)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add functions/api/music/playlists.js
git commit -m "feat(music): add curated playlists enrich cloudflare function"
```

---

## Task 6: `playlist-songs` function

**Files (parolla):** create `functions/api/music/playlist-songs.js`

- [ ] **Step 1: Write the function**

`functions/api/music/playlist-songs.js`:
```js
import { ampFetch, formatArtwork, jsonResponse } from './_apple.js'

const toTrack = resource => {
  const a = resource.attributes

  return {
    trackId: resource.id,
    trackName: a.name,
    previewUrl: a.previews?.[0]?.url ?? null,
    trackViewUrl: a.url ?? null,
    artistId: null,
    artistName: a.artistName ?? null,
    artworkUrl100: formatArtwork(a.artwork?.url, 100)
  }
}

export async function onRequestGet(context) {
  const { request, env } = context
  const params = new URL(request.url).searchParams
  const playlistId = params.get('playlistId')

  if (!playlistId) {
    return jsonResponse({ data: [], error: 'playlistId is required' }, 400)
  }

  const limitParam = Number(params.get('limit'))
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.floor(limitParam), 300) : 100

  try {
    const json = await ampFetch(
      env,
      `/playlists/${encodeURIComponent(playlistId)}?include=tracks&limit%5Btracks%5D=300`
    )
    const root = json?.data?.[0]
    const attr = root?.attributes
    const refs = root?.relationships?.tracks?.data ?? []
    const included = Array.isArray(json?.included) ? json.included : []
    const byId = new Map(included.map(r => [r.id, r]))
    const tracks = refs
      .map(ref => (ref?.attributes ? ref : byId.get(ref?.id)))
      .filter(r => r && r.type === 'songs' && r.attributes)
      .map(toTrack)

    const seen = new Set()
    const songs = []

    for (const track of tracks) {
      if (!track.previewUrl) {
        continue
      }
      if (track.trackName && seen.has(track.trackName)) {
        continue
      }
      if (track.trackName) {
        seen.add(track.trackName)
      }
      songs.push(track)
      if (songs.length >= limit) {
        break
      }
    }

    return jsonResponse({
      data: songs,
      error: songs.length === 0 ? 'No playable tracks found for this playlist' : null,
      meta: {
        playlistId,
        total: songs.length,
        playlist: { name: attr?.name ?? null, artworkUrl: formatArtwork(attr?.artwork?.url, 300) }
      }
    })
  } catch (err) {
    return jsonResponse({ data: [], error: String((err && err.message) || err) }, 502)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add functions/api/music/playlist-songs.js
git commit -m "feat(music): add AMP playlist songs cloudflare function"
```

---

## Task 7: wrangler config + KV + local dev script

**Files (parolla):** create `wrangler.toml`; modify `package.json`.

- [ ] **Step 1: Add wrangler devDependency**

Run: `yarn add -D wrangler`

- [ ] **Step 2: Create `wrangler.toml`**

`wrangler.toml`:
```toml
name = "parolla"
pages_build_output_dir = "dist"

[[kv_namespaces]]
binding = "MUSIC_KV"
id = "REPLACE_WITH_PROD_KV_ID"
preview_id = "REPLACE_WITH_PREVIEW_KV_ID"
```
> The `id`/`preview_id` are filled after creating the namespace (Step 4). For local dev the `--kv` flag (Step 3) provides a local KV, so placeholders don't block local testing.

- [ ] **Step 3: Add the `dev:cf` script**

In `package.json` `scripts`, add:
```json
    "dev:cf": "wrangler pages dev --proxy 3000 --port 8788 --kv MUSIC_KV"
```
Local dev workflow: run `yarn dev` (Nuxt on :3000) in one terminal and `yarn dev:cf` in another; open `http://localhost:8788`. Functions + a local KV are served there. Set `APPLE_MUSIC_STOREFRONT`/optional `APPLE_MUSIC_TOKEN` via a `.dev.vars` file for local if needed.

- [ ] **Step 4: (Operator step — document, do not block) create the KV namespace for prod**

Document in the commit body that an operator must run `npx wrangler kv namespace create MUSIC_KV` (+ `--preview`), put the IDs into `wrangler.toml`, bind `MUSIC_KV` in the Cloudflare Pages project, and set `APPLE_MUSIC_STOREFRONT` (and optional `APPLE_MUSIC_TOKEN`, `STRAPI_API_URL`) as Pages env vars. This is infra config, not code.

- [ ] **Step 5: Commit**

```bash
git add wrangler.toml package.json yarn.lock
git commit -m "build(music): add wrangler config, MUSIC_KV binding, dev:cf script"
```

---

## Task 8: Frontend music service + store rewire

**Files (parolla):** create `services/music.service.js`; modify `store/music/actions.js`.

- [ ] **Step 1: Create the service**

`services/music.service.js`:
```js
const fetchJson = async url => {
  try {
    const response = await fetch(url)
    const body = await response.json().catch(() => null)

    if (!response.ok) {
      return { data: body?.data || [], meta: body?.meta, error: body?.error || new Error(`Request failed with status ${response.status}`) }
    }

    return { data: body?.data || [], meta: body?.meta, error: body?.error || null }
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown fetch error')

    return { data: [], meta: undefined, error }
  }
}

export const fetchPlaylists = () => fetchJson('/api/music/playlists')

export const fetchPlaylistSongs = playlistId => fetchJson(`/api/music/playlist-songs?playlistId=${encodeURIComponent(playlistId)}`)

export const searchPlaylists = term => fetchJson(`/api/music/search-playlists?term=${encodeURIComponent(term)}`)
```

- [ ] **Step 2: Rewire the store (playlists → CF; add searchPlaylists; artists unchanged)**

In `store/music/actions.js`, update the import line at the top:
```js
import { fetchArtists as fetchArtistsFromItunes, fetchSongs as fetchSongsFromItunes } from '@/services/itunes.service'
```
to also import the music service:
```js
import { fetchArtists as fetchArtistsFromItunes, fetchSongs as fetchSongsFromItunes } from '@/services/itunes.service'
import { fetchPlaylists as fetchPlaylistsFromCf, fetchPlaylistSongs as fetchPlaylistSongsFromCf, searchPlaylists as searchPlaylistsFromCf } from '@/services/music.service'
```
Then replace the existing `fetchPlaylists` and `fetchPlaylistSongs` actions (the `$appFetch` versions) with these, and ADD `searchPlaylists`:
```js
  async fetchPlaylists() {
    const { data, meta, error } = await fetchPlaylistsFromCf()

    return { data: data || [], meta, error }
  },

  async fetchPlaylistSongs(_context, { playlistId }) {
    const { data, meta, error } = await fetchPlaylistSongsFromCf(playlistId)

    return { data: data || [], meta, error }
  },

  async searchPlaylists(_context, { term }) {
    const { data, meta, error } = await searchPlaylistsFromCf(term)

    return { data: data || [], meta, error }
  }
```
(Leave `fetchArtists` and `fetchSongs` exactly as they are.)

- [ ] **Step 3: Lint**

Run: `npx eslint services/music.service.js store/music/actions.js`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add services/music.service.js store/music/actions.js
git commit -m "feat(music): route playlist calls to cloudflare via music service"
```

---

## Task 9: i18n keys

**Files (parolla):** modify `locales/en.js`, `locales/tr.js`.

- [ ] **Step 1: `locales/en.js`**

In `musicMode.form.searchArtist`, change:
```js
        label: 'Search artist',
        placeholder: 'Type artist name',
```
to:
```js
        label: 'Search artist or playlist',
        placeholder: 'Type artist or playlist name',
```
Then in the `musicMode` block, after the `playlists: 'Playlists',` line, add:
```js
    groups: {
      artists: 'Artists',
      playlists: 'Playlists'
    },
```

- [ ] **Step 2: `locales/tr.js`**

In `musicMode.form.searchArtist`, change:
```js
        label: 'Sanatçı ara',
        placeholder: 'Sanatçı adı yaz',
```
to:
```js
        label: 'Sanatçı ya da Playlist ara',
        placeholder: 'Sanatçı ya da Playlist adı yaz',
```
Then in the `musicMode` block, after the `playlists: 'Çalma listeleri',` line, add:
```js
    groups: {
      artists: 'Sanatçılar',
      playlists: 'Çalma listeleri'
    },
```

- [ ] **Step 3: Lint + commit**

Run: `npx eslint locales/en.js locales/tr.js` (expect clean), then:
```bash
git add locales/en.js locales/tr.js
git commit -m "feat(music): add unified search + group i18n keys"
```

---

## Task 10: MusicArtistSelect — unified grouped search

**Files (parolla):** modify `components/Select/MusicArtistSelect/MusicArtistSelect.component.vue`

- [ ] **Step 1: Update the template** (grouped options + per-type option rendering)

Replace the `multiselect(...)` opening tag attributes and the `option` slot. Specifically, change `label="artistName"`, `track-by="artistId"`, `:options="artists"` to grouped form and update the option slot. Replace lines 4–32 (the `multiselect(` block through the end of the `option` slot template) with:
```pug
  multiselect(
    v-model="selected"
    label="displayName"
    :placeholder="$t('musicMode.form.searchArtist.placeholder')"
    track-by="key"
    :options="groups"
    group-label="groupLabel"
    group-values="items"
    :group-select="false"
    :searchable="true"
    :multiple="true"
    :internal-search="false"
    :close-on-select="true"
    :clear-on-select="false"
    :show-labels="false"
    :reset-after="true"
    :max="3"
    :loading="isLoading"
    @search-change="handleSearchChange"
    @select="handleSelect"
    @remove="handleRemove"
  )
    template(#placeholder)
      .placeholder
        AppIcon.placeholder__icon(name="tabler:search" :width="20" :height="20")
        span.placeholder__text {{ $t('musicMode.form.searchArtist.placeholder') }}
    template(slot="option" slot-scope="{ option }")
      .music-artist-select__option(v-if="option.$isLabel")
        span.music-artist-select__option-group {{ option.$groupLabel }}
      .music-artist-select__option(v-else)
        img.music-artist-select__option-image(v-if="option.artworkUrl" :src="option.artworkUrl" :alt="option.displayName")
        AppIcon.music-artist-select__option-icon(v-else :name="option.type === 'playlist' ? 'tabler:playlist' : 'tabler:music'")
        span.music-artist-select__option-text {{ option.displayName }}
        span.music-artist-select__option-genre(v-if="option.primaryGenreName") {{ option.primaryGenreName }}
```
> `vue-multiselect` group headers come through the option slot with `option.$isLabel` + `option.$groupLabel`. Normalized items carry a single `artworkUrl` (artists: from `artwork.artworkUrl`; playlists: from `artworkUrl`).

- [ ] **Step 2: Update the script** (parallel artist+playlist search → grouped, normalized)

Replace the `setup(...)` body's `selectedArtist`/`artists`/`searchArtists` section. Specifically replace from `const selectedArtist = ref([])` through the end of `searchArtists` (the `}` before `const debouncedSearch`) with:
```js
    const selected = ref([])
    const groups = ref([])
    const isLoading = ref(false)

    const searchMusic = async searchQuery => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        groups.value = []

        return
      }

      isLoading.value = true

      try {
        const [artistsResult, playlistsResult] = await Promise.all([
          store.dispatch('music/fetchArtists', { term: searchQuery.trim() }),
          store.dispatch('music/searchPlaylists', { term: searchQuery.trim() })
        ])

        const artistItems = (artistsResult?.data || []).map(artist => ({
          ...artist,
          type: 'artist',
          key: `artist:${artist.artistId}`,
          displayName: artist.artistName,
          artworkUrl: artist.artwork?.artworkUrl || null
        }))

        const playlistItems = (playlistsResult?.data || []).map(playlist => ({
          ...playlist,
          type: 'playlist',
          key: `playlist:${playlist.playlistId}`,
          displayName: playlist.name
        }))

        const nextGroups = []

        if (artistItems.length) {
          nextGroups.push({ groupLabel: i18n.t('musicMode.groups.artists'), items: artistItems })
        }

        if (playlistItems.length) {
          nextGroups.push({ groupLabel: i18n.t('musicMode.groups.playlists'), items: playlistItems })
        }

        groups.value = nextGroups
      } catch (error) {
        console.error('Error searching music:', error)
        groups.value = []
      } finally {
        isLoading.value = false
      }
    }
```
Update the import line to add `useContext` and the debounce target:
```js
import { defineComponent, ref, useStore } from '@nuxtjs/composition-api'
```
to:
```js
import { defineComponent, ref, useStore, useContext } from '@nuxtjs/composition-api'
```
Add `const { i18n } = useContext()` right after `const store = useStore()`. Change `const debouncedSearch = useDebounceFn(searchArtists, 500)` to `const debouncedSearch = useDebounceFn(searchMusic, 500)`. Finally, update the `return { ... }` to expose the new names:
```js
    return {
      selected,
      groups,
      isLoading,
      handleSearchChange,
      handleSelect,
      handleRemove
    }
```

- [ ] **Step 3: Lint**

Run: `npx eslint components/Select/MusicArtistSelect/MusicArtistSelect.component.vue`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/Select/MusicArtistSelect/MusicArtistSelect.component.vue
git commit -m "feat(music): unified grouped artist+playlist search input"
```

---

## Task 11: GuessTheSongScene — selection model (artists XOR playlist)

**Files (parolla):** modify `components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.vue` (+ `.scss`).

- [ ] **Step 1: Template — selected playlist block + play button + cards**

(a) After the `.guess-the-song-scene-selected-artists` block (ends at the artist `__list`, line ~35) and BEFORE the Play button (line ~37), add a selected-playlist block:
```pug
    .guess-the-song-scene-selected-playlist(v-if="selectedPlaylist")
      span.guess-the-song-scene-selected-artists-title {{ $t('musicMode.groups.playlists') }}
      .guess-the-song-scene-selected-playlist-card
        img.guess-the-song-scene-selected-playlist-image(v-if="selectedPlaylist.artworkUrl" :src="selectedPlaylist.artworkUrl" :alt="selectedPlaylist.name")
        AppIcon.guess-the-song-scene-selected-playlist-icon(v-else name="tabler:playlist" :width="60" :height="60")
        span.guess-the-song-scene-selected-playlist-text {{ selectedPlaylist.name }}
        button.guess-the-song-scene-selected-artist-remove(type="button" @click="handlePlaylistRemove") ×
```
(b) Replace the Play button (line ~37–38):
```pug
    Button.guess-the-song-scene-play-button(type="button" :disabled="selectedArtists.length === 0" @click="handleClickPlayButton")
      | {{ $t('musicMode.play') }}
```
with:
```pug
    Button.guess-the-song-scene-play-button(type="button" :disabled="!canPlay" @click="handleClickPlayButton")
      | {{ $t('musicMode.play') }}
```
(c) The playlists cards `@click="handleClickPlaylist(playlist)"` stays — but its handler changes in Step 2 (selection-state, not navigate). No template change needed there. Also wrap the selected-artists block so it only shows in artist mode is optional; leave as-is (it's empty when no artists).

- [ ] **Step 2: Script — `selectedPlaylist` + mutual exclusivity + canPlay**

(a) Add the ref after `const playlists = ref([])` (line ~90):
```js
    const selectedPlaylist = ref(null)
```
(b) In `handleArtistSelect`, clear the playlist when an artist is added. Replace:
```js
    const handleArtistSelect = artist => {
      if (artist && !selectedArtists.value.find(a => a.artistId === artist.artistId)) {
        selectedArtists.value.push(artist)
      }
    }
```
with:
```js
    const handleArtistSelect = artist => {
      if (artist && !selectedArtists.value.find(a => a.artistId === artist.artistId)) {
        selectedPlaylist.value = null
        selectedArtists.value.push(artist)
      }
    }
```
(c) Add a unified select handler that the MusicArtistSelect `@select` uses (branches on type). The scene template currently binds `@select="handleArtistSelect"` on `MusicArtistSelect` (line 13) — change that binding to `@select="handleSelect"` and add:
```js
    const handleSelect = option => {
      if (!option) return

      if (option.type === 'playlist') {
        handlePlaylistSelect(option)

        return
      }

      handleArtistSelect(option)
    }
```
(d) Add playlist select/remove handlers:
```js
    const handlePlaylistSelect = playlist => {
      if (!playlist) return

      selectedArtists.value = []
      selectedPlaylist.value = { playlistId: playlist.playlistId, name: playlist.name, artworkUrl: playlist.artworkUrl }
    }

    const handlePlaylistRemove = () => {
      selectedPlaylist.value = null
    }
```
(e) Replace `handleClickPlaylist` (the curated card handler, currently navigates) with selection-state:
```js
    const handleClickPlaylist = playlist => {
      if (!playlist) return

      handlePlaylistSelect(playlist)
      document.querySelector('.layout__main').scrollTo({ top: 0, behavior: 'smooth' })
    }
```
(f) Replace `handleClickPlayButton` to branch on selection:
```js
    const handleClickPlayButton = () => {
      const query = selectedPlaylist.value
        ? { playlistId: selectedPlaylist.value.playlistId }
        : { artistIds: selectedArtists.value.map(artist => artist.artistId).join(',') }

      router.push(localePath({ name: 'MusicMode-GuessTheSong-Play', query }))
    }
```
(g) In `handleClickPopularArtist`, it calls `handleArtistSelect(mappedArtist)` which now clears the playlist — good, no extra change.
(h) Add `canPlay` computed (after `disabledPopularArtistsClass`):
```js
    const canPlay = computed(() => selectedArtists.value.length > 0 || !!selectedPlaylist.value)
```
(i) Update the `return { ... }`: add `selectedPlaylist`, `handleSelect`, `handlePlaylistRemove`, `canPlay` (and keep existing). The MusicArtistSelect binding uses `handleSelect`; `handleArtistSelect` is still used internally by `handleClickPopularArtist` and `handleSelect` (no need to expose if not in template — but `@select` now uses `handleSelect`; `handleArtistRemove` still bound on `@remove`). Final return:
```js
    return {
      rootRef,
      musicArtistSelectRef,
      form,
      artists,
      selectedArtists,
      selectedPlaylist,
      handleSelect,
      handleArtistRemove,
      handlePlaylistRemove,
      handleClickPlayButton,
      canPlay,
      popularArtists,
      handleClickPopularArtist,
      disabledPopularArtistsClass,
      playlists,
      handleClickPlaylist
    }
```
(j) Update the `MusicArtistSelect` template binding (line 13) from `@select="handleArtistSelect"` to `@select="handleSelect"`.

- [ ] **Step 3: SCSS — selected playlist card**

In `GuessTheSongScene.component.scss`, inside the root `.guess-the-song-scene { … }` block (before its final `}`), add:
```scss
  &-selected-playlist {
    max-width: var(--mobile);
    margin: 0 auto;
    margin-block-start: $spacer * 4;

    &-card {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: $spacer * 2;
      align-items: center;
      width: max-content;
      margin: 0 auto;
    }

    &-image {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: var(--border-radius-01);
    }

    &-icon {
      width: 80px !important;
      height: 80px !important;
    }

    &-text {
      color: var(--color-text-02);
      font-size: var(--font-size-text-9);
      text-align: center;
    }
  }
```
(The `× ` remove button reuses the existing `.guess-the-song-scene-selected-artist-remove` class.)

- [ ] **Step 4: Lint**

Run:
```bash
npx eslint components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.vue
npx stylelint "components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.scss"
```
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.vue components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.scss
git commit -m "feat(music): playlist selection (xor artists) in music quiz scene"
```

---

## Task 12: Final lint + wrangler smoke

**Files:** none (verification).

- [ ] **Step 1: Full lint sweep (parolla)**

Run:
```bash
npx eslint store/music/actions.js services/music.service.js locales/en.js locales/tr.js "components/Scene/MusicModeScene/**/*.vue" "components/Select/MusicArtistSelect/*.vue" functions/api/music/*.js
npx stylelint "components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.scss"
```
Expected: clean.

- [ ] **Step 2: parolla-strapi typecheck/lint/build**

Run (in parolla-strapi): `pnpm typecheck && pnpm lint && pnpm build`
Expected: PASS, content-type still registers.

- [ ] **Step 3: (Optional) wrangler local smoke**

If wrangler is authenticated locally: terminal 1 `yarn dev`; terminal 2 `yarn dev:cf`; then:
```bash
curl -s 'http://localhost:8788/api/music/search-playlists?term=t%C3%BCrk%C3%A7e' | head -c 300
curl -s 'http://localhost:8788/api/music/playlist-songs?playlistId=pl.1ef459abf3b541488095d2c5518ec617&limit=5' | head -c 300
```
Expected: search returns playlist objects; songs returns previewable tracks + `meta.playlist.name`. If wrangler/local KV unavailable, rely on Task 3's live util verification + lint and note it.

- [ ] **Step 4: Confirm clean trees**

Run in both repos: `git status --porcelain`
Expected: empty, or only ` M auto-imports.d.ts` in parolla (leave it).

---

## Self-Review (completed by plan author)

**Spec coverage:** CF `_apple.js`+KV (spec §1,§2) → Tasks 2,3,7; `search-playlists` (§1) → Task 4; `playlists` enrich (§1) → Task 5; `playlist-songs` (§1) → Task 6; Strapi slim (§3) → Task 1; music.service + store (§4) → Task 8; MusicArtistSelect grouped search (§4) → Task 10; scene selection XOR + cards selection-state (§4) → Task 11; i18n (§5) → Task 9; token risk/env override (§6) → Task 2 (`APPLE_MUSIC_TOKEN` in `getToken`) + Task 7 (Pages env). Play scene needs no change (its `music/fetchPlaylistSongs` dispatch is rewired in Task 8) — noted, no task.

**Type/name consistency:** service exports `fetchPlaylists`/`fetchPlaylistSongs`/`searchPlaylists` ↔ store imports (Task 8) ↔ MusicArtistSelect `music/searchPlaylists` + `music/fetchArtists` dispatch (Task 10) ↔ scene `selectedPlaylist {playlistId,name,artworkUrl}` ↔ play scene `meta.playlist`. CF responses `{data,meta,error}`; playlist item shape `{playlistId,name,artworkUrl}` consistent across search/enrich and frontend. `handleSelect` (Task 11) consumes the typed option from MusicArtistSelect `@select` (Task 10).

**Placeholder scan:** `wrangler.toml` KV ids are explicit operator-fill placeholders (Task 7 Step 4), not code gaps; everything else is exact code/commands.

**Adaptation note:** No test framework — CF util verified live (Task 3), everything else gated by lint/typecheck/build + optional wrangler smoke. Matches repo conventions.
