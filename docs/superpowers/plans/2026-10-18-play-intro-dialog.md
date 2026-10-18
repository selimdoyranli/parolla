# Play Intro Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the pre-game how-to-play intro with a quiz-landing-style `PlayIntroDialog` (cover, stats, OYNA, share/rate, collapsible rules, top-10 leaderboard, creator, comments preview) for creator rooms, Daily and Unlimited.

**Architecture:** Extract two shared units first (`QuizCover` from `QuizCard`, `HowToPlayContent` from `HowToPlayDialog`) plus small plumbing (stats dialog opened on a tab, `useRoomShare`). Then build `PlayIntroDialog` in two tasks (static sections, then data sections) and swap it into the five game scenes. Frontend only.

**Tech Stack:** Nuxt 2.17 / Vue 2 (`@nuxtjs/composition-api`), Pug, SCSS, Vant 2, Vuex.

**Spec:** `docs/superpowers/specs/2026-10-18-play-intro-dialog-design.md` — read it before your task.

**Repo & branch:** `/Users/selim.doyranli/projects/selimdoyranli/github/parolla-workspace/parolla`, branch `feat/play-intro-dialog` (already checked out). Never push, never deploy.

## Global Constraints

- Code style: no semicolons, Pug templates, Composition API via `@nuxtjs/composition-api`, blank line before `return`/`if`, 150-char lines; files are CRLF — keep line endings.
- Run `npx eslint <files>` and `npx stylelint <scss files>` on touched files before committing (use `--fix`). Commit with `--no-verify` is allowed (pre-commit hook is noisy on CRLF); end every commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Colors only via existing CSS variables (`--color-brand-02`, `--color-ui-01..04`, `--color-text-01..04`, `--color-border-02`, `--border-radius-01`); must work in `.dark-mode` (`@nuxtjs/color-mode`, toggle via `localStorage['nuxt-color-mode']`).
- All user-facing strings in `locales/tr.js` and `locales/en.js` under a new top-level `playIntro` block (Task 4 creates it; Task 5 extends it).
- The intro is a scene dialog: root classes `.dialog.dialog--scene`, `transition="dialog-scene-bounce"`, `:overlay="false"`, no title, no Vant footer buttons (`:show-cancel-button="false" :show-confirm-button="false"`), `:close-on-click-overlay="false"`, `:close-on-popstate="false"`.
- Emitting `closed` from the intro is the only way the game starts (scenes bind `@closed="startGame"`), so OYNA must close the dialog and nothing else may close it.
- Wordblock and the header ⓘ `HowToPlayDialog` must keep working unchanged.

## Review Focus

1. **Room without cover photo / anonymous room** — gradient+grid hero renders; creator section says "Anonim" (room.user null) instead of crashing. Pinned in Task 4 verification.
2. **No scores / no comments yet** — leaderboard and comments sections show empty states; OYNA still works. Pinned in Task 5 verification.
3. **Failed requests** (scoreboard/comments/daily leaderboard) — the section hides its list, no error overlay, OYNA works. Pinned in Task 5 (code: every fetch result checked for `error`).
4. **Deep link `?comment=` / `?rating=`** — intro stays held (not shown) while the reviews dialog is open, then appears. Pinned in Task 6 verification.
5. **Header ⓘ while the intro is open** — no second dialog stacks (intro mirrors `app/SET_IS_OPEN_INTRO_HOW_TO_PLAY`). Pinned in Task 4 + Task 6 verification.

---

## File Map

- Create: `components/Card/QuizCover/QuizCover.component.{vue,scss}` (Task 1)
- Modify: `components/Card/QuizCard/QuizCard.component.{vue,scss}` (Task 1)
- Create: `components/View/HowToPlayContent/HowToPlayContent.component.vue` (Task 2)
- Modify: `components/Dialog/HowToPlayDialog/HowToPlayDialog.component.vue` (Task 2)
- Create: `composables/useRoomShare.js` (Task 3); Modify: `components/Dialog/MenuDialog/MenuDialog.component.vue`, `store/creator/{state,mutations}.js`, `components/Dialog/CreatorModeStatsDialog/CreatorModeStatsDialog.component.vue` (Task 3)
- Create: `components/Dialog/PlayIntroDialog/PlayIntroDialog.component.{vue,scss}` (Tasks 4–5); Modify: `locales/{tr,en}.js` (Tasks 4–5)
- Modify: `components/Scene/{CreatorModeGameScene,ChoicesGameScene,FlashcardGameScene,DailyModeGameScene,UnlimitedModeGameScene}/*.component.vue` (Task 6)

## Verification harness (all tasks)

Local servers: Nuxt dev on http://localhost:3000 (`yarn dev`, already running — if not listening, start it in the background from the repo root) and Strapi on http://localhost:1337 (from `../parolla-strapi`, `pnpm dev`, start in background if not listening; wait for `/_health` = 204). Headless Chrome via puppeteer-core:

```js
// scratch script outside the repo (e.g. the session scratchpad); run with node
const puppeteer = require('<scratchpad>/tools/node_modules/puppeteer-core') // installed: npm i --prefix <scratchpad>/tools puppeteer-core@23
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' })
// logged-in as the local GM user (id 257116): sign an HS256 JWT with JWT_SECRET from ../parolla-strapi/.env, payload { id, iat, exp },
// then set cookies 'auth._token.google' = encodeURIComponent('Bearer <jwt>') and 'auth.strategy' = 'google' on http://localhost:3000
```
Useful pages: `/quiz/fotograftan-sehir-bil-t-ue-rkiye` (owned by the GM user, 57 scores, no cover photo), `/quiz/test-trivia-admin-1` (2 comments, ratings), `/gunluk` (daily), `/limitsiz` (unlimited). If the dev server ever renders `localePath(...)` as `/` (route names doubled after HMR), restart `yarn dev`.

---

### Task 1: `QuizCover` extracted from `QuizCard`

**Files:**
- Create: `components/Card/QuizCover/QuizCover.component.vue`, `components/Card/QuizCover/QuizCover.component.scss`
- Modify: `components/Card/QuizCard/QuizCard.component.vue` (media zone + palette code), `components/Card/QuizCard/QuizCard.component.scss` (placeholder blocks move)

**Interfaces:**
- Produces: `<QuizCover :room="room" seed="daily" label="GÜNLÜK" sublabel="18 Ekim" />` with a default slot for overlay content. Root class `.quiz-cover`; children `.quiz-cover__photo`, `.quiz-cover__placeholder`, `.quiz-cover__placeholder-grid`, `.quiz-cover__placeholder-glow`, `.quiz-cover__label`, `.quiz-cover__sublabel`. 16:9 box.

- [ ] **Step 1: Read** `QuizCard.component.vue` (template lines 1–40, `PLACEHOLDER_PALETTES`, `hashSeed`, `cardStyle`, `hasCoverPhoto`) and `QuizCard.component.scss` (`&__media`, `&__photo`, `&__placeholder*`, hover/focus rules ~lines 85–200, light filter var at the top, dark-mode override ~line 657–680).

- [ ] **Step 2: Create `QuizCover.component.vue`**

```pug
<template lang="pug">
.quiz-cover(:style="coverStyle" :class="{ 'quiz-cover--photo': hasCoverPhoto }")
  img.quiz-cover__photo(v-if="hasCoverPhoto" :src="room.coverPhoto.url" loading="lazy" draggable="false" :alt="room.title")
  .quiz-cover__placeholder(v-else)
    .quiz-cover__placeholder-grid
    .quiz-cover__placeholder-glow
  //- large overlay text for mode intros ("GÜNLÜK", "LİMİTSİZ")
  .quiz-cover__labels(v-if="label")
    strong.quiz-cover__label {{ label }}
    small.quiz-cover__sublabel(v-if="sublabel") {{ sublabel }}
  slot
</template>

<script>
import { defineComponent, computed } from '@nuxtjs/composition-api'

const PLACEHOLDER_PALETTES = [
  { from: '#ff7878', to: '#c83a5a', tint: 'rgba(255, 220, 220, 0.18)' },
  { from: '#7c5ce8', to: '#3a3da8', tint: 'rgba(225, 220, 255, 0.18)' },
  { from: '#1f9e8e', to: '#0c5a64', tint: 'rgba(200, 245, 240, 0.18)' },
  { from: '#d4a017', to: '#9b5b0a', tint: 'rgba(255, 235, 200, 0.18)' },
  { from: '#e85a8a', to: '#7a2d5a', tint: 'rgba(255, 220, 235, 0.18)' },
  { from: '#3b7dd8', to: '#163f7a', tint: 'rgba(210, 225, 255, 0.18)' }
]

const hashSeed = key => {
  const s = String(key || '')
  let h = 0

  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }

  return Math.abs(h)
}

export default defineComponent({
  name: 'QuizCover',
  props: {
    room: { type: Object, required: false, default: null },
    // palette key when there is no room (mode intros)
    seed: { type: String, required: false, default: '' },
    label: { type: String, required: false, default: null },
    sublabel: { type: String, required: false, default: null }
  },
  setup(props) {
    const hasCoverPhoto = computed(() => Boolean(props.room?.coverPhoto?.url))

    const coverStyle = computed(() => {
      const key = props.room?.roomId || props.room?.documentId || props.room?.title || props.seed
      const palette = PLACEHOLDER_PALETTES[hashSeed(key) % PLACEHOLDER_PALETTES.length]

      return {
        '--quiz-card-from': palette.from,
        '--quiz-card-to': palette.to,
        '--quiz-card-tint': palette.tint
      }
    })

    return { hasCoverPhoto, coverStyle }
  }
})
</script>

<style lang="scss" src="./QuizCover.component.scss"></style>
```
Keep the CSS variable names `--quiz-card-from/to/tint` and `--quiz-card-placeholder-filter` so the existing light/dark filter definitions keep applying.

- [ ] **Step 3: Create `QuizCover.component.scss`** by moving (not copying) the rules for the media box, photo, placeholder, placeholder-grid and placeholder-glow from `QuizCard.component.scss`, renamed to `.quiz-cover`, `&__photo`, `&__placeholder`, `&__placeholder-grid`, `&__placeholder-glow` (same values: `position: relative; overflow: hidden; aspect-ratio: 16 / 9; background: var(--color-ui-03)` on the root, etc.). Move the `--quiz-card-placeholder-filter` definitions (light value at the top of the QuizCard scss and the dark-mode `none` override) to the new file only if nothing else in QuizCard uses them; otherwise leave them where they are (they are CSS custom properties on `:root`/`.dark-mode` scope — check how they're scoped and keep the same scope). Add the labels:

```scss
  &__labels {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #fff;
    text-align: center;
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
    inset: 0;
    pointer-events: none;
  }

  &__label {
    font-size: var(--font-size-text-1);
    font-weight: 800;
    letter-spacing: 0.08em;
  }

  &__sublabel {
    margin-top: 4px;
    font-size: var(--font-size-text-8);
    opacity: 0.85;
  }
```

- [ ] **Step 4: Use it in `QuizCard`** — replace the media zone's photo/placeholder markup with `QuizCover` and keep everything else (title overlay, top badges) as its slot content:

```pug
  QuizCover.quiz-card__media(:room="room")
    h3.quiz-card__placeholder-title {{ room.title }}
    .quiz-card__media-top
      //- (existing badge markup unchanged)
```
Remove `PLACEHOLDER_PALETTES`, `hashSeed`, the palette part of `cardStyle` and the moved SCSS from QuizCard. If `cardStyle` sets nothing else, remove it and the root `:style`. Keep `hasCoverPhoto` in QuizCard only if QuizCard still uses it (e.g. `quiz-card--hasCoverPhoto` class for the title styling) — keep that class behavior. Hover/focus zoom rules in QuizCard that targeted `&__photo`/`&__placeholder` must now target `.quiz-cover__photo` / `.quiz-cover__placeholder` inside the card (e.g. `&:hover .quiz-cover__placeholder { transform: scale(1.04) }`) so the card looks and animates exactly as before.

- [ ] **Step 5: Verify** — before editing anything in Step 2, take "before" headless screenshots of `/` and `/yaratici` (quiz list) at 420px and 1280px in light and dark; after Step 4 take the same "after" shots. Cards with and without a cover photo must look the same (gradient, grid, glow, title, badges); on desktop the hover zoom still works. eslint/stylelint on the four files.

- [ ] **Step 6: Commit** — `refactor(quiz-card): extract QuizCover (cover photo or gradient/grid placeholder)`

---

### Task 2: `HowToPlayContent` extracted from `HowToPlayDialog`

**Files:**
- Create: `components/View/HowToPlayContent/HowToPlayContent.component.vue`
- Modify: `components/Dialog/HowToPlayDialog/HowToPlayDialog.component.vue`

**Interfaces:**
- Produces: `<HowToPlayContent />` — renders the right per-mode content component for the active game mode / creator quiz type. No props.

- [ ] **Step 1: Create the component** with the `v-if` switch moved from `HowToPlayDialog` (lines 14–20 today):

```pug
<template lang="pug">
.how-to-play-content
  HowToPlayDailyModeContent(v-if="activeGameMode === gameModeKeyEnum.DAILY")
  HowToPlayUnlimitedModeContent(v-if="activeGameMode === gameModeKeyEnum.UNLIMITED")
  HowToPlayCreatorModeContent(v-if="activeGameMode === gameModeKeyEnum.CREATOR && (room.quizType === quizTypeEnum.QA || !room.quizType)")
  HowToPlayThisOrThatContent(v-if="room && room.quizType === quizTypeEnum.CHOICES")
  HowToPlayFlashcardsContent(v-if="room && room.quizType === quizTypeEnum.FLASHCARDS")
  HowToPlayTourModeContent(v-if="activeGameMode === gameModeKeyEnum.TOUR")
  HowToPlayWordblockModeContent(v-if="activeGameMode === gameModeKeyEnum.WORDBLOCK")
</template>

<script>
import { defineComponent, computed, useStore } from '@nuxtjs/composition-api'
import { gameModeKeyEnum } from '@/enums/gameModeKey.enum'
import { quizTypeEnum } from '@/enums/quiz.enum'

export default defineComponent({
  setup() {
    const store = useStore()
    const { activeGameMode } = useGameMode()
    const room = computed(() => store.getters['creator/room'])

    return { gameModeKeyEnum, quizTypeEnum, activeGameMode, room }
  }
})
</script>
```
(`useGameMode` is auto-imported, as in `HowToPlayDialog`.)

- [ ] **Step 2: Use it** in `HowToPlayDialog`: inside `.how-to-play-dialog__explain` replace the seven content lines with `HowToPlayContent`, keep the ad block. Remove now-unused bindings from HowToPlayDialog's setup only if nothing else uses them (`dialogTitle` still uses `activeGameMode`, `room`, enums — keep those).

- [ ] **Step 3: Verify** — eslint; headless: header ⓘ dialog on `/gunluk`, `/limitsiz`, `/quiz/test-trivia-admin-1` shows the same rules text as before; Wordblock (`/kelimeblok`) intro unchanged.

- [ ] **Step 4: Commit** — `refactor(how-to-play): extract HowToPlayContent`

---

### Task 3: Stats dialog opened on a tab + `useRoomShare`

**Files:**
- Create: `composables/useRoomShare.js`
- Modify: `components/Dialog/MenuDialog/MenuDialog.component.vue` (`openRoomSharer` ~line 295), `store/creator/state.js` (`dialog.stats`), `store/creator/mutations.js`, `components/Dialog/CreatorModeStatsDialog/CreatorModeStatsDialog.component.vue` (isOpen watch ~line 172, `activeTab` ~line 181, tab watch ~line 300)

**Interfaces:**
- Produces: `useRoomShare()` → `{ shareRoom(room) }` (async; room needs `title`, `roomId`, `questionCount`). Store: `creator/SET_STATS_DIALOG_TAB(tab: string | null)`; state `creator.dialog.stats.tab`.

- [ ] **Step 1: `composables/useRoomShare.js`** (composables are auto-imported by name; check `nuxt.config.js` autoImport dirs include `composables` — they do for the existing ones):

```js
import { useContext } from '@nuxtjs/composition-api'
import { APP_URL } from '@/system/constant'
import { showToast } from '@/helpers/toast'

// Share text = room title, question count and link; clipboard first, then the native share sheet
export const useRoomShare = () => {
  const { i18n, localePath } = useContext()
  const { postToNative } = useNativeBridge()

  const shareRoom = async room => {
    const shareText = i18n.t('sharer.room.description', {
      roomTitle: room.title,
      questionCount: room.questionCount,
      url: `${APP_URL}${localePath({ name: 'CreatorMode-CreatorModeRoom-slug', params: { slug: room.roomId } })}`
    })

    postToNative('sharer', shareText)

    try {
      await navigator.clipboard.writeText(shareText)
      await showToast.default(i18n.t('clipboard.callback.success'))
      await navigator.share({ title: 'parolla', text: shareText })
    } catch {
      await navigator.clipboard.writeText(shareText)
      await showToast.default(i18n.t('clipboard.callback.success'))
    }
  }

  return { shareRoom }
}
```
Match the existing `openRoomSharer` exactly (read it first): if it does not call `postToNative('sharer', …)`, don't add it; if it uses `questions.value.length` for the count, keep using the room's questions length via the caller (MenuDialog passes `{ ...room.value, questionCount: questions.value.length }`).

- [ ] **Step 2: MenuDialog uses it** — replace the body of `openRoomSharer` with `shareRoom(...)` so behavior is unchanged.

- [ ] **Step 3: Store tab** — `state.dialog.stats = { isOpen: false, tab: null }`; add

```js
  // tab to show when the stats dialog opens next (e.g. 'scoreboard' from the play intro)
  SET_STATS_DIALOG_TAB(state, tab) {
    state.dialog.stats.tab = tab
  },
```

- [ ] **Step 4: CreatorModeStatsDialog honors it** — in the `props.isOpen` watch, when it becomes true and `store.getters['creator/dialog'].stats.tab` is set: if `activeTab.value === tab` already, run the same scoreboard load the tab watch runs (extract the watch body into `const loadScoreboard = async () => { … }` and call it), else set `activeTab.value = tab` (the existing watch loads it); then `store.commit('creator/SET_STATS_DIALOG_TAB', null)`.

- [ ] **Step 5: Verify** — eslint. Headless on the GM-owned quiz: in the console run `$nuxt.$store.commit('creator/SET_STATS_DIALOG_TAB','scoreboard'); $nuxt.$store.commit('creator/SET_IS_OPEN_STATS_DIALOG', true)` (after closing the intro and waiting 5s for the countdown) → the stats dialog opens on the scoreboard tab with rows. Menu → "Quiz'i paylaş" still shows the copied toast.

- [ ] **Step 6: Commit** — `feat(creator): open the stats dialog on a given tab; share room via useRoomShare`

---

### Task 4: `PlayIntroDialog` — static sections

**Files:**
- Create: `components/Dialog/PlayIntroDialog/PlayIntroDialog.component.vue`, `.scss`
- Modify: `locales/tr.js`, `locales/en.js` (new top-level `playIntro` block)

**Interfaces:**
- Consumes: `QuizCover` (Task 1), `HowToPlayContent` (Task 2), `useRoomShare().shareRoom(room)` (Task 3).
- Produces: `<PlayIntroDialog :isOpen="…" mode="creator|daily|unlimited" @closed="startGame" />`. Template section anchors Task 5 fills: `.play-intro__leaderboard` and `.play-intro__comments` placeholders are NOT created here — Task 5 adds them between `.play-intro__rules` and `.play-intro__creator` (leaderboard) and after `.play-intro__creator` (comments). Exposes in setup: `room`, `isCreator`, `isQa`, `state`, `play()`, `openReviews()` (sets `reviewDialog.isOpen = true`), and renders `LazyRoomReviewDialog(:isOpen="reviewDialog.isOpen" @closed="reviewDialog.isOpen = false")`.

- [ ] **Step 1: i18n** — add to `locales/tr.js` (and English equivalents in `en.js`) a top-level block:

```js
playIntro: {
  play: 'OYNA',
  share: 'Paylaş',
  rate: 'Puan Ver',
  howToPlay: 'Nasıl oynanır?',
  creator: 'Oluşturan',
  anon: 'Anonim',
  daily: 'GÜNLÜK',
  unlimited: 'LİMİTSİZ',
  rating: '{rating} /5',
  raters: '({count})',
  views: '{count} görüntülenme',
  questions: '{count} soru',
  choices: '{count} seçenek',
  flashcards: '{count} kart',
  comments: '{count} yorum',
  timeLimit: '{minutes} dk',
  letters: '{count} harf'
}
```
English: PLAY, Share, Rate, How to play?, Created by, Anonymous, DAILY, UNLIMITED, '{rating} /5', '({count})', '{count} views', '{count} questions', '{count} choices', '{count} cards', '{count} comments', '{minutes} min', '{count} letters'.

- [ ] **Step 2: Component** — scene dialog per Global Constraints:

```pug
<template lang="pug">
Dialog.dialog.dialog--scene.play-intro(
  v-model="state.isOpen"
  transition="dialog-scene-bounce"
  :overlay="false"
  :show-cancel-button="false"
  :show-confirm-button="false"
  :close-on-click-overlay="false"
  :close-on-popstate="false"
  @closed="$emit('closed')"
)
  QuizCover.play-intro__cover(:room="isCreator ? room : null" :seed="mode" :label="coverLabel" :sublabel="coverSublabel")

  .play-intro__body
    template(v-if="isCreator")
      h2.play-intro__title {{ room.title }}
      p.play-intro__description(v-if="room.description") {{ room.description }}

    ul.play-intro__stats
      li.play-intro__stat(v-for="stat in stats" :key="stat.key")
        AppIcon(:name="stat.icon" :width="16" :height="16")
        span {{ stat.text }}

    Button.play-intro__play(block round @click="play")
      AppIcon(name="tabler:player-play-filled" :width="20" :height="20")
      span {{ $t('playIntro.play') }}

    .play-intro__actions(v-if="isCreator")
      Button.play-intro__action(round size="small" @click="shareRoom({ ...room, questionCount: room.questionCount })")
        AppIcon(name="tabler:share" :width="16" :height="16")
        span {{ $t('playIntro.share') }}
      Button.play-intro__action(round size="small" @click="openReviews")
        AppIcon(name="tabler:star" :width="16" :height="16")
        span {{ $t('playIntro.rate') }}

    Collapse.play-intro__rules(v-model="rulesOpen" :border="false")
      CollapseItem(name="rules" :title="$t('playIntro.howToPlay')" icon="question-o")
        HowToPlayContent

    section.play-intro__creator(v-if="isCreator")
      small {{ $t('playIntro.creator') }}
      PlayerAvatar(v-if="room.user" with-username open-player-dialog-on-click :size="36" :user="room.user")
      strong(v-else) {{ $t('playIntro.anon') }}

    .play-intro__ad
      AppAd(v-if="isDesktop" :data-ad-slot="9964323575")
      AppAd(v-else :data-ad-slot="5200543400")

  footer.play-intro__footer
    i18n.d-flex(path="app.copyright")
      template(#logo)
        FooterBrandLogo

  LazyRoomReviewDialog(v-if="isCreator" :isOpen="reviewDialog.isOpen" @closed="reviewDialog.isOpen = false")
</template>
```
Script essentials:

```js
import { defineComponent, reactive, ref, computed, watch, onBeforeUnmount, useStore, useContext } from '@nuxtjs/composition-api'
import { Dialog, Button, Collapse, CollapseItem } from 'vant'
import { useMediaQuery } from '@vueuse/core'
import { GAME_TIME_LIMIT } from '@/system/constant'
import { quizTypeEnum } from '@/enums/quiz.enum'

// props: isOpen (Boolean, default false), mode (String, required, validator: ['creator', 'daily', 'unlimited'].includes)
// emits: ['closed']
setup(props) {
  const store = useStore()
  const { i18n } = useContext()
  const { isoToHumanDate, formatMillions } = useFormatter()
  const { shareRoom } = useRoomShare()
  const isDesktop = useMediaQuery('(min-width: 992px)')

  const state = reactive({ isOpen: props.isOpen })
  const rulesOpen = ref([])
  const reviewDialog = reactive({ isOpen: false })

  watch(() => props.isOpen, value => { state.isOpen = value })
  // the header's how-to-play button checks this so it doesn't stack a dialog on the intro
  watch(() => state.isOpen, value => store.commit('app/SET_IS_OPEN_INTRO_HOW_TO_PLAY', value), { immediate: true })
  onBeforeUnmount(() => store.commit('app/SET_IS_OPEN_INTRO_HOW_TO_PLAY', false))

  const room = computed(() => store.getters['creator/room'] || {})
  const isCreator = computed(() => props.mode === 'creator')
  const isQa = computed(() => isCreator.value && (!room.value.quizType || room.value.quizType === quizTypeEnum.QA))
  const minutes = computed(() => Math.round((isCreator.value && room.value.gameTimeLimit ? room.value.gameTimeLimit : GAME_TIME_LIMIT) / 60000))

  const coverLabel = computed(() => (props.mode === 'daily' ? i18n.t('playIntro.daily') : props.mode === 'unlimited' ? i18n.t('playIntro.unlimited') : null))
  const coverSublabel = computed(() => (props.mode === 'daily' ? isoToHumanDate(new Date().toISOString(), { showHour: false, showMinute: false, showDay: true, showMonth: true }) : null))

  const stats = computed(() => {
    if (props.mode === 'daily') {
      const letters = store.getters['daily/alphabet']?.items?.length || 0

      return [
        letters && { key: 'letters', icon: 'tabler:abc', text: i18n.t('playIntro.letters', { count: letters }) },
        { key: 'time', icon: 'tabler:clock', text: i18n.t('playIntro.timeLimit', { minutes: minutes.value }) }
      ].filter(Boolean)
    }

    if (props.mode === 'unlimited') return [{ key: 'time', icon: 'tabler:clock', text: i18n.t('playIntro.timeLimit', { minutes: minutes.value }) }]

    const r = room.value
    const countByType =
      r.quizType === quizTypeEnum.CHOICES
        ? i18n.t('playIntro.choices', { count: r.choices?.length || 0 })
        : r.quizType === quizTypeEnum.FLASHCARDS
          ? i18n.t('playIntro.flashcards', { count: r.flashcardCount || 0 })
          : i18n.t('playIntro.questions', { count: r.questionCount || 0 })

    return [
      { key: 'rating', icon: 'tabler:star', text: `${i18n.t('playIntro.rating', { rating: Number(r.rating || 0).toFixed(1) })} ${i18n.t('playIntro.raters', { count: r.ratingCount || 0 })}` },
      { key: 'views', icon: 'tabler:eye', text: i18n.t('playIntro.views', { count: formatMillions(r.viewCount || 0) }) },
      { key: 'count', icon: 'tabler:list-numbers', text: countByType },
      { key: 'comments', icon: 'tabler:message-2', text: i18n.t('playIntro.comments', { count: r.reviewCount || 0 }) },
      { key: 'time', icon: 'tabler:clock', text: i18n.t('playIntro.timeLimit', { minutes: minutes.value }) },
      r.createdAt && { key: 'date', icon: 'tabler:calendar', text: isoToHumanDate(r.createdAt, { showHour: false, showMinute: false, showDay: true, showMonth: true, showYear: true }) }
    ].filter(Boolean)
  })

  // closing is what starts the game (scenes bind @closed="startGame")
  const play = () => { state.isOpen = false }
  const openReviews = () => { reviewDialog.isOpen = true }

  return { state, rulesOpen, reviewDialog, room, isCreator, isQa, isDesktop, coverLabel, coverSublabel, stats, play, openReviews, shareRoom }
}
```
Check `useFormatter`'s real option names (`isoToHumanDate(timestamp, options)` in `composables/useFormatter.js` ~line 74) and `formatMillions` signature; check the daily store getter for the alphabet (`store/daily/getters.js` `alphabet(state) { return state.alphabet }` → `.items`). Register `QuizCover`, `HowToPlayContent`, `PlayerAvatar`, `AppAd`, `FooterBrandLogo` only if not globally auto-registered (Nuxt components auto-import is on — `QuizCard` uses components without importing them).

- [ ] **Step 3: SCSS** (BEM, tokens only):

```scss
.play-intro {
  .van-dialog__content {
    padding: 0;
  }

  &__cover {
    width: 100%;
  }

  &__body {
    padding: var(--base-p-y) var(--base-p-x);
  }

  &__title {
    margin: 4px 0 6px;
    color: var(--color-text-01);
    font-size: var(--font-size-text-5);
    font-weight: 800;
  }

  &__description {
    margin: 0 0 10px;
    color: var(--color-text-02);
  }

  &__stats {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    margin: 8px 0 14px;
    padding: 0;
    color: var(--color-text-02);
    font-size: 13px;
    list-style: none;
  }

  &__stat {
    display: inline-flex;
    gap: 4px;
    align-items: center;
  }

  &__play.van-button {
    height: 52px;
    color: #fff;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0.06em;
    background: linear-gradient(90deg, var(--color-brand-02), #e8434f);
    border: 0;
    box-shadow: 0 8px 24px color-mix(in sRGB, var(--color-brand-02) 35%, transparent);

    .van-button__text {
      display: inline-flex;
      gap: 8px;
      align-items: center;
    }
  }

  &__actions {
    display: flex;
    gap: 8px;
    margin: 10px 0 4px;
  }

  &__action.van-button {
    color: var(--color-text-01);
    background: var(--color-ui-01);
    border: 1px solid var(--color-border-02);

    .van-button__text {
      display: inline-flex;
      gap: 6px;
      align-items: center;
    }
  }

  &__rules {
    margin: 12px 0;
    overflow: hidden;
    border: 1px solid var(--color-border-02);
    border-radius: calc(var(--border-radius-01) / 2);
  }

  &__creator {
    display: flex;
    gap: 10px;
    align-items: center;
    margin: 16px 0;

    small {
      color: var(--color-text-03);
    }
  }

  &__footer {
    margin: var(--base-m-y) var(--base-m-x);
    padding: var(--base-p-y) var(--base-p-x);
    background-color: var(--color-ui-01);
    border-radius: var(--border-radius-01);
  }
}
```
Vant `Collapse`/`CollapseItem` backgrounds may be white in dark mode — set `.van-cell` / `.van-collapse-item__content` backgrounds to `var(--color-ui-02)` and text to `var(--color-text-01)` inside `.play-intro__rules` if the screenshot shows it.

- [ ] **Step 4: Temporary mount for verification** — do not wire the scenes yet; render it ad hoc: in the headless script on `/quiz/test-trivia-admin-1`, after the page loads, mount via the console is not practical — instead temporarily (uncommitted) swap `HowToPlayDialog(intro …)` for `PlayIntroDialog(mode="creator" …)` in `CreatorModeGameScene`, take screenshots (light/dark, 420px/1280px; no-cover room `fotograftan-sehir-bil-t-ue-rkiye` and `test-trivia-admin-1`), confirm OYNA starts the game (start-countdown toast appears) and header ⓘ does nothing while the intro is open, then revert the scene file before committing. (Task 6 wires scenes for real.)

- [ ] **Step 5: Commit** — eslint/stylelint; `feat(intro): PlayIntroDialog with cover, stats, play, share/rate, rules and creator`

---

### Task 5: `PlayIntroDialog` — leaderboard and comments

**Files:**
- Modify: `components/Dialog/PlayIntroDialog/PlayIntroDialog.component.{vue,scss}`, `locales/tr.js`, `locales/en.js`

**Interfaces:**
- Consumes: Task 4 component (`isCreator`, `isQa`, `room`, `openReviews`, `state`), `creator/fetchScoreboard({ roomId, limit })` (commits `creator/scoreboard.list` items `{ id, roomId, results, user }`), `creator/SET_STATS_DIALOG_TAB` + `creator/SET_IS_OPEN_STATS_DIALOG` (Task 3), `daily/fetchLeaderboard({ period: 'daily', limit: 10 })` → getter `daily/leaderboard` `{ items }` (flat user objects with `results`), `comment/fetchComments({ roomId, page: 1 })` → `{ data: { items } }` (items transformed comments with `isDeleted`, `user`, `content`), `Leaderboard` component (`:scorers`), `PlayerAvatar`.

- [ ] **Step 1: i18n** — extend `playIntro`:

```js
  leaderboard: 'Puan Tablosu',
  fullScoreboard: 'Tüm skor tablosu',
  dailyLeaderboard: 'Günlük sıralama',
  noScores: 'Henüz kimse oynamadı. İlk sen ol!',
  commentsTitle: 'Yorumlar',
  allComments: 'Tüm yorumlar ({count})',
  noComments: 'Henüz yorum yok. İlk yorumu sen yap!'
```
English: Leaderboard, Full scoreboard, Daily ranking, 'Nobody has played yet. Be the first!', Comments, 'All comments ({count})', 'No comments yet. Be the first!'.

- [ ] **Step 2: Leaderboard section** — insert after `.play-intro__rules`:

```pug
    section.play-intro__leaderboard(v-if="isQa || mode === 'daily'")
      h3.play-intro__section-title
        AppIcon(name="tabler:crown" :width="18" :height="18")
        span {{ $t('playIntro.leaderboard') }}
      Loading(v-if="leaderboard.pending" color="var(--color-brand-02)" size="20")
      template(v-else-if="leaderboard.items.length")
        Leaderboard(:scorers="leaderboard.items")
        Button.play-intro__more(v-if="isQa" round size="small" @click="openFullScoreboard") {{ $t('playIntro.fullScoreboard') }}
        NuxtLink.play-intro__more-link(
          v-else
          :to="localePath({ name: 'DailyMode-Leaderboard-period', params: { period: $t('period.daily.slug') } })"
        ) {{ $t('playIntro.dailyLeaderboard') }}
      p.play-intro__empty(v-else) {{ $t('playIntro.noScores') }}
```
Script:

```js
const leaderboard = reactive({ items: [], pending: false })

const loadLeaderboard = async () => {
  leaderboard.pending = true

  if (isQa.value && room.value.roomId) {
    const { error } = await store.dispatch('creator/fetchScoreboard', { roomId: room.value.roomId, limit: 10 })
    // room-scores with a room filter come back ranked; Leaderboard wants flat users carrying their results
    leaderboard.items = error ? [] : (store.getters['creator/scoreboard'].list || []).slice(0, 10).map(item => ({ ...item.user, results: item.results }))
  } else if (props.mode === 'daily') {
    const { error } = await store.dispatch('daily/fetchLeaderboard', { period: 'daily', limit: 10 })
    leaderboard.items = error ? [] : (store.getters['daily/leaderboard']?.items || []).slice(0, 10)
  }

  leaderboard.pending = false
}

const openFullScoreboard = () => {
  store.commit('creator/SET_STATS_DIALOG_TAB', 'scoreboard')
  store.commit('creator/SET_IS_OPEN_STATS_DIALOG', true)
}
```
Confirm the action return shapes (`fetchScoreboard` returns `{ data, error }`; `daily/fetchLeaderboard` — read it) and the getter names (`creator/scoreboard` returns `state.scoreboard`). `Leaderboard` keys podium slots by `username`; skip items without `user`.

- [ ] **Step 3: Comments section** — insert after `.play-intro__creator`:

```pug
    section.play-intro__comments(v-if="isCreator")
      h3.play-intro__section-title
        AppIcon(name="tabler:message-2" :width="18" :height="18")
        span {{ $t('playIntro.commentsTitle') }}
      template(v-if="comments.items.length")
        .play-intro__comment(v-for="comment in comments.items" :key="comment.documentId")
          PlayerAvatar(:user="comment.user" :size="28")
          .play-intro__comment-body
            strong {{ comment.user.username }}
            p {{ comment.content }}
      p.play-intro__empty(v-else-if="!comments.pending") {{ $t('playIntro.noComments') }}
      Button.play-intro__more(round size="small" @click="openReviews") {{ $t('playIntro.allComments', { count: room.reviewCount || 0 }) }}
```
Script:

```js
const comments = reactive({ items: [], pending: false })

const loadComments = async () => {
  if (!room.value.id) return

  comments.pending = true
  const { data, error } = await store.dispatch('comment/fetchComments', { roomId: room.value.id, page: 1 })
  comments.items = error ? [] : (data?.items || []).filter(c => !c.isDeleted && c.user).slice(0, 3)
  comments.pending = false
}
```

- [ ] **Step 4: Load on open** — when the dialog opens (and when `room.value.id` becomes available while open), call `loadLeaderboard()` and (creator) `loadComments()`; never block OYNA on them:

```js
watch(
  () => [state.isOpen, room.value.id],
  ([isOpen]) => {
    if (!isOpen) return

    loadLeaderboard()
    if (isCreator.value) loadComments()
  },
  { immediate: true }
)
```
(Daily runs without a room id — the watch still fires on open.)

- [ ] **Step 5: SCSS** — add:

```scss
  &__section-title {
    display: flex;
    gap: 8px;
    align-items: center;
    margin: 18px 0 10px;
    color: var(--color-text-01);
    font-size: var(--font-size-text-8);
    font-weight: 700;
  }

  &__more.van-button,
  &__more-link {
    display: inline-flex;
    margin-top: 8px;
    color: var(--color-brand-02);
    background: transparent;
    border: 1px solid var(--color-brand-02);
  }

  &__more-link {
    padding: 4px 12px;
    border-radius: 999px;
  }

  &__comment {
    display: flex;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid var(--color-ui-03);

    p {
      display: -webkit-box;
      margin: 2px 0 0;
      overflow: hidden;
      color: var(--color-text-02);
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    strong {
      color: var(--color-brand-02);
    }
  }

  &__comment-body {
    flex: 1;
    min-width: 0;
  }

  &__empty {
    margin: 4px 0;
    color: var(--color-text-03);
    font-size: 13px;
  }
```

- [ ] **Step 6: Verify** (same temporary uncommitted scene swap as Task 4, plus a temporary `DailyModeGameScene` swap with `mode="daily"`):
  - GM-owned quiz with 57 scores: podium + 4–10 list; "Tüm skor tablosu" opens the stats dialog on the scoreboard tab (above the intro).
  - `test-trivia-admin-1`: comments preview shows ≤3 comments; "Tüm yorumlar (N)" and Puan Ver open the reviews dialog above the intro.
  - A room with no scores and no comments (pick/create one; e.g. a fresh room or temporarily point at an empty one) shows both empty states.
  - Daily: today's top 10 (or empty state) and the daily ranking link.
  - Force a failure (stop Strapi briefly): sections show empty/hidden, no error overlay; OYNA still starts the game.
  Revert the temporary scene swaps; commit only the dialog + locales.

- [ ] **Step 7: Commit** — `feat(intro): leaderboard top 10 and comments preview in the play intro`

---

### Task 6: Wire `PlayIntroDialog` into the scenes

**Files:**
- Modify: `components/Scene/CreatorModeGameScene/CreatorModeGameScene.component.vue` (line ~96), `components/Scene/ChoicesGameScene/ChoicesGameScene.component.vue` (~46), `components/Scene/FlashcardGameScene/FlashcardGameScene.component.vue` (~97), `components/Scene/DailyModeGameScene/DailyModeGameScene.component.vue` (~96), `components/Scene/UnlimitedModeGameScene/UnlimitedModeGameScene.component.vue` (~96)

**Interfaces:**
- Consumes: `PlayIntroDialog` (Tasks 4–5).

- [ ] **Step 1: Swap** — in each file replace the `HowToPlayDialog(intro …)` line keeping its `v-if`, `:isOpen` and `@closed` exactly, e.g.:

```pug
  PlayIntroDialog(v-if="!isGameOver" mode="creator" :isOpen="dialog.howToPlay.isOpen" @closed="startGame")
```
Modes: Creator/Choices/Flashcard → `creator`; Daily → `daily`; Unlimited → `unlimited`. Leave `WordblockModeScene` on `HowToPlayDialog(intro …)`.

- [ ] **Step 2: Verify** (headless, light + dark, 420px + 1280px):
  - Direct load of `/quiz/test-trivia-admin-1`, `/quiz/fotograftan-sehir-bil-t-ue-rkiye`, a Choices and a Flashcards room (find via SQL `SELECT room_id, quiz_type FROM rooms WHERE quiz_type IN ('choices','flashcards') AND locale='tr-TR' AND is_public=1 LIMIT 2` on the local XAMPP DB: `/Applications/XAMPP/xamppfiles/bin/mysql -u root -h 127.0.0.1 parolla`), `/gunluk`, `/limitsiz`: the intro shows; OYNA starts the game.
  - Header ⓘ while the intro is open: nothing stacks; after the game starts ⓘ opens the titled HowToPlayDialog.
  - Notification deep link: open `/quiz/test-trivia-admin-1?comment=<a root comment documentId from the API>` → reviews dialog first, intro hidden; close it → intro appears.
  - `/kelimeblok` intro unchanged.

- [ ] **Step 3: Commit** — `feat(intro): play intro replaces the how-to-play intro in creator, daily and unlimited`

---

## Final verification

`yarn lint:eslint && yarn lint:stylelint`; full headless pass of Task 6 Step 2; QuizCard list unchanged.
