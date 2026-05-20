# Profile Redesign — X-style Header + URL-bound Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/profil?username=X` with a path-segmented `/profil/<username>` profile page that has an X-style banner header (DiceBear-derived gradient + identity + edit/report) and three URL-bound tabs (Quizler / Değerlendirmeler / Skorlar). Move ProfileEdit to `/hesap/duzenle`.

**Architecture:** Nuxt 2 nested children. Parent shell `pages/Profile/_username.vue` renders the new `ProfileView` (header + `ProfileTabBar` + `<nuxt-child/>`); per-tab pages live under `_username/{Quizzes,Reviews,Scores}/index.vue` and the default-tab page at `_username/index.vue` shares the Quizzes UI component. The shell `provide()`s player + tour score to child tabs. New store actions are added to `creator/` for user-scoped reviews and room scores; no Strapi backend change required.

**Tech Stack:** Nuxt 2, Vue 2 + Composition API, Vant 2 (Tabs, Tab, Button, Empty, Loading, Skeleton, Cell), Pug, SCSS, Vuex, nuxt-i18n.

**Frontend repo:** `/Users/selim.doyranli/projects/selimdoyranli/github/parolla`

**Spec:** `docs/superpowers/specs/2026-05-19-profile-redesign-x-style-tabs-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `pages/Profile/index.vue` | Delete | Old query-param page removed |
| `pages/Profile/ProfileEdit/index.vue` | Delete | Moved to Account/AccountEdit |
| `pages/Profile/ProfileEdit/ProfileEdit.page.scss` | Delete | Moved to Account/AccountEdit |
| `pages/Account/AccountEdit/index.vue` | Create | Moved edit-profile page |
| `pages/Account/AccountEdit/AccountEdit.page.scss` | Create | Moved styles |
| `pages/Profile/_username.vue` | Create | Parent shell — header + tab bar + `<nuxt-child/>` |
| `pages/Profile/_username/index.vue` | Create | Default Quizler tab |
| `pages/Profile/_username/Quizzes/index.vue` | Create | `/profil/:u/quizler` — same UI as default |
| `pages/Profile/_username/Reviews/index.vue` | Create | `/profil/:u/degerlendirmeler` |
| `pages/Profile/_username/Scores/index.vue` | Create | `/profil/:u/skorlar` |
| `components/View/ProfileView/ProfileView.component.vue` | Rewrite | New X-style header shell |
| `components/View/ProfileView/ProfileView.component.scss` | Rewrite | New styles |
| `components/View/ProfileView/ProfileTabBar.component.vue` | Create | URL-bound van-tabs |
| `components/View/ProfileView/ProfileTabBar.component.scss` | Create | Tab bar styles |
| `components/View/ProfileView/PlayerProfileCard.component.vue` | Create | Compact peek (for PlayerDialog) — verbatim old ProfileView |
| `components/View/ProfileView/PlayerProfileCard.component.scss` | Create | Verbatim old ProfileView styles |
| `components/View/ProfileView/Tabs/ProfileQuizzesTab.component.vue` | Create | Quizler tab content |
| `components/View/ProfileView/Tabs/ProfileQuizzesTab.component.scss` | Create | |
| `components/View/ProfileView/Tabs/ProfileReviewsTab.component.vue` | Create | Reviews tab content |
| `components/View/ProfileView/Tabs/ProfileReviewsTab.component.scss` | Create | |
| `components/View/ProfileView/Tabs/ProfileScoresTab.component.vue` | Create | Scores tab content |
| `components/View/ProfileView/Tabs/ProfileScoresTab.component.scss` | Create | |
| `functions/profileBanner.js` | Create | `buildBannerStyle(diceBearConfig)` |
| `store/creator/state.js` | Modify | Add `userReviews`, `userReviewsPagination`, `userRoomScores`, `userRoomScoresPagination` |
| `store/creator/mutations.js` | Modify | Setters/pushers for new state slots |
| `store/creator/getters.js` | Modify | Getters for new slots |
| `store/creator/actions.js` | Modify | `fetchReviewsByUser`, `fetchRoomScoresByUser` |
| `components/Dialog/PlayerDialog/PlayerDialog.component.vue` | Modify | Swap `ProfileView` → `PlayerProfileCard` |
| `components/Dialog/MenuDialog/MenuDialog.component.vue` | Modify | Update route name calls |
| `nuxt.config.js` | Modify | i18n route mapping changes |
| `locales/tr.js` | Modify | New keys (profile tabs, edit button, not-found, scores) |
| `locales/en.js` | Modify | EN equivalents |

---

### Task 1: Move ProfileEdit → AccountEdit

This task only moves files and updates one route mapping; the page still works at a new URL. ProfileEdit's logic and UI are unchanged (verified by spec — no behavioural changes here).

**Files:**
- Create: `pages/Account/AccountEdit/index.vue`
- Create: `pages/Account/AccountEdit/AccountEdit.page.scss`
- Delete: `pages/Profile/ProfileEdit/index.vue`
- Delete: `pages/Profile/ProfileEdit/ProfileEdit.page.scss`
- Modify: `nuxt.config.js` (replace one entry)
- Modify: `components/Dialog/MenuDialog/MenuDialog.component.vue` (one call)

- [ ] **Step 1: Create directory**

```bash
mkdir -p /Users/selim.doyranli/projects/selimdoyranli/github/parolla/pages/Account/AccountEdit
```

- [ ] **Step 2: Write `pages/Account/AccountEdit/index.vue`**

```pug
<template lang="pug">
.page.account-edit-page
  template(v-if="fetchState.pending")
    Loading(color="var(--color-brand-02)")

  template(v-else-if="fetchState.error")
    Empty(image="error" :description="$t('error.anErrorOccurred')")
      Button(@click="reFetch") {{ $t('error.tryAgain') }}

  template(v-else)
    ProfileEditForm
</template>

<script>
import { defineComponent, useStore, useFetch, computed } from '@nuxtjs/composition-api'
import { Loading, Empty, Button } from 'vant'

export default defineComponent({
  components: {
    Loading,
    Empty,
    Button
  },
  layout: 'Default/Default.layout',
  middleware: ['auth-control'],
  setup() {
    const store = useStore()

    const me = computed(() => store.$auth?.user || null)

    const { fetch, fetchState } = useFetch(async () => {
      if (me.value?.username) {
        await store.dispatch('profile/fetchPlayer', { username: me.value.username })
      }
    })

    const reFetch = async () => {
      await fetch()
    }

    return {
      fetchState,
      reFetch
    }
  }
})
</script>

<style lang="scss" src="./AccountEdit.page.scss"></style>
```

> Behavioural delta vs old ProfileEdit: old code read `username` from `route.value.query.username`. The new edit URL has no `:username` segment — it's always the authed user's own profile, so we read from `$auth.user.username` directly. This matches MenuDialog's existing assumption (it was always passing `$auth.user.username` anyway).

- [ ] **Step 3: Write `pages/Account/AccountEdit/AccountEdit.page.scss`**

```scss
.account-edit-page {
  position: relative;

  .profile-edit-form {
    width: calc(100% - (var(--base-p-x) * 2));
    margin: calc(var(--base-m-y) * 2) auto;
    margin-bottom: 25vh;
    padding-bottom: calc(var(--base-m-y) * 4);
  }
}
```

- [ ] **Step 4: Delete old ProfileEdit files**

```bash
rm /Users/selim.doyranli/projects/selimdoyranli/github/parolla/pages/Profile/ProfileEdit/index.vue
rm /Users/selim.doyranli/projects/selimdoyranli/github/parolla/pages/Profile/ProfileEdit/ProfileEdit.page.scss
rmdir /Users/selim.doyranli/projects/selimdoyranli/github/parolla/pages/Profile/ProfileEdit
```

- [ ] **Step 5: Update `nuxt.config.js` i18n mapping**

Find:

```js
'Profile/ProfileEdit/index': {
  tr: '/profil/duzenle',
  en: '/profile/edit'
},
```

Replace with:

```js
'Account/AccountEdit/index': {
  tr: '/hesap/duzenle',
  en: '/account/edit'
},
```

- [ ] **Step 6: Update MenuDialog callsite**

In `components/Dialog/MenuDialog/MenuDialog.component.vue`, find:

```js
router.push(localePath({ name: 'Profile-ProfileEdit', query: { username: $auth.user.username } }))
```

Replace with:

```js
router.push(localePath({ name: 'Account-AccountEdit' }))
```

- [ ] **Step 7: Run dev server and verify**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla && yarn dev
```

Expected: build completes without route errors. Visiting `/hesap/duzenle` while logged in renders the edit form. Old `/profil/duzenle` returns 404.

- [ ] **Step 8: Commit**

```bash
git add pages/Account pages/Profile/ProfileEdit nuxt.config.js components/Dialog/MenuDialog/MenuDialog.component.vue
git commit -m "refactor(profile): move ProfileEdit to /hesap/duzenle under Account scope"
```

---

### Task 2: Add Profile dynamic-route stubs + remove old Profile/index + update i18n & MenuDialog

This task introduces the new path-segmented Profile routes as **placeholder pages** (real content lands in later tasks). Deleting `Profile/index.vue` and adding new routes happen in the same task so the i18n config and Nuxt's route table stay consistent.

**Files:**
- Delete: `pages/Profile/index.vue`
- Create: `pages/Profile/_username.vue`
- Create: `pages/Profile/_username/index.vue`
- Create: `pages/Profile/_username/Quizzes/index.vue`
- Create: `pages/Profile/_username/Reviews/index.vue`
- Create: `pages/Profile/_username/Scores/index.vue`
- Modify: `nuxt.config.js`
- Modify: `components/Dialog/MenuDialog/MenuDialog.component.vue`

- [ ] **Step 1: Delete old page**

```bash
rm /Users/selim.doyranli/projects/selimdoyranli/github/parolla/pages/Profile/index.vue
```

- [ ] **Step 2: Create stub parent shell `pages/Profile/_username.vue`**

```pug
<template lang="pug">
.page.profile-page
  .profile-page__stub Profile shell stub — {{ username }}
  nuxt-child
</template>

<script>
import { defineComponent, useRoute, computed } from '@nuxtjs/composition-api'

export default defineComponent({
  layout: 'Default/Default.layout',
  setup() {
    const route = useRoute()
    const username = computed(() => route.value.params.username)
    return { username }
  }
})
</script>
```

- [ ] **Step 3: Create stub child pages**

`pages/Profile/_username/index.vue`:

```pug
<template lang="pug">
.profile-tab-stub Quizzes (default) tab stub
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
export default defineComponent({})
</script>
```

`pages/Profile/_username/Quizzes/index.vue`:

```pug
<template lang="pug">
.profile-tab-stub Quizzes tab stub
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
export default defineComponent({})
</script>
```

`pages/Profile/_username/Reviews/index.vue`:

```pug
<template lang="pug">
.profile-tab-stub Reviews tab stub
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
export default defineComponent({})
</script>
```

`pages/Profile/_username/Scores/index.vue`:

```pug
<template lang="pug">
.profile-tab-stub Scores tab stub
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
export default defineComponent({})
</script>
```

- [ ] **Step 4: Update `nuxt.config.js` i18n mapping**

Find and **remove**:

```js
'Profile/index': {
  tr: '/profil',
  en: '/profile'
},
```

Add (right after the `Account/AccountEdit/index` entry from Task 1):

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
```

- [ ] **Step 5: Update MenuDialog `handleClickProfileView`**

In `components/Dialog/MenuDialog/MenuDialog.component.vue`, find:

```js
router.push(localePath({ name: 'Profile', query: { username: $auth.user.username } }))
```

Replace with:

```js
router.push(localePath({ name: 'Profile-username', params: { username: $auth.user.username } }))
```

- [ ] **Step 6: Verify dev server**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla && yarn dev
```

Expected: no compile errors. Visit `/profil/<known-username>` → "Profile shell stub — <username>" with "Quizzes (default) tab stub" below. `/profil/<u>/quizler`, `/degerlendirmeler`, `/skorlar` each render the right stub. `/profil` (no username) and `/profil?username=X` return 404. From MenuDialog → "Profili görüntüle" navigates to `/profil/<me>`.

- [ ] **Step 7: Commit**

```bash
git add pages/Profile nuxt.config.js components/Dialog/MenuDialog/MenuDialog.component.vue
git commit -m "feat(profile): scaffold /profil/<username> route + nested tab stubs"
```

---

### Task 3: i18n keys

Add the new TR + EN strings used by the rest of the implementation. These keys are placed in dedicated `profile.tabs`, `profile.scores`, `profile.editButton`, `profile.notFound`, and `account.edit` sections.

**Files:**
- Modify: `locales/tr.js`
- Modify: `locales/en.js`

- [ ] **Step 1: Find a place in `locales/tr.js`**

Search for the existing `profileEdit:` block (around line 799 in tr.js). The new `profile` namespace block goes **above** existing top-level entries; add it alongside other top-level keys.

- [ ] **Step 2: Add TR keys to `locales/tr.js`**

Add as a new top-level key (sibling to `app`, `general`, `dialog`, etc.):

```js
  profile: {
    tabs: {
      quizzes: 'Quizler',
      reviews: 'Değerlendirmeler',
      scores: 'Skorlar'
    },
    editButton: 'Profili düzenle',
    notFound: {
      title: 'Bu kullanıcı bulunamadı',
      action: 'Ana sayfaya dön'
    },
    quizzesTab: {
      empty: 'Henüz quiz oluşturmamış.',
      error: 'Quizler yüklenemedi.'
    },
    reviewsTab: {
      empty: 'Henüz değerlendirme yapmamış.',
      error: 'Değerlendirmeler yüklenemedi.'
    },
    scoresTab: {
      tour: { title: 'Tur modu skorları' },
      room: {
        title: 'Oynanan quiz skorları',
        empty: 'Henüz hiç quiz oynamamış.',
        error: 'Skorlar yüklenemedi.',
        statsLine: '{correct} doğru · {wrong} yanlış · {score} puan'
      }
    }
  },
  account: {
    edit: { title: 'Profili düzenle' }
  },
```

- [ ] **Step 3: Add EN keys to `locales/en.js`**

```js
  profile: {
    tabs: {
      quizzes: 'Quizzes',
      reviews: 'Reviews',
      scores: 'Scores'
    },
    editButton: 'Edit profile',
    notFound: {
      title: 'User not found',
      action: 'Back to home'
    },
    quizzesTab: {
      empty: 'No quizzes created yet.',
      error: 'Could not load quizzes.'
    },
    reviewsTab: {
      empty: 'No reviews written yet.',
      error: 'Could not load reviews.'
    },
    scoresTab: {
      tour: { title: 'Tour mode scores' },
      room: {
        title: 'Played quiz scores',
        empty: 'No quizzes played yet.',
        error: 'Could not load scores.',
        statsLine: '{correct} correct · {wrong} wrong · {score} points'
      }
    }
  },
  account: {
    edit: { title: 'Edit profile' }
  },
```

- [ ] **Step 4: Verify both locales lint**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla && yarn lint:eslint
```

Expected: pass (or unchanged warning count).

- [ ] **Step 5: Commit**

```bash
git add locales/tr.js locales/en.js
git commit -m "i18n(profile): add tab labels, edit button, empty/error states"
```

---

### Task 4: Banner gradient helper

Pure JS utility. No tests required (no test infra in repo); verified by direct usage in Task 6.

**Files:**
- Create: `functions/profileBanner.js`

- [ ] **Step 1: Write the helper**

```js
const FALLBACK_PRIMARY = '64b5f6'

export function buildBannerStyle(diceBearConfig) {
  const cfg = diceBearConfig || {}
  const colors = Array.isArray(cfg.backgroundColor) && cfg.backgroundColor.length
    ? cfg.backgroundColor
    : [FALLBACK_PRIMARY]

  const a = normalizeHex(colors[0]) || ('#' + FALLBACK_PRIMARY)
  const b = colors[1] ? normalizeHex(colors[1]) : shiftHue(a, 40)
  const angle = computeAngle(cfg.seed || colors[0])

  return { background: `linear-gradient(${angle}deg, ${a} 0%, ${b} 100%)` }
}

function normalizeHex(value) {
  if (!value || typeof value !== 'string') return null
  const stripped = value.replace(/^#/, '')
  if (!/^[0-9a-fA-F]{3,8}$/.test(stripped)) return null
  return '#' + stripped
}

function computeAngle(seed) {
  const s = String(seed || '')
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return ((h % 360) + 360) % 360
}

function shiftHue(hex, deg) {
  const { r, g, b } = hexToRgb(hex)
  const { h, s, l } = rgbToHsl(r, g, b)
  const nh = (h + deg / 360 + 1) % 1
  const { r: nr, g: ng, b: nb } = hslToRgb(nh, s, l)
  return rgbToHex(nr, ng, nb)
}

function hexToRgb(hex) {
  const s = hex.replace(/^#/, '')
  const v = s.length === 3 ? s.split('').map(c => c + c).join('') : s.slice(0, 6)
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16)
  }
}

function rgbToHex(r, g, b) {
  const c = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return '#' + c(r) + c(g) + c(b)
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h, s, l }
}

function hslToRgb(h, s, l) {
  if (s === 0) return { r: l * 255, g: l * 255, b: l * 255 }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return {
    r: hue2rgb(p, q, h + 1 / 3) * 255,
    g: hue2rgb(p, q, h) * 255,
    b: hue2rgb(p, q, h - 1 / 3) * 255
  }
}
```

- [ ] **Step 2: Lint**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla && yarn lint:eslint --max-warnings=0 functions/profileBanner.js
```

Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add functions/profileBanner.js
git commit -m "feat(profile): add deterministic banner gradient helper from DiceBear config"
```

---

### Task 5: Extract PlayerProfileCard from old ProfileView; swap into PlayerDialog

The current `ProfileView` is used both as the standalone profile page content and as the body of `<PlayerDialog>` (the avatar-click peek). We need to preserve the peek's appearance while rewriting `ProfileView`. Solution: copy the entire current `ProfileView` into a new `PlayerProfileCard` component (identical behaviour) and rewire `PlayerDialog` to use it.

**Files:**
- Create: `components/View/ProfileView/PlayerProfileCard.component.vue`
- Create: `components/View/ProfileView/PlayerProfileCard.component.scss`
- Modify: `components/Dialog/PlayerDialog/PlayerDialog.component.vue`

- [ ] **Step 1: Create `PlayerProfileCard.component.vue` as a verbatim copy of current ProfileView**

Copy the **current** contents of `components/View/ProfileView/ProfileView.component.vue` into `PlayerProfileCard.component.vue`, changing only:
1. Root template class `profile-view` → `player-profile-card`.
2. The `<style lang="scss" src="./ProfileView.component.scss">` → `<style lang="scss" src="./PlayerProfileCard.component.scss">`.
3. All `profile-view-*` BEM class names inside the template → `player-profile-card-*`.

Resulting file:

```pug
<template lang="pug">
.player-profile-card
  Button.player-profile-card-report-btn(v-if="player" type="default" auth-control round size="small" @click="isOpenReportDialog = true")
    AppIcon(name="tabler:flag" color="var(--color-text-03)" :width="18" :height="18")

  MountingPortal(mount-to="body" append)
    ReportDialog(
      :is-open="isOpenReportDialog"
      :scope="reportTypeEnum.PROFILE"
      :additional="reportAdditional"
      @closed="isOpenReportDialog = false"
    )

  .player-profile-card-player
    template(v-if="playerLoading")
      Loading(color="var(--color-brand-02)") {{ $t('dialog.player.loading') }}

    template(v-else-if="playerError")
      Empty(image="error" :description="$t('dialog.player.callback.error.title')")
        Button(@click="$emit('player-error-click')") {{ $t('dialog.player.callback.error.action') }}

    template(v-else)
      PlayerAvatar.player-profile-card__avatar(with-username :user="player")

      .player-profile-card-created-at
        AppIcon.player-profile-card-created-at__icon(name="tabler:clock" color="var(--color-text-03)" :width="16" :height="16")
        Timeago.player-profile-card-created-at__value(:datetime="player.createdAt" :auto-update="60" :locale="$i18n.locale")
        label.player-profile-card-created-at__label &nbsp;{{ $t('general.joined').toLowerCase() }}

      .player-profile-card-info
        span.player-profile-card-info__title {{ $t('dialog.player.myBio') }}
        .player-profile-card-info__separator
        span(v-if="!player.fullname && !player.bio") -
        span.player-profile-card-info__fullname(v-if="player.fullname") {{ player.fullname }}
        p.player-profile-card-info__bio(v-if="player.bio") {{ player.bio }}

  .player-profile-card-tour-score
    template(v-if="tourScoreLoading")
      Loading(color="var(--color-brand-02)") {{ $t('dialog.player.tourScore.loading') }}

    template(v-else-if="tourScoreError")
      Empty(image="error" :description="$t('dialog.player.tourScore.callback.error.title')")
        Button(@click="$emit('tour-score-error-click')") {{ $t('dialog.player.tourScore.callback.error.action') }}

    template(v-else)
      strong.player-profile-card-tour-score__title {{ $t('dialog.player.tourScore.title') }}
      PlayerTourScoreTable.player-profile-card-tour-score__table(:tourScore="tourScore")
</template>

<script>
import { defineComponent, computed, ref } from '@nuxtjs/composition-api'
import { Loading, Empty, Button } from 'vant'
import { reportTypeEnum } from '@/enums/report-type.enum'

export default defineComponent({
  components: {
    Loading,
    Empty,
    Button
  },
  props: {
    player: {
      type: Object,
      required: false,
      default: null
    },
    playerLoading: {
      type: Boolean,
      required: false,
      default: false
    },
    playerError: {
      type: Boolean,
      required: false,
      default: false
    },
    tourScore: {
      type: Object,
      required: false,
      default: null
    },
    tourScoreLoading: {
      type: Boolean,
      required: false,
      default: false
    },
    tourScoreError: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  setup(props) {
    const isOpenReportDialog = ref(false)

    const reportAdditional = computed(() => {
      if (!props.player) return null

      return JSON.stringify({
        reportedUser: {
          id: props.player.id,
          username: props.player.username,
          bio: props.player.bio || '',
          diceBear: props.player.diceBear
        }
      })
    })

    return {
      reportTypeEnum,
      isOpenReportDialog,
      reportAdditional
    }
  }
})
</script>

<style lang="scss" src="./PlayerProfileCard.component.scss"></style>
```

- [ ] **Step 2: Create `PlayerProfileCard.component.scss` as a verbatim copy of current ProfileView.component.scss**

Copy the file contents and rename root selector `.profile-view` → `.player-profile-card` and all `profile-view-*` references → `player-profile-card-*` consistently. The styles otherwise unchanged.

Run:

```bash
cp /Users/selim.doyranli/projects/selimdoyranli/github/parolla/components/View/ProfileView/ProfileView.component.scss /Users/selim.doyranli/projects/selimdoyranli/github/parolla/components/View/ProfileView/PlayerProfileCard.component.scss
```

Then in `PlayerProfileCard.component.scss`, find/replace `profile-view` → `player-profile-card` (entire file).

- [ ] **Step 3: Update `components/Dialog/PlayerDialog/PlayerDialog.component.vue`**

Find the `ProfileView` usage (~line 13):

```pug
ProfileView(
```

Replace with:

```pug
PlayerProfileCard(
```

Also update the script-side import if PlayerDialog explicitly imports ProfileView. Search the file:

```bash
grep -n "ProfileView" /Users/selim.doyranli/projects/selimdoyranli/github/parolla/components/Dialog/PlayerDialog/PlayerDialog.component.vue
```

If it imports `ProfileView` from `@/components/View/ProfileView/ProfileView.component.vue`, swap to `PlayerProfileCard` from the new path. If it relies on Nuxt auto-registration (no explicit import), no script change required — the component prefix matches the file name.

- [ ] **Step 4: Verify dev server + manually click an avatar to open PlayerDialog**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla && yarn dev
```

Expected: clicking any user avatar opens the PlayerDialog showing the same compact peek (avatar, joined date, bio panel, tour score table) — visually identical to before.

- [ ] **Step 5: Commit**

```bash
git add components/View/ProfileView/PlayerProfileCard.component.vue components/View/ProfileView/PlayerProfileCard.component.scss components/Dialog/PlayerDialog/PlayerDialog.component.vue
git commit -m "refactor(profile): extract PlayerProfileCard for PlayerDialog peek"
```

---

### Task 6: Rewrite `ProfileView` as new X-style header shell

`ProfileView` is repurposed: it no longer renders the dialog-style peek (that's now `PlayerProfileCard`). Instead it becomes the page header for the profile shell — banner, avatar, name, handle, bio, meta row, plus self/other action button. It receives the player data via props (no fetching).

**Files:**
- Rewrite: `components/View/ProfileView/ProfileView.component.vue`
- Rewrite: `components/View/ProfileView/ProfileView.component.scss`

- [ ] **Step 1: Replace `ProfileView.component.vue`**

```pug
<template lang="pug">
.profile-view
  template(v-if="playerLoading")
    .profile-view-skeleton
      .profile-view-skeleton__banner
      .profile-view-skeleton__avatar
      Skeleton(:row="3" row-width="60%")

  template(v-else-if="playerError || !player")
    .profile-view-error
      Empty(image="error" :description="$t('dialog.player.callback.error.title')")
        Button(@click="$emit('player-error-click')") {{ $t('dialog.player.callback.error.action') }}

  template(v-else)
    .profile-view-banner(:style="bannerStyle")

    MountingPortal(mount-to="body" append)
      ReportDialog(
        :is-open="isOpenReportDialog"
        :scope="reportTypeEnum.PROFILE"
        :additional="reportAdditional"
        @closed="isOpenReportDialog = false"
      )

    .profile-view-header
      .profile-view-header__avatar-wrap
        PlayerAvatar.profile-view-header__avatar(:user="player" :size="96")

      .profile-view-header__action
        Button.profile-view-header__edit-btn(
          v-if="isSelf"
          plain
          round
          size="small"
          @click="goToEdit"
        ) {{ $t('profile.editButton') }}

        Button.profile-view-header__report-btn(
          v-else
          type="default"
          auth-control
          round
          size="small"
          @click="isOpenReportDialog = true"
        )
          AppIcon(name="tabler:flag" color="var(--color-text-03)" :width="18" :height="18")

    .profile-view-identity
      h1.profile-view-identity__name {{ player.fullname || player.username }}
      span.profile-view-identity__handle @{{ player.username }}

      p.profile-view-identity__bio(v-if="player.bio") {{ player.bio }}

      .profile-view-identity__meta
        AppIcon.profile-view-identity__meta-icon(name="tabler:clock" color="var(--color-text-03)" :width="14" :height="14")
        Timeago.profile-view-identity__meta-value(:datetime="player.createdAt" :auto-update="60" :locale="$i18n.locale")
        label.profile-view-identity__meta-label &nbsp;{{ $t('general.joined').toLowerCase() }}
</template>

<script>
import { defineComponent, computed, ref, useStore, useContext, useRouter } from '@nuxtjs/composition-api'
import { Empty, Button, Skeleton } from 'vant'
import { buildBannerStyle } from '@/functions/profileBanner'
import { reportTypeEnum } from '@/enums/report-type.enum'

export default defineComponent({
  components: {
    Empty,
    Button,
    Skeleton
  },
  props: {
    player: {
      type: Object,
      required: false,
      default: null
    },
    playerLoading: {
      type: Boolean,
      required: false,
      default: false
    },
    playerError: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  setup(props) {
    const store = useStore()
    const { localePath } = useContext()
    const router = useRouter()
    const isOpenReportDialog = ref(false)

    const me = computed(() => store.$auth?.user || null)
    const isSelf = computed(() => me.value && props.player && me.value.username === props.player.username)

    const bannerStyle = computed(() => buildBannerStyle(props.player?.diceBear?.config))

    const reportAdditional = computed(() => {
      if (!props.player) return null

      return JSON.stringify({
        reportedUser: {
          id: props.player.id,
          username: props.player.username,
          bio: props.player.bio || '',
          diceBear: props.player.diceBear
        }
      })
    })

    const goToEdit = () => {
      router.push(localePath({ name: 'Account-AccountEdit' }))
    }

    return {
      isOpenReportDialog,
      reportTypeEnum,
      reportAdditional,
      isSelf,
      bannerStyle,
      goToEdit
    }
  }
})
</script>

<style lang="scss" src="./ProfileView.component.scss"></style>
```

- [ ] **Step 2: Replace `ProfileView.component.scss`**

```scss
.profile-view {
  position: relative;
  width: 100%;

  &-banner {
    position: relative;
    width: 100%;
    height: 160px;

    @media (min-width: 768px) {
      height: 200px;
    }
  }

  &-header {
    position: relative;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 0 var(--base-p-x);
    margin-top: -56px;

    &__avatar-wrap {
      display: inline-flex;
      padding: 4px;
      background: var(--color-surface-01);
      border-radius: 50%;
    }

    &__avatar {
      display: block;
    }

    &__action {
      margin-top: 64px;
    }

    &__edit-btn {
      background: var(--color-surface-01);
    }
  }

  &-identity {
    padding: 12px var(--base-p-x) 16px;

    &__name {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      line-height: 1.2;
      color: var(--color-text-01);
    }

    &__handle {
      display: block;
      margin-top: 2px;
      font-size: 14px;
      color: var(--color-text-03);
    }

    &__bio {
      margin: 12px 0 0;
      font-size: 15px;
      line-height: 1.45;
      color: var(--color-text-01);
      white-space: pre-wrap;
    }

    &__meta {
      display: flex;
      align-items: center;
      margin-top: 10px;
      color: var(--color-text-03);
      font-size: 13px;

      &-icon {
        margin-right: 6px;
      }

      &-label {
        color: var(--color-text-03);
      }
    }
  }

  &-skeleton {
    &__banner {
      width: 100%;
      height: 160px;
      background: var(--color-surface-02);
    }

    &__avatar {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: var(--color-surface-02);
      margin: -48px 0 12px var(--base-p-x);
    }
  }

  &-error {
    padding: 24px;
  }
}
</style>
```

(Remove the closing `</style>` line that came from copy-paste — the file is a `.scss` file; it should end after the last `}`.)

- [ ] **Step 3: Lint**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla && yarn lint:eslint components/View/ProfileView/ProfileView.component.vue && yarn lint:stylelint components/View/ProfileView/ProfileView.component.scss
```

Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add components/View/ProfileView/ProfileView.component.vue components/View/ProfileView/ProfileView.component.scss
git commit -m "feat(profile): rewrite ProfileView as X-style header shell"
```

---

### Task 7: ProfileTabBar component

A thin wrapper around Vant `<Tabs>` that maps `$route.name` to active tab and pushes the localised route on tab click.

**Files:**
- Create: `components/View/ProfileView/ProfileTabBar.component.vue`
- Create: `components/View/ProfileView/ProfileTabBar.component.scss`

- [ ] **Step 1: Write `ProfileTabBar.component.vue`**

```pug
<template lang="pug">
.profile-tab-bar
  Tabs.profile-tab-bar__tabs(
    :value="activeTabName"
    type="line"
    color="var(--color-brand-02)"
    line-width="32px"
    line-height="3px"
    background="transparent"
    title-active-color="var(--color-text-01)"
    title-inactive-color="var(--color-text-03)"
    :before-change="handleBeforeChange"
  )
    Tab(name="quizzes" :title="$t('profile.tabs.quizzes')")
    Tab(name="reviews" :title="$t('profile.tabs.reviews')")
    Tab(name="scores" :title="$t('profile.tabs.scores')")
</template>

<script>
import { defineComponent, computed, useRoute, useRouter, useContext } from '@nuxtjs/composition-api'
import { Tabs, Tab } from 'vant'

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

export default defineComponent({
  components: {
    Tabs,
    Tab
  },
  props: {
    username: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const route = useRoute()
    const router = useRouter()
    const { localePath } = useContext()

    const activeTabName = computed(() => {
      const baseName = stripLocaleSuffix(route.value.name || '')
      return NAME_TO_TAB[baseName] || 'quizzes'
    })

    const handleBeforeChange = name => {
      const target = TAB_TO_ROUTE[name]
      if (!target) return true
      router.push(localePath({ name: target, params: { username: props.username } }))
      return true
    }

    return {
      activeTabName,
      handleBeforeChange
    }
  }
})

function stripLocaleSuffix(name) {
  return name.replace(/___(tr|en)$/, '')
}
</script>

<style lang="scss" src="./ProfileTabBar.component.scss"></style>
```

> nuxt-i18n appends a locale suffix like `___tr` or `___en` to generated route names. The `stripLocaleSuffix` helper strips it so the map lookup works.

- [ ] **Step 2: Write `ProfileTabBar.component.scss`**

```scss
.profile-tab-bar {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--color-surface-01);
  border-bottom: 1px solid var(--color-border-01);

  &__tabs {
    background: transparent;
  }

  ::v-deep .van-tabs__wrap {
    background: transparent;
  }

  ::v-deep .van-tabs__line {
    border-radius: 2px;
  }

  ::v-deep .van-tab {
    font-size: 14px;
    font-weight: 600;
    padding: 0 16px;

    &--active {
      color: var(--color-text-01);
    }
  }
}
```

- [ ] **Step 3: Lint**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla && yarn lint:eslint components/View/ProfileView/ProfileTabBar.component.vue && yarn lint:stylelint components/View/ProfileView/ProfileTabBar.component.scss
```

Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add components/View/ProfileView/ProfileTabBar.component.vue components/View/ProfileView/ProfileTabBar.component.scss
git commit -m "feat(profile): add ProfileTabBar with URL-bound active tab"
```

---

### Task 8: Wire `pages/Profile/_username.vue` parent shell

Replace the stub from Task 2 with the real parent shell: fetch player + tour-score on enter, provide them to child tabs, render `ProfileView` + `ProfileTabBar` + `<nuxt-child/>`.

**Files:**
- Modify: `pages/Profile/_username.vue`

- [ ] **Step 1: Replace file contents**

```pug
<template lang="pug">
.page.profile-page
  template(v-if="!playerLoading && playerError")
    .profile-page__not-found
      Empty(:description="$t('profile.notFound.title')")
        Button(@click="goHome") {{ $t('profile.notFound.action') }}

  template(v-else)
    ProfileView(
      :player="player"
      :player-loading="playerLoading"
      :player-error="!!playerError"
      @player-error-click="refetch"
    )

    ProfileTabBar(:username="username")

    nuxt-child(:key="$route.fullPath")
</template>

<script>
import { defineComponent, useRoute, useStore, useFetch, useRouter, useContext, computed, ref, provide } from '@nuxtjs/composition-api'
import { Empty, Button } from 'vant'

export default defineComponent({
  components: {
    Empty,
    Button
  },
  layout: 'Default/Default.layout',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    const { localePath } = useContext()

    const username = computed(() => route.value.params.username)

    const playerLoading = ref(false)
    const playerError = ref(null)
    const tourScoreLoading = ref(false)
    const tourScoreError = ref(null)

    const { fetch, fetchState } = useFetch(async () => {
      playerLoading.value = true
      playerError.value = null
      tourScoreLoading.value = true
      tourScoreError.value = null

      const [{ error: pErr }, { error: tErr }] = await Promise.all([
        store.dispatch('profile/fetchPlayer', { username: username.value }),
        store.dispatch('tour/fetchTourScoreOfUser', { username: username.value })
      ])

      if (pErr) playerError.value = pErr
      if (tErr) tourScoreError.value = tErr

      playerLoading.value = false
      tourScoreLoading.value = false
    })

    const player = computed(() => store.getters['profile/player'])
    const tourScore = computed(() => store.getters['tour/tourScoreOfUser'])

    const refetch = () => fetch()

    const goHome = () => {
      router.push(localePath({ name: 'index' }))
    }

    provide('profileShell', {
      username,
      player,
      playerLoading,
      playerError,
      tourScore,
      tourScoreLoading,
      tourScoreError,
      refetch
    })

    return {
      username,
      player,
      playerLoading,
      playerError,
      fetchState,
      refetch,
      goHome
    }
  }
})
</script>

<style lang="scss" src="./_username.page.scss"></style>
```

- [ ] **Step 2: Create `pages/Profile/_username.page.scss`**

```scss
.profile-page {
  position: relative;
  min-height: 100vh;

  &__not-found {
    padding: 48px 24px;
  }
}
```

- [ ] **Step 3: Verify dev server**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla && yarn dev
```

Expected: visiting `/profil/<known-username>` shows full X-style header (banner gradient, avatar, name, handle, bio if any, joined-time meta), tab bar with three tabs (Quizler underlined). The active tab still shows the stub from Task 2. Clicking tabs updates URL to `/profil/<u>/quizler|degerlendirmeler|skorlar`. Self-profile shows "Profili düzenle"; other-profile shows the report flag icon. Unknown username shows "Bu kullanıcı bulunamadı" with "Ana sayfaya dön" button.

- [ ] **Step 4: Commit**

```bash
git add pages/Profile/_username.vue pages/Profile/_username.page.scss
git commit -m "feat(profile): wire parent shell with header + tab bar + nuxt-child"
```

---

### Task 9: ProfileQuizzesTab + wire both `index.vue` and `Quizzes/index.vue`

Both the default route (`/profil/:u`) and the explicit Quizler route (`/profil/:u/quizler`) render the same UI. Implementation: one shared `ProfileQuizzesTab.component.vue` imported by both pages.

**Files:**
- Create: `components/View/ProfileView/Tabs/ProfileQuizzesTab.component.vue`
- Create: `components/View/ProfileView/Tabs/ProfileQuizzesTab.component.scss`
- Modify: `pages/Profile/_username/index.vue`
- Modify: `pages/Profile/_username/Quizzes/index.vue`

- [ ] **Step 1: Write `ProfileQuizzesTab.component.vue`**

```pug
<template lang="pug">
.profile-quizzes-tab
  template(v-if="loading")
    .profile-quizzes-tab__state
      Loading(color="var(--color-brand-02)")

  template(v-else-if="error")
    Empty(image="error" :description="$t('profile.quizzesTab.error')")
      Button(@click="reload") {{ $t('error.tryAgain') }}

  template(v-else-if="rooms.length === 0")
    Empty(:description="$t('profile.quizzesTab.empty')")

  template(v-else)
    List
      template(v-for="room in rooms")
        NuxtLink(
          :key="room.roomId"
          :to="localePath({ name: 'CreatorMode-CreatorModeRoom-slug', params: { slug: room.roomId } })"
          :title="room.title"
        )
          Cell.profile-quizzes-tab__cell(is-link)
            template(#title) {{ room.title }}
            template(#label)
              span.profile-quizzes-tab__cell-label {{ formatViewCount(room.viewCount) }}

    Button.profile-quizzes-tab__more(
      v-if="pagination.page < pagination.pageCount"
      plain
      round
      size="small"
      :loading="loadingMore"
      @click="loadMore"
    ) {{ $t('general.loadMore') }}
</template>

<script>
import { defineComponent, inject, ref, computed, watch, useStore, useContext } from '@nuxtjs/composition-api'
import { Loading, Empty, Button, List, Cell } from 'vant'

const PAGE_SIZE = 10

export default defineComponent({
  components: {
    Loading,
    Empty,
    Button,
    List,
    Cell
  },
  setup() {
    const shell = inject('profileShell')
    const store = useStore()
    const { localePath, i18n } = useContext()

    const rooms = computed(() => store.getters['creator/rooms'] || [])
    const pagination = computed(() => store.getters['creator/pagination'] || { page: 1, pageCount: 1, pageSize: PAGE_SIZE, total: 0 })
    const loading = ref(false)
    const loadingMore = ref(false)
    const error = ref(null)

    const playerId = computed(() => shell?.player?.value?.id || null)

    const load = async (page = 1, isLoadMore = false) => {
      if (!playerId.value) return
      if (isLoadMore) loadingMore.value = true
      else loading.value = true
      error.value = null

      const { error: err } = await store.dispatch('creator/fetchRooms', {
        user: playerId.value,
        page,
        limit: PAGE_SIZE,
        isLoadMore,
        locale: i18n.locale
      })

      if (err) error.value = err

      loading.value = false
      loadingMore.value = false
    }

    watch(playerId, (id, prev) => {
      if (id && id !== prev) load(1, false)
    }, { immediate: true })

    const loadMore = () => load(pagination.value.page + 1, true)
    const reload = () => load(1, false)

    const formatViewCount = n => {
      if (n == null) return ''
      return `👁 ${n}`
    }

    return {
      rooms,
      pagination,
      loading,
      loadingMore,
      error,
      loadMore,
      reload,
      localePath,
      formatViewCount
    }
  }
})
</script>

<style lang="scss" src="./ProfileQuizzesTab.component.scss"></style>
```

> Note: `creator/fetchRooms` already supports a `user` filter (`store/creator/actions.js:297`) and applies `roomTransformer` before committing. We read from the shared store getter for the simplest implementation; if collision with `CreatorModeRooms` page becomes visible during testing, refactor to a scoped action.

> Verify `general.loadMore` exists in `locales/tr.js` and `locales/en.js`. If absent, add it during Task 3 (it is a generic key, not profile-specific). Existing rooms have `viewCount` exposed by `roomTransformer`; the label text uses a static "👁 N" presentation handled in the template via a simple computed.

- [ ] **Step 2: Write `ProfileQuizzesTab.component.scss`**

```scss
.profile-quizzes-tab {
  padding: 8px var(--base-p-x) 32px;

  &__state {
    display: flex;
    justify-content: center;
    padding: 32px 0;
  }

  &__cell {
    background: transparent;

    &-label {
      color: var(--color-text-03);
      font-size: 12px;
    }
  }

  &__more {
    display: block;
    margin: 16px auto 0;
  }
}
```

- [ ] **Step 3: Wire `pages/Profile/_username/index.vue`**

```pug
<template lang="pug">
ProfileQuizzesTab
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import ProfileQuizzesTab from '@/components/View/ProfileView/Tabs/ProfileQuizzesTab.component.vue'

export default defineComponent({
  components: { ProfileQuizzesTab }
})
</script>
```

- [ ] **Step 4: Wire `pages/Profile/_username/Quizzes/index.vue`**

```pug
<template lang="pug">
ProfileQuizzesTab
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import ProfileQuizzesTab from '@/components/View/ProfileView/Tabs/ProfileQuizzesTab.component.vue'

export default defineComponent({
  components: { ProfileQuizzesTab }
})
</script>
```

- [ ] **Step 5: Lint + dev verify**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla && yarn lint:eslint components/View/ProfileView/Tabs/ProfileQuizzesTab.component.vue pages/Profile/_username/index.vue pages/Profile/_username/Quizzes/index.vue
```

Expected: lint passes; dev server shows quiz list at `/profil/<u>` and `/profil/<u>/quizler`. Empty/error states render where applicable.

- [ ] **Step 6: Commit**

```bash
git add components/View/ProfileView/Tabs/ProfileQuizzesTab.component.vue components/View/ProfileView/Tabs/ProfileQuizzesTab.component.scss pages/Profile/_username/index.vue pages/Profile/_username/Quizzes/index.vue
git commit -m "feat(profile): quizler tab — list user's created rooms with load-more"
```

---

### Task 10: User-reviews store + ProfileReviewsTab + wire Reviews page

**Files:**
- Modify: `store/creator/state.js`
- Modify: `store/creator/mutations.js`
- Modify: `store/creator/getters.js`
- Modify: `store/creator/actions.js`
- Create: `components/View/ProfileView/Tabs/ProfileReviewsTab.component.vue`
- Create: `components/View/ProfileView/Tabs/ProfileReviewsTab.component.scss`
- Modify: `pages/Profile/_username/Reviews/index.vue`

- [ ] **Step 1: Add state slots in `store/creator/state.js`**

Add inside the exported state object:

```js
  userReviews: [],
  userReviewsPagination: { page: 1, pageCount: 1, pageSize: 10, total: 0 },
```

- [ ] **Step 2: Add mutations in `store/creator/mutations.js`**

```js
  SET_USER_REVIEWS(state, list) {
    state.userReviews = list
  },
  PUSH_USER_REVIEWS(state, list) {
    state.userReviews = [...state.userReviews, ...list]
  },
  SET_USER_REVIEWS_PAGINATION(state, pagination) {
    state.userReviewsPagination = pagination
  },
```

- [ ] **Step 3: Add getters in `store/creator/getters.js`**

```js
  userReviews(state) {
    return state.userReviews
  },
  userReviewsPagination(state) {
    return state.userReviewsPagination
  },
```

- [ ] **Step 4: Add action `fetchReviewsByUser` in `store/creator/actions.js`**

Add after the existing `fetchReviews` action:

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
      const list = data.data || []
      if (isLoadMore) commit('PUSH_USER_REVIEWS', list)
      else            commit('SET_USER_REVIEWS', list)
      if (data.meta?.pagination) commit('SET_USER_REVIEWS_PAGINATION', data.meta.pagination)
    }

    return { data, error }
  },
```

- [ ] **Step 5: Write `ProfileReviewsTab.component.vue`**

```pug
<template lang="pug">
.profile-reviews-tab
  template(v-if="loading")
    .profile-reviews-tab__state
      Loading(color="var(--color-brand-02)")

  template(v-else-if="error")
    Empty(image="error" :description="$t('profile.reviewsTab.error')")
      Button(@click="reload") {{ $t('error.tryAgain') }}

  template(v-else-if="reviews.length === 0")
    Empty(:description="$t('profile.reviewsTab.empty')")

  template(v-else)
    .profile-reviews-tab__list
      .profile-reviews-tab__item(v-for="review in reviews" :key="review.id")
        .profile-reviews-tab__head
          .profile-reviews-tab__rating
            template(v-for="n in 5")
              AppIcon(
                :key="n"
                :name="n <= (review.attributes.rating || 0) ? 'tabler:star-filled' : 'tabler:star'"
                color="var(--color-warning-01)"
                :width="14"
                :height="14"
              )
          Timeago.profile-reviews-tab__date(:datetime="review.attributes.createdAt" :auto-update="60" :locale="$i18n.locale")

        p.profile-reviews-tab__text(v-if="review.attributes.text") {{ review.attributes.text }}

        NuxtLink.profile-reviews-tab__room(
          v-if="review.attributes.room?.data"
          :to="localePath({ name: 'CreatorMode-CreatorModeRoom-slug', params: { slug: review.attributes.room.data.attributes.roomId } })"
        )
          AppIcon(name="tabler:target" color="var(--color-text-03)" :width="14" :height="14")
          span.profile-reviews-tab__room-title {{ review.attributes.room.data.attributes.title }}

    Button.profile-reviews-tab__more(
      v-if="pagination.page < pagination.pageCount"
      plain
      round
      size="small"
      :loading="loadingMore"
      @click="loadMore"
    ) {{ $t('general.loadMore') }}
</template>

<script>
import { defineComponent, inject, ref, computed, watch, useStore, useContext } from '@nuxtjs/composition-api'
import { Loading, Empty, Button } from 'vant'

const PAGE_SIZE = 10

export default defineComponent({
  components: {
    Loading,
    Empty,
    Button
  },
  setup() {
    const shell = inject('profileShell')
    const store = useStore()
    const { localePath } = useContext()

    const reviews = ref([])
    const pagination = ref({ page: 1, pageCount: 1, pageSize: PAGE_SIZE, total: 0 })
    const loading = ref(false)
    const loadingMore = ref(false)
    const error = ref(null)

    const playerId = computed(() => shell?.player?.value?.id || null)

    const load = async (page = 1, isLoadMore = false) => {
      if (!playerId.value) return
      if (isLoadMore) loadingMore.value = true
      else loading.value = true
      error.value = null

      const { data, error: err } = await store.dispatch('creator/fetchReviewsByUser', {
        userId: playerId.value,
        page,
        limit: PAGE_SIZE,
        isLoadMore
      })

      if (err) {
        error.value = err
      } else if (data) {
        reviews.value = isLoadMore
          ? [...reviews.value, ...(data.data || [])]
          : (data.data || [])
        pagination.value = data.meta?.pagination || pagination.value
      }

      loading.value = false
      loadingMore.value = false
    }

    watch(playerId, (id, prev) => {
      if (id && id !== prev) load(1, false)
    }, { immediate: true })

    const loadMore = () => load(pagination.value.page + 1, true)
    const reload = () => load(1, false)

    return {
      reviews,
      pagination,
      loading,
      loadingMore,
      error,
      loadMore,
      reload,
      localePath
    }
  }
})
</script>

<style lang="scss" src="./ProfileReviewsTab.component.scss"></style>
```

- [ ] **Step 6: Write `ProfileReviewsTab.component.scss`**

```scss
.profile-reviews-tab {
  padding: 8px var(--base-p-x) 32px;

  &__state {
    display: flex;
    justify-content: center;
    padding: 32px 0;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__item {
    padding: 12px;
    background: var(--color-surface-02);
    border-radius: 12px;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__rating {
    display: inline-flex;
    gap: 2px;
  }

  &__date {
    color: var(--color-text-03);
    font-size: 12px;
  }

  &__text {
    margin: 8px 0 0;
    font-size: 14px;
    line-height: 1.45;
    color: var(--color-text-01);
    white-space: pre-wrap;
  }

  &__room {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    padding: 6px 10px;
    border-radius: 999px;
    background: var(--color-surface-03);
    text-decoration: none;
    color: var(--color-text-02);
    font-size: 12px;

    &-title {
      color: var(--color-text-01);
      font-weight: 500;
    }
  }

  &__more {
    display: block;
    margin: 16px auto 0;
  }
}
```

- [ ] **Step 7: Wire `pages/Profile/_username/Reviews/index.vue`**

```pug
<template lang="pug">
ProfileReviewsTab
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import ProfileReviewsTab from '@/components/View/ProfileView/Tabs/ProfileReviewsTab.component.vue'

export default defineComponent({
  components: { ProfileReviewsTab }
})
</script>
```

- [ ] **Step 8: Lint + verify**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla && yarn lint:eslint store/creator components/View/ProfileView/Tabs/ProfileReviewsTab.component.vue pages/Profile/_username/Reviews/index.vue
```

Expected: lint passes; `/profil/<u>/degerlendirmeler` shows reviews list (empty state if the player hasn't reviewed anything).

- [ ] **Step 9: Commit**

```bash
git add store/creator components/View/ProfileView/Tabs/ProfileReviewsTab.component.vue components/View/ProfileView/Tabs/ProfileReviewsTab.component.scss pages/Profile/_username/Reviews/index.vue
git commit -m "feat(profile): reviews tab — Replies-style list with rating + room link"
```

---

### Task 11: User-room-scores store + ProfileScoresTab + wire Scores page

Two widgets: existing tour scores table (reuses `PlayerTourScoreTable`) and new recently-played list.

**Files:**
- Modify: `store/creator/state.js`
- Modify: `store/creator/mutations.js`
- Modify: `store/creator/getters.js`
- Modify: `store/creator/actions.js`
- Create: `components/View/ProfileView/Tabs/ProfileScoresTab.component.vue`
- Create: `components/View/ProfileView/Tabs/ProfileScoresTab.component.scss`
- Modify: `pages/Profile/_username/Scores/index.vue`

- [ ] **Step 1: Add state slots in `store/creator/state.js`**

Append inside the same state object:

```js
  userRoomScores: [],
  userRoomScoresPagination: { page: 1, pageCount: 1, pageSize: 10, total: 0 },
```

- [ ] **Step 2: Add mutations**

```js
  SET_USER_ROOM_SCORES(state, list) {
    state.userRoomScores = list
  },
  PUSH_USER_ROOM_SCORES(state, list) {
    state.userRoomScores = [...state.userRoomScores, ...list]
  },
  SET_USER_ROOM_SCORES_PAGINATION(state, pagination) {
    state.userRoomScoresPagination = pagination
  },
```

- [ ] **Step 3: Add getters**

```js
  userRoomScores(state) {
    return state.userRoomScores
  },
  userRoomScoresPagination(state) {
    return state.userRoomScoresPagination
  },
```

- [ ] **Step 4: Add action `fetchRoomScoresByUser`**

```js
  async fetchRoomScoresByUser({ commit }, { userId, page = 1, limit = 10, isLoadMore = false }) {
    const { data, error } = await this.$appFetch({
      path: 'room-scores',
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
      const list = data.data || []
      if (isLoadMore) commit('PUSH_USER_ROOM_SCORES', list)
      else            commit('SET_USER_ROOM_SCORES', list)
      if (data.meta?.pagination) commit('SET_USER_ROOM_SCORES_PAGINATION', data.meta.pagination)
    }

    return { data, error }
  },
```

- [ ] **Step 5: Write `ProfileScoresTab.component.vue`**

```pug
<template lang="pug">
.profile-scores-tab
  // Widget A — tour mode scores
  .profile-scores-tab__widget
    strong.profile-scores-tab__widget-title {{ $t('profile.scoresTab.tour.title') }}

    template(v-if="tourScoreLoading")
      .profile-scores-tab__state
        Loading(color="var(--color-brand-02)")

    template(v-else-if="tourScoreError")
      Empty(image="error" :description="$t('dialog.player.tourScore.callback.error.title')")
        Button(@click="refetchShell") {{ $t('error.tryAgain') }}

    template(v-else)
      PlayerTourScoreTable(:tourScore="tourScore")

  // Widget B — recently played
  .profile-scores-tab__widget
    strong.profile-scores-tab__widget-title {{ $t('profile.scoresTab.room.title') }}

    template(v-if="loading")
      .profile-scores-tab__state
        Loading(color="var(--color-brand-02)")

    template(v-else-if="error")
      Empty(image="error" :description="$t('profile.scoresTab.room.error')")
        Button(@click="reload") {{ $t('error.tryAgain') }}

    template(v-else-if="roomScores.length === 0")
      Empty(:description="$t('profile.scoresTab.room.empty')")

    template(v-else)
      .profile-scores-tab__list
        .profile-scores-tab__item(v-for="score in roomScores" :key="score.id")
          NuxtLink.profile-scores-tab__item-title(
            v-if="score.attributes.room?.data"
            :to="localePath({ name: 'CreatorMode-CreatorModeRoom-slug', params: { slug: score.attributes.room.data.attributes.roomId } })"
          ) {{ score.attributes.room.data.attributes.title }}

          .profile-scores-tab__item-meta
            Timeago(:datetime="score.attributes.createdAt" :auto-update="60" :locale="$i18n.locale")
            span &nbsp;·&nbsp;
            span {{ statsLine(score) }}

      Button.profile-scores-tab__more(
        v-if="pagination.page < pagination.pageCount"
        plain
        round
        size="small"
        :loading="loadingMore"
        @click="loadMore"
      ) {{ $t('general.loadMore') }}
</template>

<script>
import { defineComponent, inject, ref, computed, watch, useStore, useContext } from '@nuxtjs/composition-api'
import { Loading, Empty, Button } from 'vant'

const PAGE_SIZE = 10

export default defineComponent({
  components: {
    Loading,
    Empty,
    Button
  },
  setup() {
    const shell = inject('profileShell')
    const store = useStore()
    const { localePath, i18n } = useContext()

    const tourScore = computed(() => shell?.tourScore?.value || null)
    const tourScoreLoading = computed(() => shell?.tourScoreLoading?.value || false)
    const tourScoreError = computed(() => shell?.tourScoreError?.value || null)
    const refetchShell = () => shell?.refetch?.()

    const roomScores = ref([])
    const pagination = ref({ page: 1, pageCount: 1, pageSize: PAGE_SIZE, total: 0 })
    const loading = ref(false)
    const loadingMore = ref(false)
    const error = ref(null)

    const playerId = computed(() => shell?.player?.value?.id || null)

    const load = async (page = 1, isLoadMore = false) => {
      if (!playerId.value) return
      if (isLoadMore) loadingMore.value = true
      else loading.value = true
      error.value = null

      const { data, error: err } = await store.dispatch('creator/fetchRoomScoresByUser', {
        userId: playerId.value,
        page,
        limit: PAGE_SIZE,
        isLoadMore
      })

      if (err) {
        error.value = err
      } else if (data) {
        roomScores.value = isLoadMore
          ? [...roomScores.value, ...(data.data || [])]
          : (data.data || [])
        pagination.value = data.meta?.pagination || pagination.value
      }

      loading.value = false
      loadingMore.value = false
    }

    watch(playerId, (id, prev) => {
      if (id && id !== prev) load(1, false)
    }, { immediate: true })

    const loadMore = () => load(pagination.value.page + 1, true)
    const reload = () => load(1, false)

    const statsLine = score => {
      const results = score.attributes?.results || {}
      const correct = results.correct ?? 0
      const wrong = results.wrong ?? 0
      const composite = results.score ?? results.composite ?? 0
      return i18n.t('profile.scoresTab.room.statsLine', { correct, wrong, score: composite })
    }

    return {
      tourScore,
      tourScoreLoading,
      tourScoreError,
      refetchShell,
      roomScores,
      pagination,
      loading,
      loadingMore,
      error,
      loadMore,
      reload,
      localePath,
      statsLine
    }
  }
})
</script>

<style lang="scss" src="./ProfileScoresTab.component.scss"></style>
```

- [ ] **Step 6: Write `ProfileScoresTab.component.scss`**

```scss
.profile-scores-tab {
  padding: 8px var(--base-p-x) 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;

  &__widget {
    display: flex;
    flex-direction: column;
    gap: 12px;

    &-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--color-text-01);
    }
  }

  &__state {
    display: flex;
    justify-content: center;
    padding: 24px 0;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__item {
    padding: 12px;
    background: var(--color-surface-02);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;

    &-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-01);
      text-decoration: none;
    }

    &-meta {
      display: flex;
      align-items: center;
      font-size: 12px;
      color: var(--color-text-03);
    }
  }

  &__more {
    display: block;
    margin: 8px auto 0;
  }
}
```

- [ ] **Step 7: Wire `pages/Profile/_username/Scores/index.vue`**

```pug
<template lang="pug">
ProfileScoresTab
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import ProfileScoresTab from '@/components/View/ProfileView/Tabs/ProfileScoresTab.component.vue'

export default defineComponent({
  components: { ProfileScoresTab }
})
</script>
```

- [ ] **Step 8: Lint + final verify**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla && yarn lint:eslint store/creator components/View/ProfileView pages/Profile && yarn lint:stylelint
```

Expected: lint passes. Manual checks:

- `/profil/<u>` → header + Quizler default + tab bar (Quizler underlined).
- Click Quizler → URL becomes `/profil/<u>/quizler`; same content.
- Click Değerlendirmeler → reviews list (or empty state).
- Click Skorlar → tour scores widget + recently-played widget (or empty state).
- Self-profile → "Profili düzenle" button → navigates to `/hesap/duzenle`.
- Other-profile → flag/report icon opens `ReportDialog`.
- Unknown username → "Bu kullanıcı bulunamadı" with home CTA.
- Visiting `/profil` or `/profil?username=X` → 404.
- TR ↔ EN locale switch swaps all paths and labels.

- [ ] **Step 9: Build check**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla && yarn build
```

Expected: build succeeds without route conflicts.

- [ ] **Step 10: Commit**

```bash
git add store/creator components/View/ProfileView/Tabs/ProfileScoresTab.component.vue components/View/ProfileView/Tabs/ProfileScoresTab.component.scss pages/Profile/_username/Scores/index.vue
git commit -m "feat(profile): scores tab — tour widget + recently played quizzes"
```

---

## Final Verification (after Task 11)

Run from `/Users/selim.doyranli/projects/selimdoyranli/github/parolla`:

```bash
yarn lint:eslint
yarn lint:stylelint
yarn build
```

Expected: all pass. Walk through the verification matrix from the spec's Section 11.
