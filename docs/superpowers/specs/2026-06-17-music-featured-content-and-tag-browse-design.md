# Music Quiz — Featured Content (Strapi-driven) & Tag-Based Playlist Browse

Date: 2026-06-17
Status: Approved (brainstorming)
Repos: `parolla` (Nuxt frontend + Cloudflare Pages Functions), `parolla-strapi` (Strapi 5 CMS)
Route affected: `/muzik/sarki-tahmin-et` (`MusicMode/GuessTheSong/index` → `GuessTheSongScene`)

## 1. Goal

Three connected changes to the Guess-the-Song landing page:

1. Replace the hardcoded `popularArtists` array in `GuessTheSongScene` with a Strapi-curated list, fetched and Apple-enriched the same way curated playlists already are.
2. Rename the Strapi `MusicPlaylist` collection to `MusicFeaturedPlaylist`, and add a parallel `MusicFeaturedArtist` collection that stores curated Apple Music artist IDs.
3. Add a static, locale-based tag-chip cloud below the featured playlists. Tapping a chip runs a paginated Apple Music playlist search (new endpoint) and renders results in a separate infinite-scroll list using `vue-infinite-loading`.

## 2. Decisions (locked during brainstorming)

- **Curation scope:** one global curated list per collection (no Strapi i18n). Apple localizes name/artwork via storefront, exactly like today's playlists.
- **Rename data:** clean rename; curated playlist IDs are re-entered by hand in the new collection (small dataset).
- **Tag results layout:** the featured-playlists grid stays; tag results render in a **separate** infinite-scroll list **below** the chip cloud.
- **Headings:** rename both — "Çalma listeleri" → "Öne Çıkan Çalma Listeleri" and "Popüler sanatçılar" → "Öne Çıkan Sanatçılar".
- **Featured artist enrichment:** via AMP `/artists/{id}` (proper artist image + localized name); placeholder icon when artwork is missing.
- **Tag search:** a dedicated new CF endpoint; the existing autocomplete `search-playlists` is left untouched.

## 3. Current architecture (baseline)

- **Strapi** `MusicPlaylist` (`api::music-playlist.music-playlist`, table `music_playlists`, no i18n): `appleMusicPlaylistId`, `sortOrder`, `internalTitle`. Custom `music` controller exposes `GET /modes/music/playlists` (returns curated IDs), plus iTunes-backed `/modes/music/artists` (search) and `/modes/music/songs`.
- **Cloudflare functions** (`functions/api/music/`): `playlists.js` reads the Strapi IDs then enriches each via `ampFetch('/playlists/{id}')`; `search-playlists.js` does an AMP playlist search (limit 10, no pagination); `_apple.js` provides `ampFetch`, `getToken` (scrape + KV cache), `formatArtwork`, `localeToStorefront`, `localeToLang`, `jsonResponse`.
- **Frontend** `store/music/actions.js` + `services/music.service.js` (CF-backed playlists/search) and `services/itunes.service.js` (artist/song search direct to iTunes). `GuessTheSongScene` renders a hardcoded `popularArtists` grid and a CF-fed playlists grid.
- `vue-infinite-loading@2.4.5` is already a dependency. Config-sync (`strapi-plugin-config-sync`) is active.

## 4. Strapi backend (`parolla-strapi`)

### 4.1 Rename `MusicPlaylist` → `MusicFeaturedPlaylist`
- New folder `src/api/music-featured-playlist/` (schema, controller, route, service) using core factories.
- `schema.json`: same attributes (`appleMusicPlaylistId`, `sortOrder`, `internalTitle`); `collectionName: "music_featured_playlists"`, `singularName: "music-featured-playlist"`, `pluralName: "music-featured-playlists"`, `displayName: "MusicFeaturedPlaylist"`. `draftAndPublish: true`.
- Delete `src/api/music-playlist/`. The old `music_playlists` table is dropped; curated IDs are re-entered in admin.
- UID changes to `api::music-featured-playlist.music-featured-playlist`.

### 4.2 New `MusicFeaturedArtist`
- `src/api/music-featured-artist/` (core factories).
- `schema.json` attributes:
  - `appleMusicArtistId`: string, required, unique, minLength 1, maxLength 128
  - `sortOrder`: integer, required, default 0
  - `internalTitle`: string, optional, maxLength 255
  - `collectionName: "music_featured_artists"`, `displayName: "MusicFeaturedArtist"`, `draftAndPublish: true`.

### 4.3 Custom `music` controller + routes
- `fetchPlaylists`: read `api::music-featured-playlist.music-featured-playlist` (published, `sort: ['sortOrder:asc','createdAt:asc']`, fields `['appleMusicPlaylistId','sortOrder']`); output unchanged `{ data: [{ playlistId, sortOrder }] }`.
- New `fetchFeaturedArtists`: read `api::music-featured-artist.music-featured-artist` the same way; output `{ data: [{ artistId, sortOrder }] }`.
- Routes (`config: { auth: false }`):
  - `GET /modes/music/playlists` → `GET /modes/music/featured-playlists` (renamed)
  - new `GET /modes/music/featured-artists`
  - `/modes/music/artists` and `/modes/music/songs` unchanged.
- **config-sync:** after the rename, run a fresh export and remove the stale `plugin_content_manager_configuration_content_types##api::music-playlist…` entry; add the two new content-type config entries.

## 5. Cloudflare Pages Functions (`parolla/functions/api/music/`)

### 5.1 `featured-playlists.js` (rename of `playlists.js`)
- Same logic; reads Strapi `${STRAPI_API_URL}/modes/music/featured-playlists`.
- Output unchanged: `{ data: [{ playlistId, name, artworkUrl }], meta: { total } }`.

### 5.2 `featured-artists.js` (new — mirrors playlists)
- Read IDs from Strapi `/modes/music/featured-artists`.
- For each ID: `ampFetch(env, '/artists/{id}?fields=name,artwork,url', storefront)`; read `data[0].attributes` → `{ artistId: id, artistName: attr.name, artworkUrl: formatArtwork(attr.artwork?.url, 300) }`. Skip on failure (`filter(Boolean)`).
- Output: `{ data: [{ artistId, artistName, artworkUrl }], meta: { total } }`.

### 5.3 `search-playlists-by-tag.js` (new; name adjustable)
- `GET ?term=&offset=0&limit=21&locale=`.
- Validate `term` (>= 1 char); clamp `limit` (default 21, max ~25) and `offset` (>= 0).
- `ampFetch(env, '/search?term={term}&types=playlists&limit={limit}&offset={offset}&l={lang}', storefront)`.
- Parse `json.results.playlists.data` → `[{ playlistId: p.id, name: p.attributes?.name, artworkUrl: formatArtwork(p.attributes?.artwork?.url, 300) }]`.
- `hasMore = Boolean(json.results?.playlists?.next)` (fallback `data.length === limit`).
- Output: `{ data, meta: { offset, limit, hasMore } }`.

## 6. Frontend store + services (`parolla`)

- `services/music.service.js`:
  - `fetchFeaturedPlaylists(locale)` → `/api/music/featured-playlists?locale=`
  - `fetchFeaturedArtists(locale)` → `/api/music/featured-artists?locale=`
  - `searchPlaylistsByTag({ term, offset, limit, locale })` → `/api/music/search-playlists-by-tag?...`
- `store/music/actions.js`: `fetchFeaturedPlaylists`, `fetchFeaturedArtists`, `searchPlaylistsByTag` (thin wrappers returning `{ data, meta, error }`).

## 7. `GuessTheSongScene` UI

Section order on the page:
1. Header + subtitle
2. Search form (`MusicArtistSelect`) + selected items + play button + hint
3. **Öne Çıkan Sanatçılar** (featured artists, from store)
4. **Öne Çıkan Çalma Listeleri** (featured playlists, from store)
5. **Tag chip cloud**
6. **Tag results list** (infinite scroll, lazy)

- **Featured artists:** remove the hardcoded `popularArtists` computed. On mount (`useFetch`) dispatch `music/fetchFeaturedArtists`. Tiles keep `.guess-the-song-scene-popular-artist` (preserves ACS `pop` sound + selection); `img` src uses `artworkUrl`. `handleClickPopularArtist` maps to `{ ...artist, artwork: { artworkUrl: artist.artworkUrl } }` for `handleArtistSelect`.
- **Tag chip cloud:** rendered from a static i18n array `musicMode.featuredTags`. One active chip at a time; styled as pill chips matching the reference screenshot in the app's coral/dark palette (active chip = coral). Chips get an ACS `tick`/`pop` sound via a class rule (optional, consistent with other chips like `.room-featured-tag-list-tag`).
- **Tag results list:** lazy — empty until a chip is tapped. Selecting a chip: set `activeTag`, reset `tagResults = []`, `tagOffset = 0`, bump an `infiniteId` (`:identifier`) to reset `<infinite-loading>`. `@infinite` handler calls `searchPlaylistsByTag({ term: activeTag, offset: tagOffset, limit: 21, locale })`, appends `data`, advances `tagOffset += limit`, then `$state.loaded()`; when `meta.hasMore === false` call `$state.complete()`. Render results as a grid of `.guess-the-song-scene-playlist` tiles (same selection behavior + ACS sound). Selecting a tag-result playlist behaves identically to selecting a featured one (`handleClickPlaylist` → scroll to play button).
- **`vue-infinite-loading` integration:** register/import the component; likely pass `force-use-infinite-wrapper=".layout__main"` because the page scrolls inside the layout container, not the window. Provide `no-more` / `no-results` slots (localized or empty).

## 8. i18n & tag keywords (`locales/tr.js`, `locales/en.js`)

- `musicMode.playlists`: "Öne Çıkan Çalma Listeleri" / "Featured playlists"
- `musicMode.popularArtists`: "Öne Çıkan Sanatçılar" / "Featured artists"
- New `musicMode.featuredTags` (array; label == search term; editable later):
  - tr: `['En iyiler', 'Pop', 'Rock', 'Rap', 'Türkçe Pop', 'Metal', 'Elektronik', 'Hip-Hop', 'Dans', "90'lar", 'Arabesk']`
  - en: `['Best of', 'Pop', 'Rock', 'Rap', 'Metal', 'Electronic', 'Hip-Hop', 'Dance', '90s', 'R&B', 'Indie']`
- Optional: `musicMode.tagResults.noMore` / `.empty` strings for infinite-loading slots.

## 9. Out of scope / risks

- AMP access uses the existing unauthenticated token-scrape path (`_apple.js`); no change to that mechanism.
- Some artists lack AMP artwork → fall back to the existing music-icon placeholder.
- `vue-infinite-loading` scroll-container detection may need `force-use-infinite-wrapper`; verify against `.layout__main`.
- Renaming the Strapi route path means `featured-playlists.js` must point at the new path in the same deploy; keep both repos in sync on release.

## 10. Acceptance criteria

- `GuessTheSongScene` has no hardcoded artist data; featured artists come from `MusicFeaturedArtist` via CF and are clickable/selectable with the same behavior + sound as before.
- Strapi exposes `MusicFeaturedPlaylist` and `MusicFeaturedArtist`; `/modes/music/featured-playlists` and `/modes/music/featured-artists` return curated IDs.
- The page shows "Öne Çıkan Sanatçılar" and "Öne Çıkan Çalma Listeleri" headings.
- A locale-based tag chip cloud renders below the featured playlists; tapping a chip loads paginated playlist results in a separate list that grows via infinite scroll and stops at the end.
- Selecting a tag-result playlist starts the game flow identically to a featured playlist.
- `pnpm/yarn` lint (eslint + stylelint + prettier) passes in `parolla`; `pnpm typecheck`/`lint` passes in `parolla-strapi`.
