# Music Featured Content & Tag-Based Playlist Browse — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drive the Guess-the-Song landing page's featured artists/playlists from Strapi (rename `MusicPlaylist` → `MusicFeaturedPlaylist`, add `MusicFeaturedArtist`), and add a locale-based tag-chip cloud that runs a paginated Apple Music playlist search rendered with `vue-infinite-loading`.

**Architecture:** Strapi stores curated Apple Music IDs (playlists + artists). Cloudflare Pages Functions read those IDs and enrich them through the existing AMP (`_apple.js`) helper. The Nuxt frontend fetches via the store and renders featured grids + a tag-driven infinite-scroll results list.

**Tech Stack:** Strapi 5 (TS, core factories, Document API), Cloudflare Pages Functions (JS, AMP token scrape), Nuxt 2 + `@nuxtjs/composition-api`, Vuex, `vue-infinite-loading@2.4.5`, pug + SCSS.

**Repos (absolute paths):**
- Backend: `/Users/selim.doyranli/projects/selimdoyranli/github/parolla-strapi`
- Frontend: `/Users/selim.doyranli/projects/selimdoyranli/github/parolla`

**Verification note:** No unit-test harness exists in either repo. Each task verifies with the repo's real gates: Strapi `npm run typecheck` + `npm run lint:eslint`; frontend `npx eslint`, `npx stylelint`, `npx prettier --check --end-of-line crlf`, and a pug-compile node snippet for `.vue` templates. Run frontend commands from the parolla repo root.

**Branch:** both repos are on `feature/music-quiz-playlist`; commit there.

---

## Task 1: Strapi — rename `MusicPlaylist` → `MusicFeaturedPlaylist`

**Repo:** parolla-strapi

**Files:**
- Create: `src/api/music-featured-playlist/content-types/music-featured-playlist/schema.json`
- Create: `src/api/music-featured-playlist/controllers/music-featured-playlist.ts`
- Create: `src/api/music-featured-playlist/routes/music-featured-playlist.ts`
- Create: `src/api/music-featured-playlist/services/music-featured-playlist.ts`
- Delete: `src/api/music-playlist/` (whole directory)

- [ ] **Step 1: Create the schema**

`src/api/music-featured-playlist/content-types/music-featured-playlist/schema.json`:

```json
{
  "kind": "collectionType",
  "collectionName": "music_featured_playlists",
  "info": {
    "singularName": "music-featured-playlist",
    "pluralName": "music-featured-playlists",
    "displayName": "MusicFeaturedPlaylist"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "appleMusicPlaylistId": {
      "type": "string",
      "required": true,
      "unique": true,
      "minLength": 3,
      "maxLength": 128
    },
    "sortOrder": {
      "type": "integer",
      "required": true,
      "default": 0
    },
    "internalTitle": {
      "type": "string",
      "required": false,
      "maxLength": 255
    }
  }
}
```

- [ ] **Step 2: Create the controller**

`src/api/music-featured-playlist/controllers/music-featured-playlist.ts`:

```ts
/**
 * music-featured-playlist controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::music-featured-playlist.music-featured-playlist')
```

- [ ] **Step 3: Create the route**

`src/api/music-featured-playlist/routes/music-featured-playlist.ts`:

```ts
/**
 * music-featured-playlist router
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreRouter('api::music-featured-playlist.music-featured-playlist')
```

- [ ] **Step 4: Create the service**

`src/api/music-featured-playlist/services/music-featured-playlist.ts`:

```ts
/**
 * music-featured-playlist service
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreService('api::music-featured-playlist.music-featured-playlist')
```

- [ ] **Step 5: Delete the old collection directory**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla-strapi
rm -rf src/api/music-playlist
```

- [ ] **Step 6: Verify typecheck (will fail — `music` controller still references old UID; fixed in Task 3)**

This task leaves a known dangling reference resolved in Task 3, so do NOT run typecheck yet. Proceed to Task 2, then Task 3, then verify. (If running tasks out of order, verify after Task 3.)

- [ ] **Step 7: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla-strapi
git add src/api/music-featured-playlist src/api/music-playlist
git commit -m "refactor(music): rename MusicPlaylist collection to MusicFeaturedPlaylist"
```

---

## Task 2: Strapi — add `MusicFeaturedArtist` collection

**Repo:** parolla-strapi

**Files:**
- Create: `src/api/music-featured-artist/content-types/music-featured-artist/schema.json`
- Create: `src/api/music-featured-artist/controllers/music-featured-artist.ts`
- Create: `src/api/music-featured-artist/routes/music-featured-artist.ts`
- Create: `src/api/music-featured-artist/services/music-featured-artist.ts`

- [ ] **Step 1: Create the schema**

`src/api/music-featured-artist/content-types/music-featured-artist/schema.json`:

```json
{
  "kind": "collectionType",
  "collectionName": "music_featured_artists",
  "info": {
    "singularName": "music-featured-artist",
    "pluralName": "music-featured-artists",
    "displayName": "MusicFeaturedArtist"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "appleMusicArtistId": {
      "type": "string",
      "required": true,
      "unique": true,
      "minLength": 1,
      "maxLength": 128
    },
    "sortOrder": {
      "type": "integer",
      "required": true,
      "default": 0
    },
    "internalTitle": {
      "type": "string",
      "required": false,
      "maxLength": 255
    }
  }
}
```

- [ ] **Step 2: Create the controller**

`src/api/music-featured-artist/controllers/music-featured-artist.ts`:

```ts
/**
 * music-featured-artist controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::music-featured-artist.music-featured-artist')
```

- [ ] **Step 3: Create the route**

`src/api/music-featured-artist/routes/music-featured-artist.ts`:

```ts
/**
 * music-featured-artist router
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreRouter('api::music-featured-artist.music-featured-artist')
```

- [ ] **Step 4: Create the service**

`src/api/music-featured-artist/services/music-featured-artist.ts`:

```ts
/**
 * music-featured-artist service
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreService('api::music-featured-artist.music-featured-artist')
```

- [ ] **Step 5: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla-strapi
git add src/api/music-featured-artist
git commit -m "feat(music): add MusicFeaturedArtist collection"
```

---

## Task 3: Strapi — update `music` controller + routes

**Repo:** parolla-strapi

**Files:**
- Modify: `src/api/music/controllers/music.ts` (the `fetchPlaylists` UID + new `fetchFeaturedArtists`)
- Modify: `src/api/music/routes/music.ts` (rename playlists route + add featured-artists route)

- [ ] **Step 1: Update `fetchPlaylists` to the renamed UID and add `fetchFeaturedArtists`**

In `src/api/music/controllers/music.ts`, change the `fetchPlaylists` documents call UID from `api::music-playlist.music-playlist` to `api::music-featured-playlist.music-featured-playlist`:

```ts
  async fetchPlaylists(ctx) {
    const entries = await strapi.documents('api::music-featured-playlist.music-featured-playlist').findMany({
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

Then add a new method immediately after `fetchPlaylists` (before `fetchArtists`):

```ts
  async fetchFeaturedArtists(ctx) {
    const entries = await strapi.documents('api::music-featured-artist.music-featured-artist').findMany({
      status: 'published',
      sort: ['sortOrder:asc', 'createdAt:asc'],
      fields: ['appleMusicArtistId', 'sortOrder'],
    })

    ctx.body = {
      data: entries.map((entry: any) => ({
        artistId: entry.appleMusicArtistId,
        sortOrder: entry.sortOrder,
      })),
      meta: {
        total: entries.length,
      },
    }
  },
```

- [ ] **Step 2: Update routes**

Replace the contents of `src/api/music/routes/music.ts` with:

```ts
export default {
  routes: [
    {
      method: 'GET',
      path: '/modes/music/featured-playlists',
      handler: 'music.fetchPlaylists',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/modes/music/featured-artists',
      handler: 'music.fetchFeaturedArtists',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/modes/music/artists',
      handler: 'music.fetchArtists',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/modes/music/songs',
      handler: 'music.fetchSongs',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
}
```

- [ ] **Step 3: Verify typecheck**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla-strapi
npm run typecheck
```
Expected: PASS (no errors). If it errors with "Cannot find ... music-playlist", search for any remaining `api::music-playlist.music-playlist` reference and fix.

- [ ] **Step 4: Verify lint**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla-strapi
npm run lint:eslint
```
Expected: PASS.

- [ ] **Step 5: Manual endpoint smoke test (optional, requires running Strapi)**

Start `npm run dev` in another shell, then:
```bash
curl -s http://localhost:1337/api/modes/music/featured-playlists | head
curl -s http://localhost:1337/api/modes/music/featured-artists | head
```
Expected: HTTP 200 with `{"data":[...],"meta":{"total":N}}` (arrays may be empty until data is entered — that is correct).

- [ ] **Step 6: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla-strapi
git add src/api/music/controllers/music.ts src/api/music/routes/music.ts
git commit -m "feat(music): featured-playlists + featured-artists strapi endpoints"
```

---

## Task 4 (MANUAL — user, not subagent): re-enter curated data + config-sync

This task requires the Strapi admin UI and cannot be automated.

- [ ] In Strapi admin, open **MusicFeaturedPlaylist** and re-create the curated playlist entries (the `appleMusicPlaylistId` values from the old collection), set `sortOrder`, and **publish** each.
- [ ] In **MusicFeaturedArtist**, add the curated Apple Music artist IDs (numeric, e.g. `263633866`), set `sortOrder`, and **publish** each.
- [ ] If your deployment relies on config-sync, run the plugin's **Export** from the admin (Settings → Config Sync) and commit the resulting `config/sync/` changes; delete any stale `…content_types##api::music-playlist…` file.

> The frontend hides the featured sections when their arrays are empty, so the app remains functional before data entry.

---

## Task 5: Frontend — rename CF `playlists.js` → `featured-playlists.js`

**Repo:** parolla

**Files:**
- Rename: `functions/api/music/playlists.js` → `functions/api/music/featured-playlists.js`
- Modify: the Strapi path inside it

- [ ] **Step 1: Move the file and update the Strapi path**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
git mv functions/api/music/playlists.js functions/api/music/featured-playlists.js
```

Then in `functions/api/music/featured-playlists.js`, change the Strapi fetch line from `/modes/music/playlists` to `/modes/music/featured-playlists`. Final file:

```js
import { ampFetch, formatArtwork, jsonResponse, localeToStorefront, localeToLang } from './_apple.js'

export async function onRequestGet(context) {
  const { request, env } = context
  const params = new URL(request.url).searchParams
  const storefront = localeToStorefront(params.get('locale'))
  const lang = localeToLang(params.get('locale'))
  const strapiBase = env.STRAPI_API_URL || 'https://strapi.parolla.app/api'

  let ids = []

  try {
    const res = await fetch(`${strapiBase}/modes/music/featured-playlists`)
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
          const json = await ampFetch(env, `/playlists/${encodeURIComponent(id)}?l=${lang}`, storefront)
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

- [ ] **Step 2: Verify lint**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
npx eslint --ignore-path .gitignore --ignore-path .eslintignore functions/api/music/featured-playlists.js
```
Expected: no output (PASS).

- [ ] **Step 3: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
git add functions/api/music/featured-playlists.js functions/api/music/playlists.js
git commit -m "refactor(music): rename CF playlists endpoint to featured-playlists"
```

---

## Task 6: Frontend — new CF `featured-artists.js`

**Repo:** parolla

**Files:**
- Create: `functions/api/music/featured-artists.js`

- [ ] **Step 1: Create the function**

`functions/api/music/featured-artists.js`:

```js
import { ampFetch, formatArtwork, jsonResponse, localeToStorefront, localeToLang } from './_apple.js'

export async function onRequestGet(context) {
  const { request, env } = context
  const params = new URL(request.url).searchParams
  const storefront = localeToStorefront(params.get('locale'))
  const lang = localeToLang(params.get('locale'))
  const strapiBase = env.STRAPI_API_URL || 'https://strapi.parolla.app/api'

  let ids = []

  try {
    const res = await fetch(`${strapiBase}/modes/music/featured-artists`)
    const body = await res.json()

    ids = (body?.data ?? []).map(entry => entry.artistId).filter(Boolean)
  } catch (err) {
    return jsonResponse({ data: [], error: 'Failed to load featured artists' }, 502)
  }

  if (!ids.length) {
    return jsonResponse({ data: [], meta: { total: 0 } })
  }

  try {
    const results = await Promise.all(
      ids.map(async id => {
        try {
          const json = await ampFetch(env, `/artists/${encodeURIComponent(id)}?fields=name,artwork,url&l=${lang}`, storefront)
          const attr = json?.data?.[0]?.attributes

          if (!attr) {
            return null
          }

          return { artistId: id, artistName: attr.name, artworkUrl: formatArtwork(attr.artwork?.url, 300) }
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

- [ ] **Step 2: Verify lint**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
npx eslint --ignore-path .gitignore --ignore-path .eslintignore functions/api/music/featured-artists.js
```
Expected: no output (PASS).

- [ ] **Step 3: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
git add functions/api/music/featured-artists.js
git commit -m "feat(music): add CF featured-artists endpoint (AMP-enriched)"
```

---

## Task 7: Frontend — new CF `search-playlists-by-tag.js`

**Repo:** parolla

**Files:**
- Create: `functions/api/music/search-playlists-by-tag.js`

- [ ] **Step 1: Create the function**

`functions/api/music/search-playlists-by-tag.js`:

```js
import { ampFetch, formatArtwork, jsonResponse, localeToStorefront, localeToLang } from './_apple.js'

const DEFAULT_LIMIT = 21
const MAX_LIMIT = 25

export async function onRequestGet(context) {
  const { request, env } = context
  const params = new URL(request.url).searchParams
  const term = (params.get('term') || '').trim()
  const storefront = localeToStorefront(params.get('locale'))
  const lang = localeToLang(params.get('locale'))

  const limitParam = Number(params.get('limit'))
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.floor(limitParam), MAX_LIMIT) : DEFAULT_LIMIT

  const offsetParam = Number(params.get('offset'))
  const offset = Number.isFinite(offsetParam) && offsetParam > 0 ? Math.floor(offsetParam) : 0

  if (term.length < 1) {
    return jsonResponse({ data: [], meta: { offset, limit, hasMore: false } })
  }

  try {
    const json = await ampFetch(
      env,
      `/search?term=${encodeURIComponent(term)}&types=playlists&limit=${limit}&offset=${offset}&l=${lang}`,
      storefront
    )
    const playlists = json?.results?.playlists
    const items = playlists?.data ?? []
    const data = items.map(p => ({
      playlistId: p.id,
      name: p.attributes?.name,
      artworkUrl: formatArtwork(p.attributes?.artwork?.url, 300)
    }))
    const hasMore = Boolean(playlists?.next) || data.length === limit

    return jsonResponse({ data, meta: { offset, limit, hasMore } })
  } catch (err) {
    return jsonResponse({ data: [], error: String((err && err.message) || err), meta: { offset, limit, hasMore: false } }, 502)
  }
}
```

- [ ] **Step 2: Verify lint**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
npx eslint --ignore-path .gitignore --ignore-path .eslintignore functions/api/music/search-playlists-by-tag.js
```
Expected: no output (PASS).

- [ ] **Step 3: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
git add functions/api/music/search-playlists-by-tag.js
git commit -m "feat(music): add paginated tag playlist search CF endpoint"
```

---

## Task 8: Frontend — music service functions

**Repo:** parolla

**Files:**
- Modify: `services/music.service.js`

- [ ] **Step 1: Rewrite the exports**

Replace the export block in `services/music.service.js` (keep the `fetchJson` helper at the top unchanged) so the exports read exactly:

```js
export const fetchFeaturedPlaylists = locale => fetchJson(`/api/music/featured-playlists?locale=${encodeURIComponent(locale || '')}`)

export const fetchFeaturedArtists = locale => fetchJson(`/api/music/featured-artists?locale=${encodeURIComponent(locale || '')}`)

export const fetchPlaylistSongs = (playlistId, locale) =>
  fetchJson(`/api/music/playlist-songs?playlistId=${encodeURIComponent(playlistId)}&locale=${encodeURIComponent(locale || '')}`)

export const searchPlaylists = (term, locale) =>
  fetchJson(`/api/music/search-playlists?term=${encodeURIComponent(term)}&locale=${encodeURIComponent(locale || '')}`)

export const searchPlaylistsByTag = ({ term, offset = 0, limit = 21, locale }) =>
  fetchJson(
    `/api/music/search-playlists-by-tag?term=${encodeURIComponent(term)}&offset=${offset}&limit=${limit}&locale=${encodeURIComponent(
      locale || ''
    )}`
  )
```

- [ ] **Step 2: Verify lint + prettier**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
npx eslint --ignore-path .gitignore --ignore-path .eslintignore services/music.service.js
npx prettier --config ./.prettierrc.js --check --end-of-line crlf services/music.service.js
```
Expected: eslint no output; prettier "All matched files use Prettier code style!". If prettier fails, run the same with `--write`.

- [ ] **Step 3: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
git add services/music.service.js
git commit -m "feat(music): featured + tag-search service functions"
```

---

## Task 9: Frontend — music store actions

**Repo:** parolla

**Files:**
- Modify: `store/music/actions.js`

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `store/music/actions.js` with:

```js
import { fetchArtists as fetchArtistsFromItunes, fetchSongs as fetchSongsFromItunes } from '@/services/itunes.service'
import {
  fetchFeaturedPlaylists as fetchFeaturedPlaylistsFromCf,
  fetchFeaturedArtists as fetchFeaturedArtistsFromCf,
  fetchPlaylistSongs as fetchPlaylistSongsFromCf,
  searchPlaylists as searchPlaylistsFromCf,
  searchPlaylistsByTag as searchPlaylistsByTagFromCf
} from '@/services/music.service'

export default {
  async fetchArtists({ commit }, { term }) {
    const { data, meta, error } = await fetchArtistsFromItunes({ term })

    return {
      data: data || [],
      meta,
      error
    }
  },

  async fetchSongs({ commit }, { artistIds }) {
    const perArtistLimit = 30

    const result = await fetchSongsFromItunes({
      artistIds,
      perArtistLimit
    })

    if (result.error) {
      throw new Error(result.error)
    }

    return {
      data: result.data || [],
      meta: result.meta,
      error: result.error
    }
  },

  async fetchFeaturedPlaylists({ commit }, { locale } = {}) {
    const { data, meta, error } = await fetchFeaturedPlaylistsFromCf(locale)

    return { data: data || [], meta, error }
  },

  async fetchFeaturedArtists({ commit }, { locale } = {}) {
    const { data, meta, error } = await fetchFeaturedArtistsFromCf(locale)

    return { data: data || [], meta, error }
  },

  async fetchPlaylistSongs({ commit }, { playlistId, locale }) {
    const { data, meta, error } = await fetchPlaylistSongsFromCf(playlistId, locale)

    return { data: data || [], meta, error }
  },

  async searchPlaylists({ commit }, { term, locale }) {
    const { data, meta, error } = await searchPlaylistsFromCf(term, locale)

    return { data: data || [], meta, error }
  },

  async searchPlaylistsByTag({ commit }, { term, offset, limit, locale }) {
    const { data, meta, error } = await searchPlaylistsByTagFromCf({ term, offset, limit, locale })

    return { data: data || [], meta, error }
  }
}
```

- [ ] **Step 2: Verify lint + prettier**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
npx eslint --ignore-path .gitignore --ignore-path .eslintignore store/music/actions.js
npx prettier --config ./.prettierrc.js --check --end-of-line crlf store/music/actions.js
```
Expected: PASS both.

- [ ] **Step 3: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
git add store/music/actions.js
git commit -m "feat(music): featured + tag-search store actions"
```

---

## Task 10: Frontend — register `vue-infinite-loading` plugin

**Repo:** parolla

**Files:**
- Create: `plugins/vue-infinite-loading.js`
- Modify: `nuxt.config.js` (plugins array)

- [ ] **Step 1: Create the plugin**

`plugins/vue-infinite-loading.js`:

```js
import Vue from 'vue'
import InfiniteLoading from 'vue-infinite-loading'

Vue.use(InfiniteLoading)
```

- [ ] **Step 2: Register it (client-only) in `nuxt.config.js`**

In the `plugins: [...]` array, add this line after the `acs` entry (note: the `acs` line currently has no trailing comma — add one):

```js
    { src: '~/plugins/acs', ssr: false }, // https://audiocss.dev — UI sound effects
    { src: '~/plugins/vue-infinite-loading', ssr: false } // https://www.npmjs.com/package/vue-infinite-loading
```

- [ ] **Step 3: Verify lint**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
npx eslint --ignore-path .gitignore --ignore-path .eslintignore plugins/vue-infinite-loading.js nuxt.config.js
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
git add plugins/vue-infinite-loading.js nuxt.config.js
git commit -m "chore(music): register vue-infinite-loading plugin (client-only)"
```

---

## Task 11: Frontend — i18n heading + tag-results strings

**Repo:** parolla

**Files:**
- Modify: `locales/tr.js` (the `musicMode` block)
- Modify: `locales/en.js` (the `musicMode` block)

- [ ] **Step 1: Update `locales/tr.js`**

In the `musicMode` block, change `popularArtists` and `playlists`, and add a `tagResults` object after `playlists`:

```js
    play: 'Oyna',
    playHint: 'Sanatçı veya playlist arayın ve seçin',
    popularArtists: 'Öne Çıkan Sanatçılar',
    playlists: 'Öne Çıkan Çalma Listeleri',
    tagResults: {
      noMore: 'Hepsi bu kadar',
      empty: 'Sonuç bulunamadı'
    },
```

(The `play` and `playHint` lines already exist — match on them to locate the spot; only `popularArtists`/`playlists` change and `tagResults` is added.)

- [ ] **Step 2: Update `locales/en.js`**

```js
    play: 'Oyna',
    playHint: 'Search and select an artist or playlist',
    popularArtists: 'Featured artists',
    playlists: 'Featured playlists',
    tagResults: {
      noMore: "That's all",
      empty: 'No results found'
    },
```

- [ ] **Step 3: Verify lint + prettier**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
npx eslint --ignore-path .gitignore --ignore-path .eslintignore locales/tr.js locales/en.js
npx prettier --config ./.prettierrc.js --check --end-of-line crlf locales/tr.js locales/en.js
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
git add locales/tr.js locales/en.js
git commit -m "i18n(music): featured headings + tag-results strings"
```

---

## Task 12: Frontend — featured artists from store (remove hardcoded array)

**Repo:** parolla

**Files:**
- Modify: `components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.vue`

- [ ] **Step 1: Template — featured artists section**

Change the popular-artists section so it hides when empty and uses `artworkUrl`. Replace:

```pug
    .guess-the-song-scene-popular-artists(:class="[disabledPopularArtistsClass]")
      span.guess-the-song-scene-popular-artists-title {{ $t('musicMode.popularArtists') }}

      .guess-the-song-scene-popular-artists__list
        .guess-the-song-scene-popular-artist(
          v-for="popularArtist in popularArtists"
          :key="popularArtist.artistId"
          @click="handleClickPopularArtist(popularArtist)"
        )
          img.guess-the-song-scene-popular-artist-image(
            v-if="popularArtist.artistImage"
            :src="popularArtist.artistImage"
            :alt="popularArtist.artistName"
          )
          AppIcon.guess-the-song-scene-popular-artist-icon(v-else name="tabler:music" :width="100" :height="100")
          span.guess-the-song-scene-popular-artist-text {{ popularArtist.artistName }}
```

with:

```pug
    .guess-the-song-scene-popular-artists(v-if="popularArtists.length" :class="[disabledPopularArtistsClass]")
      span.guess-the-song-scene-popular-artists-title {{ $t('musicMode.popularArtists') }}

      .guess-the-song-scene-popular-artists__list
        .guess-the-song-scene-popular-artist(
          v-for="popularArtist in popularArtists"
          :key="popularArtist.artistId"
          @click="handleClickPopularArtist(popularArtist)"
        )
          img.guess-the-song-scene-popular-artist-image(
            v-if="popularArtist.artworkUrl"
            :src="popularArtist.artworkUrl"
            :alt="popularArtist.artistName"
          )
          AppIcon.guess-the-song-scene-popular-artist-icon(v-else name="tabler:music" :width="100" :height="100")
          span.guess-the-song-scene-popular-artist-text {{ popularArtist.artistName }}
```

- [ ] **Step 2: Script — replace the hardcoded computed with a ref + fetch**

Add `const popularArtists = ref([])` next to the other refs (near `const playlists = ref([])`).

Replace the existing `useFetch` block:

```js
    useFetch(async () => {
      const { data } = await store.dispatch('music/fetchPlaylists', { locale: i18n.locale })
      playlists.value = Array.isArray(data) ? data : []
    })
```

with:

```js
    useFetch(async () => {
      const [playlistsRes, artistsRes] = await Promise.all([
        store.dispatch('music/fetchFeaturedPlaylists', { locale: i18n.locale }),
        store.dispatch('music/fetchFeaturedArtists', { locale: i18n.locale })
      ])

      playlists.value = Array.isArray(playlistsRes?.data) ? playlistsRes.data : []
      popularArtists.value = Array.isArray(artistsRes?.data) ? artistsRes.data : []
    })
```

Delete the entire hardcoded `const popularArtists = computed(() => { return [ ... ] })` block (the long array of artist objects).

Update `handleClickPopularArtist` to map `artworkUrl`:

```js
    const handleClickPopularArtist = artist => {
      if (artist) {
        const mappedArtist = {
          ...artist,
          artwork: {
            artworkUrl: artist.artworkUrl
          }
        }
        handleArtistSelect(mappedArtist)
        scrollToPlayButton()
      }
    }
```

`popularArtists` is already in the `return { ... }` object — keep it (now returning the ref instead of the computed).

- [ ] **Step 3: Verify (lint + prettier + pug compile)**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
npx eslint --ignore-path .gitignore --ignore-path .eslintignore components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.vue
npx prettier --config ./.prettierrc.js --check --end-of-line crlf components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.vue
node -e 'const fs=require("fs"),pug=require("pug");const f="components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.vue";const m=fs.readFileSync(f,"utf8").match(/<template lang="pug">([\s\S]*?)<\/template>/);pug.compile(m[1],{filename:f});console.log("PUG OK")'
```
Expected: eslint PASS, prettier PASS, "PUG OK".

- [ ] **Step 4: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
git add components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.vue
git commit -m "feat(music): load featured artists from strapi (drop hardcoded list)"
```

---

## Task 13: Frontend — tag chip cloud + infinite-scroll results

**Repo:** parolla

**Files:**
- Modify: `components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.vue`
- Modify: `components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.scss`
- Modify: `assets/sound/parolla.acs` and `static/sound/parolla.acs` (chip click sound)

- [ ] **Step 1: Template — add tag cloud + results after the playlists section**

Immediately after the closing of the `.guess-the-song-scene-playlists(v-if="playlists.length")` block and before the `// Ad` comment, add:

```pug
    .guess-the-song-scene-tags(v-if="featuredTags.length")
      button.guess-the-song-scene-tag(
        v-for="tag in featuredTags"
        :key="tag"
        type="button"
        :class="{ 'guess-the-song-scene-tag--active': tag === activeTag }"
        @click="handleSelectTag(tag)"
      ) {{ tag }}

    .guess-the-song-scene-tag-results(v-if="activeTag")
      .guess-the-song-scene-playlists__list
        .guess-the-song-scene-playlist(v-for="playlist in tagResults" :key="playlist.playlistId" @click="handleClickPlaylist(playlist)")
          img.guess-the-song-scene-playlist-image(v-if="playlist.artworkUrl" :src="playlist.artworkUrl" :alt="playlist.name")
          AppIcon.guess-the-song-scene-playlist-icon(v-else name="tabler:music" :width="100" :height="100")
          span.guess-the-song-scene-playlist-text {{ playlist.name }}

      client-only
        infinite-loading(
          :identifier="infiniteId"
          force-use-infinite-wrapper=".layout__main"
          @infinite="handleInfinite"
        )
          template(#no-more)
            span.guess-the-song-scene-tag-results__hint {{ $t('musicMode.tagResults.noMore') }}
          template(#no-results)
            span.guess-the-song-scene-tag-results__hint {{ $t('musicMode.tagResults.empty') }}
```

- [ ] **Step 2: Script — tag state + handlers**

Add the static, locale-keyed tag constant ABOVE `export default defineComponent({` (after the imports):

```js
const FEATURED_TAGS = {
  tr: ['En iyiler', 'Pop', 'Rock', 'Rap', 'Türkçe Pop', 'Metal', 'Elektronik', 'Hip-Hop', 'Dans', "90'lar", 'Arabesk'],
  en: ['Best of', 'Pop', 'Rock', 'Rap', 'Metal', 'Electronic', 'Hip-Hop', 'Dance', '90s', 'R&B', 'Indie']
}

const TAG_PAGE_LIMIT = 21
```

Inside `setup()`, add the reactive state (near the other refs):

```js
    const activeTag = ref(null)
    const tagResults = ref([])
    const tagOffset = ref(0)
    const infiniteId = ref(0)

    const featuredTags = computed(() => FEATURED_TAGS[i18n.locale] || FEATURED_TAGS.en)
```

Add the handlers (near `handleClickPlaylist`):

```js
    const handleSelectTag = tag => {
      if (activeTag.value === tag) {
        activeTag.value = null
        tagResults.value = []
        tagOffset.value = 0

        return
      }

      activeTag.value = tag
      tagResults.value = []
      tagOffset.value = 0
      infiniteId.value += 1
    }

    const handleInfinite = async $state => {
      if (!activeTag.value) {
        $state.complete()

        return
      }

      try {
        const { data, meta } = await store.dispatch('music/searchPlaylistsByTag', {
          term: activeTag.value,
          offset: tagOffset.value,
          limit: TAG_PAGE_LIMIT,
          locale: i18n.locale
        })

        const items = Array.isArray(data) ? data : []

        if (items.length) {
          tagResults.value.push(...items)
          tagOffset.value += TAG_PAGE_LIMIT
          $state.loaded()
        }

        if (!items.length || !meta?.hasMore) {
          $state.complete()
        }
      } catch (error) {
        $state.complete()
      }
    }
```

Add the new names to the `return { ... }` object: `featuredTags`, `activeTag`, `tagResults`, `infiniteId`, `handleSelectTag`, `handleInfinite`.

- [ ] **Step 3: SCSS — chips + results container**

Append to `GuessTheSongScene.component.scss`, inside the top-level `.guess-the-song-scene { ... }` block (before its closing brace), after the `&-playlist` rules:

```scss
  &-tags {
    display: flex;
    flex-wrap: wrap;
    gap: $spacer * 2;
    justify-content: center;
    max-width: var(--mobile);
    margin: 0 auto;
    margin-block-start: $spacer * 8;
  }

  &-tag {
    padding: $spacer * 2 $spacer * 4;
    color: var(--color-text-02);
    font-size: var(--font-size-text-9);
    background-color: var(--color-ui-02);
    border: 1px solid var(--color-border-02);
    border-radius: 999px;
    cursor: pointer;
    transition: color 0.18s ease, border-color 0.18s ease, background-color 0.18s ease;

    &:hover {
      color: var(--color-text-01);
      border-color: var(--color-brand-02);
    }

    &--active {
      color: #fff;
      background-color: var(--color-brand-02);
      border-color: var(--color-brand-02);
    }
  }

  &-tag-results {
    max-width: var(--mobile);
    margin: 0 auto;
    margin-block-start: $spacer * 6;
    padding-block-end: $spacer * 8;

    @include media-breakpoint-down(mobile) {
      padding-block-end: 20vh;
    }

    &__hint {
      display: block;
      color: var(--color-text-03);
      font-size: var(--font-size-text-10);
      text-align: center;
      padding-block: $spacer * 4;
    }
  }
```

- [ ] **Step 4: ACS — chip click sound (both files, keep them identical)**

In `assets/sound/parolla.acs` AND `static/sound/parolla.acs`, add a rule in the Music mode section (after the `.music-artist-select-*` pop rule):

```css
.guess-the-song-scene-tag { sound-on-click: tick; }
```

- [ ] **Step 5: Verify (lint + stylelint + prettier + pug compile + acs sync)**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
diff assets/sound/parolla.acs static/sound/parolla.acs && echo "ACS IN SYNC"
npx stylelint "components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.scss"
npx eslint --ignore-path .gitignore --ignore-path .eslintignore components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.vue
npx prettier --config ./.prettierrc.js --check --end-of-line crlf components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.vue components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.scss
node -e 'const fs=require("fs"),pug=require("pug");const f="components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.vue";const m=fs.readFileSync(f,"utf8").match(/<template lang="pug">([\s\S]*?)<\/template>/);pug.compile(m[1],{filename:f});console.log("PUG OK")'
```
Expected: "ACS IN SYNC", stylelint PASS, eslint PASS, prettier PASS, "PUG OK". Fix any prettier issues with `--write`; fix any stylelint property-order/specificity issues inline.

- [ ] **Step 6: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
git add components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.vue components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.scss assets/sound/parolla.acs static/sound/parolla.acs
git commit -m "feat(music): tag chip cloud + infinite-scroll playlist results"
```

---

## Task 14: Final verification

**Repo:** both

- [ ] **Step 1: Strapi gates**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla-strapi
npm run typecheck && npm run lint:eslint
```
Expected: both PASS.

- [ ] **Step 2: Frontend gates (lint the full touched set + build sanity)**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
npx eslint --ignore-path .gitignore --ignore-path .eslintignore \
  functions/api/music/featured-playlists.js \
  functions/api/music/featured-artists.js \
  functions/api/music/search-playlists-by-tag.js \
  services/music.service.js store/music/actions.js plugins/vue-infinite-loading.js \
  locales/tr.js locales/en.js \
  components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.vue
npx stylelint "components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.scss"
```
Expected: all PASS.

- [ ] **Step 3: Manual end-to-end (requires `yarn dev:cf` + seeded Strapi data)**

Open `/muzik/sarki-tahmin-et` and confirm: featured artists + featured playlists render from Strapi; both headings read "Öne Çıkan …"; the tag chip cloud appears below the playlists; tapping a chip loads a results grid that grows on scroll and stops at the end; selecting a result playlist starts the game flow with the play-button scroll + ACS sound.

- [ ] **Step 4: No commit needed unless fixups were made.**

---

## Self-review (done by plan author)

- **Spec coverage:** §4 → Tasks 1–3; §5 → Tasks 5–7; §6 → Tasks 8–9; §7 → Tasks 12–13; §8 → Task 11 (+ tag constant in Task 13); featured-artist enrichment via AMP → Task 6; data re-entry/config-sync → Task 4 (manual). All covered.
- **Type/name consistency:** CF shapes `{ playlistId, name, artworkUrl }` and `{ artistId, artistName, artworkUrl }` match the service → store → component usage; `fetchFeaturedPlaylists`/`fetchFeaturedArtists`/`searchPlaylistsByTag` names are identical across service, store, and component dispatches; `infiniteId`/`activeTag`/`tagResults`/`tagOffset` are consistent in script + template.
- **Placeholder scan:** none — every code step contains full content.
