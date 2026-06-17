# Music Quiz Playlist (Frontend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a playlist-based path to the Music Quiz "Şarkıyı Tahmin Et" game: a Playlists section in the music quiz scene, a `playlistId` branch in the play scene, and playlist context (name + cover) in the stats dialog — backed by the already-shipped parolla-strapi playlist endpoints.

**Architecture:** Two new Vuex actions call the Strapi backend via the existing `$appFetch` client. The music quiz scene fetches and renders playlist cards (cover + name); clicking one routes to the existing Play route with a `playlistId` query param. The play scene branches on that param, fetches the playlist's songs, and reuses the existing `buildRounds` (with empty `selectedIds`, the playlist becomes a single pool → 10 rounds × 3 random options). The stats dialog gains an optional `playlist` prop.

**Tech Stack:** Nuxt 2.17 / Vue 2 + `@nuxtjs/composition-api`, Vuex, pug templates, SCSS, yarn. No test framework — verification is the husky pre-commit gate (`lint:eslint` + `lint:stylelint` + `prettier` via lint-staged) plus manual smoke checks.

**Reference spec:** `docs/superpowers/specs/2026-06-16-music-quiz-playlist-frontend-design.md`

**Backend contract (live):**
- `GET /api/modes/music/playlists` → `{ data: [{ playlistId, name, artworkUrl }], meta: { total } }`
- `GET /api/modes/music/songs?playlistId=pl.xxx` → `{ data: [{ trackId(string), trackName, previewUrl, trackViewUrl, artistId:null, artistName, artworkUrl100 }], error, meta: { playlistId, total, playlist: { name, artworkUrl } } }`

**Conventions (must follow):**
- No semicolons, single quotes, pug templates, composition-api. Prettier runs on commit with **CRLF** line endings (`--end-of-line crlf`) — let it reformat; lint-staged re-stages.
- `$appFetch({ method, path, query })` returns `{ data, error }` where `data` is the backend body (`{ data, meta }`) — so the array is at `data.data`.
- Optional chaining (`?.`) is supported (used throughout the play scene).
- Do NOT stage `auto-imports.d.ts` (pre-existing CRLF churn, unrelated).
- We are on branch `feature/music-quiz-playlist` — do not create/switch branches.

**Verification model:** There is no unit-test harness. Each task's gate is: stage the files and commit — the husky pre-commit hook runs eslint/stylelint/prettier on them and **fails the commit on any lint error**. Optionally pre-check with `npx eslint <files>`. A final task runs a full project lint sweep.

---

## File Structure

**Modify only (no new files):**
- `store/music/actions.js` — add `fetchPlaylists` + `fetchPlaylistSongs` actions (Strapi via `$appFetch`).
- `locales/en.js` + `locales/tr.js` — add `musicMode.playlists` and `musicMode.guessTheSong.stats.playlist`.
- `components/Dialog/GuessTheSongStatsDialog/GuessTheSongStatsDialog.component.vue` — optional `playlist` prop + context block + share text.
- `components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.vue` — Playlists section (template + script).
- `components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.scss` — playlist card styles.
- `components/Scene/MusicModeScene/GuessTheSongPlayScene/GuessTheSongPlayScene.component.vue` — `playlistId` branch + `playlist` ref + stats/SEO wiring.

**Task order (dependency-driven):** 1 store → 2 i18n → 3 stats dialog → 4 scene → 5 play scene → 6 final lint sweep.

> **Empty/error handling decision:** the Playlists section renders only when `playlists.length > 0`. Empty or errored fetch → section hidden (does not disturb the existing popular-artists flow). No separate loading/empty UI, so no `playlistsEmpty` i18n key is needed.

---

## Task 1: Store actions for playlists

**Files:**
- Modify: `store/music/actions.js`

- [ ] **Step 1: Add the two actions**

The file currently ends with the `fetchSongs` action inside `export default { ... }`. Add `fetchPlaylists` and `fetchPlaylistSongs` after `fetchSongs` (add a comma after the `fetchSongs` closing brace). The actions are regular methods so `this.$appFetch` (injected, used the same way in `store/creator/actions.js`) is available:

```js
  async fetchPlaylists() {
    const { data, error } = await this.$appFetch({
      method: 'GET',
      path: 'modes/music/playlists'
    })

    return {
      data: data?.data || [],
      meta: data?.meta,
      error
    }
  },

  async fetchPlaylistSongs({ commit }, { playlistId }) {
    const { data, error } = await this.$appFetch({
      method: 'GET',
      path: 'modes/music/songs',
      query: { playlistId }
    })

    return {
      data: data?.data || [],
      meta: data?.meta,
      error
    }
  }
```

- [ ] **Step 2: Pre-check lint**

Run: `npx eslint store/music/actions.js`
Expected: no errors.

- [ ] **Step 3: Commit (pre-commit hook is the gate)**

```bash
git add store/music/actions.js
git commit -m "feat(music): add playlist store actions for strapi endpoints"
```
Expected: husky runs eslint + prettier on the file and the commit succeeds. If prettier reformats, it auto-re-stages — the commit still completes. Confirm `git status --porcelain` shows nothing except possibly `auto-imports.d.ts` (leave that unstaged).

---

## Task 2: i18n keys

**Files:**
- Modify: `locales/en.js`
- Modify: `locales/tr.js`

- [ ] **Step 1: Add keys to `locales/en.js`**

In the `musicMode` block, find:
```js
    play: 'Oyna',
    popularArtists: 'Popular artists',
```
Replace with:
```js
    play: 'Oyna',
    popularArtists: 'Popular artists',
    playlists: 'Playlists',
```
Then, in the same block's `guessTheSong.stats` object, find:
```js
        score: 'Score',
        selectedArtists: 'Selected artists',
        backToMusicMode: 'Back to music quiz'
```
Replace with:
```js
        score: 'Score',
        selectedArtists: 'Selected artists',
        playlist: 'Playlist',
        backToMusicMode: 'Back to music quiz'
```

- [ ] **Step 2: Add keys to `locales/tr.js`**

In the `musicMode` block, find:
```js
    play: 'Oyna',
    popularArtists: 'Popüler sanatçılar',
```
Replace with:
```js
    play: 'Oyna',
    popularArtists: 'Popüler sanatçılar',
    playlists: 'Çalma listeleri',
```
Then, in the same block's `guessTheSong.stats` object, find:
```js
        score: 'Skorum',
        selectedArtists: 'Seçilen sanatçılar',
        backToMusicMode: "Müzik quiz'e geri dön"
```
Replace with:
```js
        score: 'Skorum',
        selectedArtists: 'Seçilen sanatçılar',
        playlist: 'Çalma listesi',
        backToMusicMode: "Müzik quiz'e geri dön"
```

- [ ] **Step 3: Pre-check lint**

Run: `npx eslint locales/en.js locales/tr.js`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add locales/en.js locales/tr.js
git commit -m "feat(music): add playlist i18n keys (en + tr)"
```

---

## Task 3: Playlist context in the stats dialog

**Files:**
- Modify: `components/Dialog/GuessTheSongStatsDialog/GuessTheSongStatsDialog.component.vue`

- [ ] **Step 1: Add the `playlist` prop**

In the `props` object, find:
```js
    selectedArtists: {
      type: Array,
      required: false,
      default: () => []
    }
```
Replace with (add the `playlist` prop after it):
```js
    selectedArtists: {
      type: Array,
      required: false,
      default: () => []
    },
    playlist: {
      type: Object,
      required: false,
      default: null
    }
```

- [ ] **Step 2: Expose `playlist` from setup and use it in the share text**

In `setup`, find:
```js
    const selectedArtistsList = computed(() => props.selectedArtists || [])
```
Replace with:
```js
    const selectedArtistsList = computed(() => props.selectedArtists || [])
    const playlist = computed(() => props.playlist)
```
Then in `shareResults`, find:
```js
        artists: selectedArtistsList.value.map(artist => artist.artistName).join(', '),
```
Replace with:
```js
        artists: playlist.value
          ? playlist.value.name
          : selectedArtistsList.value.map(artist => artist.artistName).join(', '),
```
Then in the `return { ... }` object, find:
```js
      selectedArtistsList
```
Replace with:
```js
      selectedArtistsList,
      playlist
```

- [ ] **Step 3: Render the playlist context block in the template**

In the pug template, find:
```pug
    .results__selected-artists.mb-base(v-if="selectedArtistsList.length")
      span.results__selected-artists-title {{ $t('musicMode.selectedArtists.title') }}
      .results__selected-artists-list
        .results__artist(v-for="artist in selectedArtistsList" :key="artist.artistId")
          img.results__artist-avatar(:src="artist.artworkUrl100" :alt="artist.artistName")
          span.results__artist-name {{ artist.artistName }}
```
Replace with (add the playlist block before it and make the artist block `v-else-if`; reuses the existing `results__artist*` classes so no SCSS change is needed):
```pug
    .results__selected-artists.mb-base(v-if="playlist")
      span.results__selected-artists-title {{ $t('musicMode.guessTheSong.stats.playlist') }}
      .results__selected-artists-list
        .results__artist
          img.results__artist-avatar(v-if="playlist.artworkUrl" :src="playlist.artworkUrl" :alt="playlist.name")
          span.results__artist-name {{ playlist.name }}

    .results__selected-artists.mb-base(v-else-if="selectedArtistsList.length")
      span.results__selected-artists-title {{ $t('musicMode.selectedArtists.title') }}
      .results__selected-artists-list
        .results__artist(v-for="artist in selectedArtistsList" :key="artist.artistId")
          img.results__artist-avatar(:src="artist.artworkUrl100" :alt="artist.artistName")
          span.results__artist-name {{ artist.artistName }}
```

- [ ] **Step 4: Pre-check lint**

Run: `npx eslint components/Dialog/GuessTheSongStatsDialog/GuessTheSongStatsDialog.component.vue`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/Dialog/GuessTheSongStatsDialog/GuessTheSongStatsDialog.component.vue
git commit -m "feat(music): show playlist context in guess-the-song stats dialog"
```

---

## Task 4: Playlists section in the music quiz scene

**Files:**
- Modify: `components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.vue`
- Modify: `components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.scss`

- [ ] **Step 1: Add the Playlists section to the template**

In the pug template, find the popular-artists section followed by the Ad comment:
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

    // Ad
    AppAd(:data-ad-slot="9964323575")
```
Replace with (insert the playlists section between the popular-artists section and the Ad):
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

    .guess-the-song-scene-playlists(v-if="playlists.length")
      span.guess-the-song-scene-playlists-title {{ $t('musicMode.playlists') }}

      .guess-the-song-scene-playlists__list
        .guess-the-song-scene-playlist(
          v-for="playlist in playlists"
          :key="playlist.playlistId"
          @click="handleClickPlaylist(playlist)"
        )
          img.guess-the-song-scene-playlist-image(
            v-if="playlist.artworkUrl"
            :src="playlist.artworkUrl"
            :alt="playlist.name"
          )
          AppIcon.guess-the-song-scene-playlist-icon(v-else name="tabler:music" :width="100" :height="100")
          span.guess-the-song-scene-playlist-text {{ playlist.name }}

    // Ad
    AppAd(:data-ad-slot="9964323575")
```

- [ ] **Step 2: Add store + useFetch imports**

Find the composition-api import line:
```js
import { defineComponent, useContext, useRouter, ref, reactive, computed } from '@nuxtjs/composition-api'
```
Replace with:
```js
import { defineComponent, useContext, useStore, useRouter, useFetch, ref, reactive, computed } from '@nuxtjs/composition-api'
```

- [ ] **Step 3: Fetch playlists and add the click handler in setup**

Find the start of `setup`:
```js
  setup() {
    const rootRef = ref(null)
    const musicArtistSelectRef = ref(null)

    const { localePath } = useContext()
    const router = useRouter()

    const artists = ref([])
    const selectedArtists = ref([])
```
Replace with:
```js
  setup() {
    const rootRef = ref(null)
    const musicArtistSelectRef = ref(null)

    const store = useStore()
    const { localePath } = useContext()
    const router = useRouter()

    const artists = ref([])
    const selectedArtists = ref([])
    const playlists = ref([])

    useFetch(async () => {
      const { data } = await store.dispatch('music/fetchPlaylists')
      playlists.value = Array.isArray(data) ? data : []
    })

    const handleClickPlaylist = playlist => {
      if (!playlist) return

      router.push(
        localePath({
          name: 'MusicMode-GuessTheSong-Play',
          query: { playlistId: playlist.playlistId }
        })
      )
    }
```

- [ ] **Step 4: Expose `playlists` and `handleClickPlaylist` from setup**

Find the `return { ... }` block end:
```js
      popularArtists,
      handleClickPopularArtist,
      disabledPopularArtistsClass
    }
```
Replace with:
```js
      popularArtists,
      handleClickPopularArtist,
      disabledPopularArtistsClass,
      playlists,
      handleClickPlaylist
    }
```

- [ ] **Step 5: Add playlist card styles to the SCSS**

In `components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.scss`, the file is a single `.guess-the-song-scene { ... }` block; the last nested block is `&-popular-artist { ... }`. Insert the following two blocks immediately AFTER the `&-popular-artist { ... }` block and BEFORE the final closing `}` of `.guess-the-song-scene`:

```scss
  &-playlists {
    max-width: var(--mobile);
    margin: 0 auto;
    margin-block-start: $spacer * 8;
    padding-block-end: $spacer * 8;

    @include media-breakpoint-down(mobile) {
      padding-block-end: 20vh;
    }

    &-title {
      display: flex;
      justify-content: center;
      margin: 0;
      color: var(--color-text-02);
      font-size: var(--font-size-text-10);
      letter-spacing: 0.05em;
      text-align: center;
      text-transform: uppercase;
      margin-block-end: $spacer * 4;
    }

    &__list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: $spacer * 4;
    }
  }

  &-playlist {
    display: flex;
    flex-direction: column;
    gap: $spacer * 2;
    align-items: center;
    padding: $spacer * 2 $spacer * 4;
    background-color: transparent;
    border-radius: var(--border-radius-01);
    transition: transform 0.1s;

    &:hover {
      transform: scale(1.05);
      cursor: pointer;
    }

    &-icon {
      width: 80px !important;
      height: 80px !important;
    }

    &-image {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: var(--border-radius-01);
    }

    &-text {
      color: var(--color-text-02);
      font-size: var(--font-size-text-9);
      text-align: center;
    }
  }
```

- [ ] **Step 6: Pre-check lint (eslint + stylelint)**

Run:
```bash
npx eslint components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.vue
npx stylelint "components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.scss"
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.vue components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.scss
git commit -m "feat(music): add playlists section to music quiz scene"
```

---

## Task 5: `playlistId` branch in the play scene

**Files:**
- Modify: `components/Scene/MusicModeScene/GuessTheSongPlayScene/GuessTheSongPlayScene.component.vue`

- [ ] **Step 1: Add `playlistId` computed + `playlist` ref**

Find:
```js
    const artistIds = computed(() => route.value.query.artistIds)
    const selectedArtistIds = computed(() =>
      (artistIds.value || '')
        .split(',')
        .filter(Boolean)
        .map(id => String(id))
    )
```
Replace with:
```js
    const artistIds = computed(() => route.value.query.artistIds)
    const selectedArtistIds = computed(() =>
      (artistIds.value || '')
        .split(',')
        .filter(Boolean)
        .map(id => String(id))
    )
    const playlistId = computed(() => route.value.query.playlistId)
    const playlist = ref(null)
```

- [ ] **Step 2: Branch the `useFetch` callback on `playlistId`**

Find:
```js
    const { fetch, fetchState } = useFetch(async () => {
      const ids = selectedArtistIds.value
      const { data, meta } = await store.dispatch('music/fetchSongs', { artistIds: ids })

      selectedArtists.value = meta?.artists || []

      const previewable = Array.isArray(data) ? data.filter(song => !!song.previewUrl) : []
      songs.value = ids.length === 0 ? previewable : previewable.filter(song => ids.includes(String(song.artistId)))
      rounds.value = buildRounds(songs.value, TOTAL_ROUNDS, ids)
      roundIndex.value = 0
      selectedOptionId.value = null
      roundResults.value = new Array(TOTAL_ROUNDS).fill('pending')
      isStatsDialogOpen.value = false
    })
```
Replace with:
```js
    const { fetch, fetchState } = useFetch(async () => {
      if (playlistId.value) {
        const { data, meta } = await store.dispatch('music/fetchPlaylistSongs', { playlistId: playlistId.value })

        playlist.value = meta?.playlist || null

        const previewable = Array.isArray(data) ? data.filter(song => !!song.previewUrl) : []
        songs.value = previewable
        rounds.value = buildRounds(songs.value, TOTAL_ROUNDS, [])
      } else {
        const ids = selectedArtistIds.value
        const { data, meta } = await store.dispatch('music/fetchSongs', { artistIds: ids })

        selectedArtists.value = meta?.artists || []

        const previewable = Array.isArray(data) ? data.filter(song => !!song.previewUrl) : []
        songs.value = ids.length === 0 ? previewable : previewable.filter(song => ids.includes(String(song.artistId)))
        rounds.value = buildRounds(songs.value, TOTAL_ROUNDS, ids)
      }

      roundIndex.value = 0
      selectedOptionId.value = null
      roundResults.value = new Array(TOTAL_ROUNDS).fill('pending')
      isStatsDialogOpen.value = false
    })
```

- [ ] **Step 3: Add a `contextLabel` computed for SEO and replace the meta artist expressions**

Find:
```js
    const selectedArtists = ref([])

    const statsButtonLabel = computed(() => (isLastRound.value ? finishLabel.value : nextLabel.value))
```
Replace with:
```js
    const selectedArtists = ref([])

    const contextLabel = computed(() =>
      playlist.value ? playlist.value.name : selectedArtists.value.map(artist => artist.artistName).join(',')
    )

    const statsButtonLabel = computed(() => (isLastRound.value ? finishLabel.value : nextLabel.value))
```
Then, in the `useMeta(() => ({ ... }))` block, replace ALL occurrences of:
```js
selectedArtists.value.map(artist => artist.artistName).join(',')
```
with:
```js
contextLabel.value
```
(There are 4 occurrences — title, description, og:title, og:description, twitter:description. Replace every one inside `useMeta`. Note these use `.join(',')` with no space; the share-text version elsewhere is untouched.)

- [ ] **Step 4: Pass `playlist` to the stats dialog and expose it**

In the pug template, find:
```pug
  GuessTheSongStatsDialog(
    :is-open="isStatsDialogOpen"
    :stats="stats"
    :selected-artists="selectedArtists"
```
Replace with:
```pug
  GuessTheSongStatsDialog(
    :is-open="isStatsDialogOpen"
    :stats="stats"
    :selected-artists="selectedArtists"
    :playlist="playlist"
```
Then in the `return { ... }` block, find:
```js
      isStatsDialogOpen,
      stats,
      selectedArtists,
```
Replace with:
```js
      isStatsDialogOpen,
      stats,
      selectedArtists,
      playlist,
```

- [ ] **Step 5: Pre-check lint**

Run: `npx eslint components/Scene/MusicModeScene/GuessTheSongPlayScene/GuessTheSongPlayScene.component.vue`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/Scene/MusicModeScene/GuessTheSongPlayScene/GuessTheSongPlayScene.component.vue
git commit -m "feat(music): play playlist songs via playlistId query param"
```

---

## Task 6: Final lint sweep

**Files:** none (verification only).

- [ ] **Step 1: Full eslint over the touched file types**

Run: `npx eslint store/music/actions.js locales/en.js locales/tr.js "components/Scene/MusicModeScene/**/*.vue" "components/Dialog/GuessTheSongStatsDialog/*.vue"`
Expected: no errors.

- [ ] **Step 2: Stylelint the touched SCSS**

Run: `npx stylelint "components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.scss"`
Expected: no errors.

- [ ] **Step 3: Confirm clean tree (except the pre-existing generated file)**

Run: `git status --porcelain`
Expected: empty, OR only ` M auto-imports.d.ts` (pre-existing CRLF churn — leave it; do NOT commit it).

- [ ] **Step 4: (Optional) Manual smoke check**

If a dev environment is available: `yarn dev`, open the Music Quiz route, confirm a Playlists section appears below Popular Artists (requires at least one published `music-playlist` in the Strapi admin). Click a playlist → it routes to the play screen with `?playlistId=` and the guess-the-song game plays the playlist's tracks; the results dialog shows the playlist name + cover. If no dev environment is available, rely on the lint gates and note it in the report.

---

## Self-Review (completed by plan author)

**Spec coverage:**
- Store actions `fetchPlaylists` + `fetchPlaylistSongs` (spec §1) → Task 1 ✓
- Playlists section below popular artists, fetch + cards + click→Play (spec §2) → Task 4 ✓
- Play scene `playlistId` branch, reuse `buildRounds([])`, playlist ref (spec §3) → Task 5 ✓
- Stats dialog `playlist` prop + context block + share text (spec §4) → Task 3 ✓
- i18n keys (spec §5) → Task 2 ✓ (note: `playlistsEmpty` intentionally dropped — section hides on empty, see decision note)
- Data flow + SEO playlist context → Task 5 (`contextLabel`) ✓
- Empty/error → section hidden (Task 4 `v-if="playlists.length"`); play errors handled by existing `fetchState`/empty templates ✓

**Type/name consistency:** `playlist` ref (`{ name, artworkUrl }` from `meta.playlist`) is produced in Task 5 and consumed by the Task 3 prop of the same name. `fetchPlaylists`/`fetchPlaylistSongs` action names match between Task 1 and their callers in Tasks 4/5. Store dispatch paths `music/fetchPlaylists` and `music/fetchPlaylistSongs` are consistent. `playlistId` query param name is consistent across scene (Task 4 push) and play scene (Task 5 read).

**Placeholder scan:** No TBD/TODO; every step shows exact code and exact find/replace anchors and commands.

**Adaptation note:** No test framework — the husky pre-commit hook (eslint + stylelint + prettier/CRLF via lint-staged) is the per-task gate; Task 6 is a full lint sweep. Matches repo conventions (no component tests exist).
