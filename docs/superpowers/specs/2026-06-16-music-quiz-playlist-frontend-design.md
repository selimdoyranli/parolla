# Music Quiz Playlist (Frontend) — Design Spec

**Date:** 2026-06-16
**Status:** Approved
**Scope:** parolla (Nuxt 2 / Vue 2 composition-api) — Music Quiz "Şarkıyı Tahmin Et" akışına playlist desteği
**Branch:** `feature/music-quiz-playlist`
**İlgili backend spec:** parolla-strapi `docs/superpowers/specs/2026-06-16-music-quiz-playlist-backend-design.md` (uygulandı)

## Problem

Music Quiz'in "Şarkıyı Tahmin Et" oyununda oyuncu, seçtiği sanatçıların şarkılarını tahmin ediyor. Music Quiz rotasında "Popüler Sanatçılar" alanı şu an hardcoded bir dizi. Bu alanın **altına**, admin tarafından Strapi panelinden yönetilen bir "Playlistler" alanı eklemek istiyoruz.

Oyuncu bir playliste tıklayınca mevcut Play (oyna) rotasına `playlistId` query param ile gidecek; o playlistteki şarkılar getirilip aynı "şarkıyı tahmin et" oyunu oynanacak. Tek fark: seçili sanatçılar yerine seçili playlist.

Backend tarafı tamamlandı ve şu kontratı sunuyor:
- `GET /api/modes/music/playlists` → `{ data: [{ playlistId, name, artworkUrl }], meta: { total } }`
- `GET /api/modes/music/songs?playlistId=pl.xxx&limit=100` → `{ data: [song...], error, meta: { playlistId, total, playlist: { name, artworkUrl } } }` — `song` şekli artist yoluyla aynı (`trackId, trackName, previewUrl, trackViewUrl, artistId, artistName, artworkUrl100`).

## Backend kontrat notları (frontend için kritik)

- Playlist şarkılarında `trackId` **string** (artist yolunda number) — client tarafında numeric varsayma; key/dedup için `trackName` veya string-coerce kullan.
- Playlist şarkılarında `artistId` **her zaman `null`**.
- Boş / preview'siz playlist → `data: []` + `error: "No playable tracks found for this playlist"` ama **HTTP 200**. Status koduna değil `error`/boş `data`'ya bakılmalı.
- Token scrape çökmesi → `/playlists` 4xx döner; "playlist'ler kullanılamıyor" durumu "hiç playlist yok" (`data: [], meta.total: 0`) durumundan ayrı ele alınmalı (liste bölümü hata durumunda gizlenir).

## Hedefler

1. Music Quiz scene'ine, popüler sanatçıların altına **Playlistler** bölümü (kapak + ad kartları), Strapi'den canlı çekilir.
2. Karta tıklayınca Play rotasına `playlistId` query param ile gidiş.
3. Play scene'i `playlistId` query param'ı varsa playlist şarkılarını backend'den çekip mevcut oyun mantığıyla oynatır.
4. Play/stats ekranında bağlam olarak **playlist adı + kapağı** gösterilir (seçili sanatçılar yerine).

## Hedef-dışı (YAGNI)

- Backend (tamamlandı).
- Skor sistemi değişikliği.
- Mevcut artist (seçili sanatçılar) akışının davranışı — **değişmez**.
- Playlist için yeni/ayrı round üretim mantığı — mevcut `buildRounds` yeniden kullanılır.
- Playlist arama/filtreleme, sayfalama, favoriler.

## Mimari kararlar

### 1. Store: `store/music/actions.js`

Mevcut `fetchArtists` / `fetchSongs` (iTunes, tarayıcı-doğrudan) **dokunulmaz**. İki yeni action eklenir; Strapi backend'i mevcut `this.$appFetch` ile çağrılır (diğer store modüllerindeki desen — `store/creator/actions.js` gibi):

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

async fetchPlaylistSongs(_, { playlistId }) {
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

> `$appFetch` `{ data, error }` döner; `data` = backend gövdesi (`{ data, meta }`). Bu yüzden şarkı/playlist dizisi `data.data`'dadır.

### 2. GuessTheSongScene (`components/Scene/MusicModeScene/GuessTheSongScene/`)

Popüler sanatçılar bölümünün **altına** "Playlistler" bölümü eklenir.

- Setup'ta `useFetch` ile `store.dispatch('music/fetchPlaylists')` çağrılır → `playlists` ref'ine yazılır. `playlistsFetchState` ile loading/error izlenir.
- Markup, mevcut `guess-the-song-scene-popular-artists` blokunun **birebir analoğu** (`guess-the-song-scene-playlists`): başlık + kart listesi. Her kart: kapak `img` (`playlist.artworkUrl`) veya fallback ikon + ad (`playlist.name`).
- Durumlar:
  - Loading → mevcut desen (vant `Empty`/spinner kullanılmıyorsa basit metin) — popüler sanatçılarda loading yok ama playlist async olduğu için bir loading + boş durum gerekir; mevcut `Empty` bileşeni kullanılır.
  - Boş (`playlists.length === 0` ve hata yok) → bölüm gizlenir (veya boş durum metni `musicMode.playlistsEmpty`).
  - Hata → bölüm gizlenir.
- Tıklama:
  ```js
  router.push(
    localePath({
      name: 'MusicMode-GuessTheSong-Play',
      query: { playlistId: playlist.playlistId }
    })
  )
  ```
- SCSS: popüler sanatçı kart stilleri yeniden kullanılır/uyarlanır (`GuessTheSongScene.component.scss`).

### 3. GuessTheSongPlayScene (`components/Scene/MusicModeScene/GuessTheSongPlayScene/`)

Query'ye göre dallanma; mevcut artist akışı korunur.

- `const playlistId = computed(() => route.value.query.playlistId)`.
- `const playlist = ref(null)` eklenir.
- `useFetch` içinde:
  ```js
  if (playlistId.value) {
    const { data, meta } = await store.dispatch('music/fetchPlaylistSongs', {
      playlistId: playlistId.value
    })
    playlist.value = meta?.playlist || null
    const previewable = Array.isArray(data) ? data.filter(song => !!song.previewUrl) : []
    songs.value = previewable
    rounds.value = buildRounds(songs.value, TOTAL_ROUNDS, []) // boş selectedIds → tek havuz
  } else {
    // mevcut artistIds akışı (değişmez)
  }
  // ortak reset (roundIndex, roundResults, vb.)
  ```
- **Round üretimi yeniden kullanılır:** `buildRounds(songs, 10, [])` boş `selectedIds` ile tüm playlisti tek havuz olarak alır (şarkılar `artistId: null`), 10 tur × 3 rastgele şıkkı üretir. Şıklar playlistin rastgele şarkılarıdır — "çalan şarkıyı 3 seçenek arasından bul" UX'i korunur. Yeni round mantığı yok.
- SEO meta (`useMeta`) ve stats dialog: playlist modunda playlist adı kullanılır; artist modunda mevcut `selectedArtists`. (SEO için mevcut `seo.musicMode.guessTheSongPlay.*` anahtarları `artists` parametresiyle çalışıyor; playlist modunda `artists` yerine playlist adı geçilir — anahtar yapısı korunur.)
- Stats dialog'a `:playlist="playlist"` prop'u geçilir.

### 4. GuessTheSongStatsDialog (`components/Dialog/GuessTheSongStatsDialog/`)

Opsiyonel `playlist` prop'u eklenir (`{ name, artworkUrl } | null`, default `null`).

- Template: `playlist` doluysa playlist bağlam bloğu (kapak `img` + ad) gösterilir; aksi halde mevcut `selectedArtists` bloğu (`v-if="selectedArtistsList.length"`). İki blok birbirini dışlar (playlist varsa artist bloğu render edilmez).
- Paylaşım (clipboard) metni: playlist modunda playlist adını, aksi halde mevcut sanatçı adlarını kullanır.

### 5. i18n: `locales/en.js` + `locales/tr.js`

`musicMode` altına eklenecek anahtarlar (her iki dilde):
- `playlists`: bölüm başlığı (en: "Playlists", tr: "Çalma listeleri")
- `playlistsEmpty`: boş/loading durum metni (en: "No playlists available", tr: "Çalma listesi yok")
- `guessTheSong.stats.playlist`: stats etiketi (en: "Playlist", tr: "Çalma listesi")

## Veri akışı

```
GuessTheSongScene
  → store music/fetchPlaylists → GET /api/modes/music/playlists
  → playlist kartları (kapak + ad)
  → karta tıkla → Play rotası ?playlistId=pl.xxx

GuessTheSongPlayScene (playlistId varsa)
  → store music/fetchPlaylistSongs → GET /api/modes/music/songs?playlistId=
  → previewable şarkılar → buildRounds(songs, 10, [])
  → oyun (mevcut audio/round/option mantığı)
  → stats dialog (playlist adı + kapak)
```

## Hata / boş durum

- **Playlist listesi:** loading + boş durum; hata (`error`) durumunda bölüm gizlenir (kullanıcıya "playlist'ler kullanılamıyor" sessizce gizlenerek, mevcut popüler sanatçılar akışını engellemez).
- **Play:** mevcut `fetchState.error` ve "quizPreparing" durumları kapsar. Backend boş playlist'te `error` string + `data: []` döndürür → `buildRounds` boş dönerse mevcut "pendingQuestions" boş durumu görünür; ayrıca `fetchState.error` mevcut hata template'i ile gösterilir.

## Etkilenen / yeni dosyalar

**Değişen:**
- `store/music/actions.js` — `fetchPlaylists` + `fetchPlaylistSongs` action'ları.
- `components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.vue` — Playlistler bölümü + fetch + tıklama.
- `components/Scene/MusicModeScene/GuessTheSongScene/GuessTheSongScene.component.scss` — playlist kart stilleri.
- `components/Scene/MusicModeScene/GuessTheSongPlayScene/GuessTheSongPlayScene.component.vue` — `playlistId` dalı + `playlist` ref + stats/SEO bağlamı.
- `components/Dialog/GuessTheSongStatsDialog/GuessTheSongStatsDialog.component.vue` — `playlist` prop'u + bağlam bloğu.
- `locales/en.js`, `locales/tr.js` — yeni i18n anahtarları.

**Yeni:** yok (mevcut bileşenler genişletilir).

## Doğrulama

Bu repoda test framework'ü yok. Doğrulama: `yarn lint:eslint`, `yarn lint:stylelint`, `yarn prettier` (ve mümkünse `yarn dev` ile manuel kontrol). Mevcut kod konvansiyonları korunur (no semicolons, single quotes, pug template, composition-api).

## Açık riskler

- `auto-imports.d.ts` çalışma alanında satır-sonu (LF/CRLF) gürültüsüyle "modified" görünebilir; bu dosya commit'lere **dahil edilmez**.
- Çok az previewable şarkısı olan playlist (<3) → `buildRounds` boş döner → oyun başlamaz; mevcut boş durum gösterilir (kabul).
