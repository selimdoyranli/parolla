# Profile Redesign — X-style Header + URL-bound Tabs

**Date:** 2026-05-19
**Scope:** parolla (Nuxt 2 / Vue 2 / Vant 2 frontend) — `pages/Profile`, related components, store, i18n route mapping.
**Out of scope:** Strapi backend schema/controller changes (none required); player dialog behavioural changes beyond extraction.

---

## 1. Motivation & Goals

The current profile page (`pages/Profile/index.vue` + `components/View/ProfileView`) is a vertical stack of three small blocks (avatar/join date, bio panel, tour-score table) and is reached via `/profil?username=X`. Two problems:

1. Discovery — a user's created quizzes, played-quiz scores, and authored reviews live in different places. There is no single hub.
2. URL semantics — query-param routing is unshareable-looking and inconsistent with the rest of the app (which uses pretty paths everywhere else).

This redesign restructures the page into an X (Twitter)-style profile with a banner-headed identity card and three URL-bound tabs:

- **Quizler** — quizzes the user created (default tab)
- **Değerlendirmeler** — reviews the user has written, replies-style
- **Skorlar** — tour-mode scores + recently-played-quiz scores

Routes become path-segment based: `/profil/<username>` and `/profil/<username>/{quizler|degerlendirmeler|skorlar}`.

---

## 2. Decisions (locked)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Banner image source | Gradient derived from the user's DiceBear `backgroundColor` config |
| 2 | ProfileEdit route collision | Move ProfileEdit to `/hesap/duzenle` (EN `/account/edit`) under a new `Account` scope |
| 3 | Old `/profil?username=X` URL | No redirect; serve 404 |
| 4 | EN locale tab paths | `/profile/<u>/quizzes`, `/reviews`, `/scores` |
| 5 | Reviews tab item layout | Replies-style — comment-first card; mini quiz reference below |
| 6 | Scores tab room-scores widget | Recently-played quizzes list |
| 7 | Self-view top-right action | "Profili düzenle" outline button → navigates to `/hesap/duzenle` |
| 8 | Header anatomy | X-style flat layout (no separate "Hakkımda" panel) |
| 9 | Tab counts | No count badges in tab labels |
| 10 | Tab page architecture | Nuxt nested children — parent shell `_username.vue` + `<nuxt-child/>` |

---

## 3. Routing

### 3.1 Files (English PascalCase, following existing pattern)

```
pages/
  Profile/
    _username.vue                       # parent shell — header + tab bar + <nuxt-child/>
    _username/
      index.vue                         # Quizler default (URL: /profil/:username)
      Quizzes/
        index.vue                       # URL: /profil/:username/quizler — same UI as index.vue
      Reviews/
        index.vue                       # URL: /profil/:username/degerlendirmeler
      Scores/
        index.vue                       # URL: /profil/:username/skorlar
  Account/
    AccountEdit/
      index.vue                         # moved from Profile/ProfileEdit/index.vue
      AccountEdit.page.scss             # moved from ProfileEdit.page.scss
```

**Deleted:**

```
pages/Profile/index.vue
pages/Profile/ProfileEdit/index.vue
pages/Profile/ProfileEdit/ProfileEdit.page.scss
```

### 3.2 nuxt-i18n `pages` mapping (`nuxt.config.js`)

Replace existing `Profile/index` and `Profile/ProfileEdit/index` entries with:

```js
'Profile/_username': {
  tr: '/profil/:username',
  en: '/profile/:username'
},
'Profile/_username/index': {
  tr: '/profil/:username',
  en: '/profile/:username'
},
'Profile/_username/Quizzes/index': {
  tr: '/profil/:username/quizler',
  en: '/profile/:username/quizzes'
},
'Profile/_username/Reviews/index': {
  tr: '/profil/:username/degerlendirmeler',
  en: '/profile/:username/reviews'
},
'Profile/_username/Scores/index': {
  tr: '/profil/:username/skorlar',
  en: '/profile/:username/scores'
},
'Account/AccountEdit/index': {
  tr: '/hesap/duzenle',
  en: '/account/edit'
}
```

The default `index.vue` and `Quizzes/index.vue` are two distinct routes that render the same UI by importing the same component (`ProfileQuizzesTab.component.vue`). After approval-tab click, URL canonicalises to `/profil/<u>/quizler`.

### 3.3 Callsite updates

Existing references to the old routes (found via grep):

| File | Change |
|------|--------|
| `components/Dialog/MenuDialog/MenuDialog.component.vue:270-277` | `name: 'Profile-ProfileEdit'` → `'Account-AccountEdit'`; `name: 'Profile'` + `query: { username }` → `'Profile-username'` + `params: { username }` |
| `pages/Profile/index.vue` | Deleted |
| `pages/Profile/ProfileEdit/index.vue` | Moved to `pages/Account/AccountEdit/index.vue` |

No other source files reference the old route names.

---

## 4. Components

### 4.1 Tree (new + changed)

```
components/
  View/
    ProfileView/
      ProfileView.component.vue           # REWRITTEN — new X-style shell (banner + identity + edit/report)
      ProfileView.component.scss
      ProfileTabBar.component.vue         # NEW — Vant-based URL-synced tab bar
      ProfileTabBar.component.scss
      PlayerProfileCard.component.vue     # NEW — extracted from OLD ProfileView; used in PlayerDialog only
      PlayerProfileCard.component.scss
      Tabs/
        ProfileQuizzesTab.component.vue   # NEW
        ProfileQuizzesTab.component.scss
        ProfileReviewsTab.component.vue   # NEW
        ProfileReviewsTab.component.scss
        ProfileScoresTab.component.vue    # NEW
        ProfileScoresTab.component.scss
functions/
  profileBanner.js                        # NEW — buildBannerStyle(diceBearConfig)
```

`components/Dialog/PlayerDialog/PlayerDialog.component.vue` updated to use `<PlayerProfileCard>` instead of `<ProfileView>` — the dialog continues to behave as a compact peek; the full new design only lives on the page route.

### 4.2 `_username.vue` (parent shell)

Responsibilities:

1. Read `route.params.username`.
2. On `useFetch`: dispatch `profile/fetchPlayer({ username })` and `tour/fetchTourScoreOfUser({ username })` in parallel.
3. Render `<ProfileView>` shell (header + identity + tab bar) and `<nuxt-child/>` for the active tab.
4. `provide()` `{ player, playerLoading, playerError, tourScore, tourScoreLoading, tourScoreError, username, refetch }` to child tab components.
5. On 404 / player not found: show full-page Empty state with "ana sayfaya dön" CTA (no nuxt-child).

### 4.3 `ProfileView.component.vue` (new shell)

Renders:

- **Banner band** — `<div :style="bannerStyle">` 160px mobile / 200px desktop, edge-to-edge, no border radius. `bannerStyle` from `buildBannerStyle(player.diceBear.config)`.
- **Avatar row** — `<PlayerAvatar :user="player">` overlapping banner by 56px, 4px solid `var(--color-surface-01)` ring, 50% radius. Right side: top-right action button.
- **Action button** — self-view: `<Button plain round size="small">Profili düzenle</Button>` linking to localized `Account-AccountEdit`. Other-view: existing flag/report icon button + `<ReportDialog>` (preserved from old ProfileView).
- **Fullname** — 22px / 700.
- **@username** — 14px / `var(--color-text-03)`.
- **Bio paragraph** — 15px / 1.45, multiline, only rendered when `player.bio` exists.
- **Meta row** — clock icon + Timeago "yaklaşık 1 yıl önce katıldı" (preserves existing `Timeago` integration).
- **GM badge** — preserved via `PlayerAvatar`'s existing crown-rendering for users with the GM role.
- **`<ProfileTabBar>`** — sticky just below header.

Loading state: skeleton placeholders for avatar, name lines, bio lines (use Vant `Skeleton` or hand-rolled).
Error state: `Empty` with retry button calling `refetch`.

### 4.4 `ProfileTabBar.component.vue`

Props:
- `username: string` (required)

Renders Vant `<van-tabs>`:

```pug
van-tabs(
  v-model="activeTabName"
  type="line"
  color="var(--color-brand-02)"
  line-width="32px"
  line-height="3px"
  background="transparent"
  title-active-color="var(--color-text-01)"
  title-inactive-color="var(--color-text-03)"
  @click-tab="onTabClick"
  sticky
  :offset-top="appHeaderHeight"
)
  van-tab(name="quizzes" :title="$t('profile.tabs.quizzes')")
  van-tab(name="reviews" :title="$t('profile.tabs.reviews')")
  van-tab(name="scores" :title="$t('profile.tabs.scores')")
```

Active tab derived from `$route.name`:

```js
const NAME_TO_TAB = {
  'Profile-username':         'quizzes',
  'Profile-username-Quizzes': 'quizzes',
  'Profile-username-Reviews': 'reviews',
  'Profile-username-Scores':  'scores'
}
const TAB_TO_ROUTE = {
  quizzes: 'Profile-username-Quizzes',
  reviews: 'Profile-username-Reviews',
  scores:  'Profile-username-Scores'
}
```

(Names are nuxt-i18n's auto-generated ones — actual generated forms must be verified at implementation; if i18n prefixes with locale code, `localePath({ name: ... })` is used.)

On click: `router.push(localePath({ name: TAB_TO_ROUTE[name], params: { username } }))`.

### 4.5 `ProfileQuizzesTab.component.vue`

Injects `{ username }`.

`useFetch` dispatches `creator/fetchRooms({ user: <player.id>, isVisible: true, page: 1, limit: 10 })`. Note: needs `player.id`, which the parent has — inject it too. Use existing `roomTransformer` output already in store.

Renders existing `<RoomList :items="rooms">` component (same as `pages/CreatorMode/CreatorModeRooms/index.vue`). Load-more or paginate using existing creator store pagination state — for the profile context, isolate by passing `page` locally and using `isLoadMore` semantics. To avoid contention with the global creator store (CreatorModeRooms also writes to it), this tab reads via a **local** ref array rather than the shared store getter, but still uses the same `fetchRooms` action and discards its commits by passing a flag. **Simpler alternative chosen:** introduce `creator/fetchRoomsScoped` (returns data without committing) OR keep using shared state because the user is unlikely to have both CreatorModeRooms and a profile tab open simultaneously in SPA navigation.

**Decision:** initial implementation reuses the shared store getter (`creator/rooms`); if collision with CreatorModeRooms surfaces during testing, refactor to a scoped action. Documented as a known follow-up.

Empty state: `Empty` with `description = $t('profile.tabs.quizzes.empty')`.
Error state: `Empty image="error"` + retry button.

### 4.6 `ProfileReviewsTab.component.vue`

Injects `{ username, playerId }`.

New store action: `creator/fetchReviewsByUser({ userId, page, limit })`. Endpoint:

```
GET /room-reviews
  ?filters[user][id][$eq]=<userId>
  &populate=room
  &populate=user
  &sort=createdAt:desc
  &pagination[page]=<page>&pagination[pageSize]=<limit>
```

Strapi's `room-review` collection already relates to both `user` and `room`. No backend change needed (verified by inspecting existing `room-reviews` endpoint usage in `store/creator/actions.js:374`).

Renders a list of "review cards" (Twitter Replies style). Each card:

```
┌─────────────────────────────────────────┐
│  ★★★★☆  ·  Mar 4                        │  ← rating + date
│                                          │
│  "Çok güzel bir quiz, kelimeler          │
│   öğreticiydi."                          │  ← review text
│                                          │
│  ┌─ small attached row ────────────────┐ │
│  │ 🎯  Günlük Sorular #1234            │ │  ← mini quiz reference (clickable)
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

The mini-row links to `CreatorMode-CreatorModeRoom-slug` with the room's slug.

Pagination: load-more button.
Empty state: "Henüz değerlendirme yapmamış."

### 4.7 `ProfileScoresTab.component.vue`

Injects `{ username, playerId, tourScore, tourScoreLoading, tourScoreError }`.

Two widgets stacked vertically:

#### Widget A — Tour-mode scores (existing data)

Reuses `<PlayerTourScoreTable :tourScore="tourScore">` exactly as the old design rendered it, wrapped in a card surface with title.

#### Widget B — Recently-played quiz scores (new)

New store action: `creator/fetchRoomScoresByUser({ userId, page, limit })`. Endpoint:

```
GET /room-scores
  ?filters[user][id][$eq]=<userId>
  &populate[room][populate]=*
  &sort=createdAt:desc
  &pagination[page]=<page>&pagination[pageSize]=<limit>
```

Strapi's `room-score` collection relates to `user` and `room` — confirmed via `src/api/room-score/` and existing scoreboard fetch at `store/creator/actions.js:455` (which filters by `room.roomId` instead — same endpoint, different filter).

Each row:

```
┌──────────────────────────────────────────────┐
│  Günlük Sorular #1234                        │  ← room title (link)
│  3 Mar · 7 doğru / 2 yanlış · 84 puan        │  ← createdAt + stats + composite score
│                                              │
│  Sıra: #142                                  │  ← rank in that room (if available in score record)
└──────────────────────────────────────────────┘
```

Composite score formula and rank derivation reuse `src/utils/scoring.utils.ts`'s output if the API returns it; otherwise display the raw `results.score`.

Pagination: load-more.
Empty state: "Henüz hiç quiz oynamamış."

### 4.8 `PlayerProfileCard.component.vue`

A near-verbatim copy of the **old** `ProfileView.component.vue` content (avatar, joined date, bio panel, tour score table). Purpose: keep `<PlayerDialog>` (the avatar-click peek) compact and visually unchanged. Props identical to old `ProfileView`: `player, playerLoading, playerError, tourScore, tourScoreLoading, tourScoreError`.

`PlayerDialog.component.vue` updates one import line:
- Before: `<ProfileView :player="..." />`
- After: `<PlayerProfileCard :player="..." />`

---

## 5. Banner gradient (`functions/profileBanner.js`)

```js
// Deterministic gradient style object from a user's DiceBear config.
// DiceBear avataaars-neutral stores `backgroundColor` as an array of hex strings (without #)
// and optionally `backgroundType` like ['gradientLinear'].
// We always render as a linear gradient; if only one color is present, we derive the second
// by hue-shifting. The angle is hashed from `seed` so the same user always gets the same banner.

const FALLBACK_PRIMARY = '64b5f6'

export function buildBannerStyle(diceBearConfig) {
  const cfg = diceBearConfig || {}
  const colors = (Array.isArray(cfg.backgroundColor) && cfg.backgroundColor.length)
    ? cfg.backgroundColor
    : [FALLBACK_PRIMARY]
  const a = '#' + stripHash(colors[0])
  const b = colors[1] ? '#' + stripHash(colors[1]) : shiftHue(a, 40)
  const angle = (hashCode(String(cfg.seed || colors[0])) % 360 + 360) % 360
  return { background: `linear-gradient(${angle}deg, ${a} 0%, ${b} 100%)` }
}

function stripHash(c) { return String(c).replace(/^#/, '') }
function hashCode(s) { let h = 0; for (const ch of s) h = ((h << 5) - h + ch.charCodeAt(0)) | 0; return h }
function shiftHue(hex, deg) {
  // hex→{r,g,b}→{h,s,l}, add deg mod 360, back to hex. Pure JS, no dependency.
  // Implemented inline at build time.
}
```

Full `shiftHue` helper implemented inline; no new dependency.

---

## 6. Store changes

### 6.1 `store/creator/actions.js` — additions

```js
async fetchReviewsByUser({ commit }, { userId, page = 1, limit = 10, isLoadMore = false }) {
  const { data, error } = await this.$appFetch({
    path: 'room-reviews',
    query: {
      'filters[user][id][$eq]': userId,
      'pagination[page]': page,
      'pagination[pageSize]': limit,
      'populate[room]': '*',
      'populate[user]': '*',
      sort: 'createdAt:desc'
    }
  })

  if (data) {
    if (isLoadMore) commit('PUSH_USER_REVIEWS', data.data)
    else            commit('SET_USER_REVIEWS', data.data)
    commit('SET_USER_REVIEWS_PAGINATION', data.meta.pagination)
  }
  return { data, error }
}

async fetchRoomScoresByUser({ commit }, { userId, page = 1, limit = 10, isLoadMore = false }) {
  const { data, error } = await this.$appFetch({
    path: 'room-scores',
    query: {
      'filters[user][id][$eq]': userId,
      'pagination[page]': page,
      'pagination[pageSize]': limit,
      'populate[room][populate]': '*',
      'populate[user]': '*',
      sort: 'createdAt:desc'
    }
  })

  if (data) {
    if (isLoadMore) commit('PUSH_USER_ROOM_SCORES', data.data)
    else            commit('SET_USER_ROOM_SCORES', data.data)
    commit('SET_USER_ROOM_SCORES_PAGINATION', data.meta.pagination)
  }
  return { data, error }
}
```

Matching state slots in `store/creator/state.js`:

```js
userReviews: [],
userReviewsPagination: { page: 1, pageCount: 1, pageSize: 10, total: 0 },
userRoomScores: [],
userRoomScoresPagination: { page: 1, pageCount: 1, pageSize: 10, total: 0 }
```

Matching mutations and getters added.

### 6.2 Profile store

No changes required. `store/profile/actions.js`'s existing `fetchPlayer({ username })` works as-is for the new param-based route.

---

## 7. i18n keys (new)

Added to `locales/tr-TR.json` (and `en.json`):

```json
{
  "profile": {
    "tabs": {
      "quizzes": { "label": "Quizler", "empty": "Henüz quiz oluşturmamış." },
      "reviews": { "label": "Değerlendirmeler", "empty": "Henüz değerlendirme yapmamış." },
      "scores":  { "label": "Skorlar", "empty": "Henüz hiç quiz oynamamış." }
    },
    "editButton": "Profili düzenle",
    "notFound": {
      "title": "Bu kullanıcı bulunamadı",
      "action": "Ana sayfaya dön"
    },
    "scores": {
      "tour": { "title": "Tur modu skorları" },
      "room": { "title": "Oynanan quiz skorları" }
    }
  },
  "account": {
    "edit": { "title": "Profili düzenle" }
  }
}
```

EN equivalents in `en.json`.

---

## 8. SCSS conventions

Each new component has a sibling `.component.scss` file with a single root class (`.profile-view`, `.profile-tab-bar`, `.profile-quizzes-tab`, etc.) and BEM modifiers. Theme variables already in the app (`--color-surface-01`, `--color-brand-02`, `--color-text-01/02/03`) are reused; no new variables introduced.

Banner is `border-radius: 0` (edge-to-edge inside the page container). Avatar rings the banner with `border: 4px solid var(--color-surface-01)`.

---

## 9. Error / loading / empty matrix

| Surface | Loading | Error | Empty |
|---------|---------|-------|-------|
| Header (player) | Skeleton (avatar circle, two text lines, bio block) | `Empty image="error"` + retry button (calls parent's `refetch`) | n/a — header always renders if player exists |
| Tour-score widget | Vant `Loading` (existing behaviour preserved) | `Empty` + retry | n/a (existing) |
| Quizler tab | Vant `Loading` | `Empty image="error"` + retry | `Empty` with i18n message |
| Reviews tab | Vant `Loading` | `Empty image="error"` + retry | `Empty` with i18n message |
| Scores room widget | Vant `Loading` | `Empty image="error"` + retry | `Empty` with i18n message |
| Player not found (404 from API) | n/a | Full-page `Empty` with "ana sayfaya dön" CTA | n/a |

---

## 10. Out-of-scope (deliberately deferred)

- Strapi backend schema changes (no `banner` field, no new collection).
- Tab counts / aggregated stats.
- Follow / follower counts (parolla has no follow graph).
- Player dialog (peek card) redesign — extracted, but visually unchanged.
- Old URL redirects.

---

## 11. Verification checklist

- `/profil/<existing-username>` opens default Quizler tab; URL stays as `/profil/<u>`.
- Clicking the Quizler tab navigates to `/profil/<u>/quizler`; same content.
- Direct hit of `/profil/<u>/degerlendirmeler` opens Reviews tab.
- Direct hit of `/profil/<u>/skorlar` opens Scores tab with both widgets.
- Visiting `/profil` (no username) or `/profil?username=X` → 404.
- Self-profile shows "Profili düzenle" button; other-profile shows the report flag icon (existing behaviour).
- Avatar click anywhere in app still opens `PlayerDialog` with the compact `PlayerProfileCard`.
- MenuDialog → "Profilim" navigates to `/profil/<me>`; "Profili düzenle" navigates to `/hesap/duzenle`.
- Old route names (`Profile`, `Profile-ProfileEdit`) produce no broken links anywhere in the codebase.
- TR and EN locale paths both work (`/profile/<u>/quizzes`, `/profile/<u>/reviews`, `/profile/<u>/scores`, `/account/edit`).
- Banner gradient is deterministic per user; reload returns same gradient.
- Lint (`yarn lint:eslint` + `yarn lint:stylelint`) passes.
- App builds (`yarn build`).
