# Play Intro Dialog — Design

Date: 2026-10-18 · Repo: `parolla` (frontend only) · Branch: `feat/play-intro-dialog` (from `feat/comments-notifications`)

## Goal

Replace the pre-game "how to play" intro with a richer, quiz-page-like **PlayIntroDialog** (reference: a quiz landing card with cover, title, stats, big play button, leaderboard, creator, comments). It covers the game scene like today's intro, and pressing **OYNA** starts the game.

## Decisions (agreed with user)

| Topic | Decision |
|---|---|
| Structure | New `components/Dialog/PlayIntroDialog`. `HowToPlayDialog` stays for the header ⓘ button (with title) and Wordblock's intro. |
| Where | Creator room (QA, Choices, Flashcards), Daily, Unlimited. Wordblock unchanged. |
| Layout | Scene-covering dialog (`.dialog--scene`, no backdrop, `dialog-scene-bounce`), no title, no Vant footer buttons. Copyright footer at the bottom. |
| Rules | Collapsible "Nasıl oynanır?" section rendering the existing per-mode how-to-play content. |
| Actions | Big OYNA button + small **Paylaş** and **Puan Ver** buttons. |
| Comments | Preview of the latest 3 root comments + "Tüm yorumlar (N)" button. |
| Leaderboard | Existing `Leaderboard` component: top 3 podium + 4–10 list. Creator QA: room scoreboard top 10 + "Tüm skor tablosu" opening the stats dialog on its scoreboard tab. Daily: today's top 10 + link to the daily leaderboard page. Choices/Flashcards/Unlimited: no leaderboard (no scores recorded). |
| Out of scope | Save/bookmark, reactions, contributors, report from the intro, Wordblock intro. Backend changes. |

## Units

### `QuizCover` (new, `components/Card/QuizCover`)
Extracted from `QuizCard` so both use one implementation.
- Props: `room` (Object, optional), `seed` (String, optional; palette key when there's no room, e.g. `'daily'`), `label` (String, optional; large overlay text such as "GÜNLÜK"), `sublabel` (String, optional).
- Cover photo (`room.coverPhoto.url`) → `img` with `object-fit: cover` in a 16:9 box. Otherwise the procedural placeholder: `PLACEHOLDER_PALETTES` + `hashSeed(room.roomId || room.documentId || room.title || seed)` → `--quiz-card-from/to/tint`, radial tint over a 135° gradient, 28px grid with mask, bottom glow, same light/dark filter as today.
- Slot `default` for overlay content (QuizCard puts its title and top badges there).
- `QuizCard` renders `QuizCover` for its media zone; its look and hover/focus effects stay identical.

### `HowToPlayContent` (new, `components/View/HowToPlayContent`)
The per-mode `v-if` switch currently inside `HowToPlayDialog` (Daily, Unlimited, Creator QA, Choices, Flashcards, Tour, Wordblock content components). `HowToPlayDialog` uses it; so does the intro's collapsible section.

### Stats dialog opened on a tab
- `store/creator`: `state.dialog.stats.tab` (default `null`); `SET_IS_OPEN_STATS_DIALOG` keeps its boolean payload; new `SET_STATS_DIALOG_TAB(tab)`.
- `CreatorModeStatsDialog`: when it opens and `dialog.stats.tab` is set, it switches `activeTab` to it (forcing the scoreboard fetch even if the tab was already active), then clears the store tab.

### `useRoomShare` (new composable)
`openRoomSharer` logic moved out of `MenuDialog` (clipboard + `navigator.share`, same toast) so the intro's Paylaş button and the menu share one implementation.

### `PlayIntroDialog`
- Props: `isOpen` (Boolean), `mode` (`'creator' | 'daily' | 'unlimited'`). Emits `closed` (the scene starts the game on it, as with the old intro).
- Mirrors its open state to `app/SET_IS_OPEN_INTRO_HOW_TO_PLAY` (same guard the header ⓘ button already checks), cleared on unmount.
- Sections, top to bottom:
  1. **Hero** — `QuizCover` (creator: the room; daily: `seed='daily'`, `label` "GÜNLÜK", `sublabel` today's date; unlimited: `seed='unlimited'`, `label` "LİMİTSİZ").
  2. **Title + description** (creator only).
  3. **Stats row** (icons + values, wraps): creator → ★ rating (`(N)` raters), views, question/choice/flashcard count by quiz type, comments, time limit, created date; daily → letter count (alphabet length) and 5-minute limit; unlimited → 5-minute limit.
  4. **OYNA** — full-width brand-gradient button; closes the dialog (→ `closed` → game starts).
  5. **Paylaş / Puan Ver** (creator only) — Paylaş via `useRoomShare`; Puan Ver opens the intro's own `RoomReviewDialog` (rating sits at its top).
  6. **Nasıl oynanır?** — Vant `Collapse` item, closed by default, body `HowToPlayContent`.
  7. **Puan Tablosu** — creator QA: `creator/fetchScoreboard({ roomId, limit: 10 })`, items mapped `{ ...item.user, results: item.results }` into `Leaderboard`; "Tüm skor tablosu" commits `SET_STATS_DIALOG_TAB('scoreboard')` + `SET_IS_OPEN_STATS_DIALOG(true)`. Daily: `daily/fetchLeaderboard({ period: 'daily', limit: 10 })` → `daily/leaderboard.items`; link to `DailyMode-Leaderboard-period` (period slug `period.daily.slug`). Empty state when there are no scores.
  8. **Oluşturan** (creator) — `PlayerAvatar` + username, opens PlayerDialog; anonymous room → "Anonim".
  9. **Yorumlar** (creator) — `comment/fetchComments({ roomId, page: 1 })`, first 3 roots (avatar, username, 2-line clamp; deleted ones skipped); "Tüm yorumlar (N)" opens the intro's `RoomReviewDialog`; empty state invites the first comment.
  10. **Ad** — the existing `AppAd` slots (desktop/mobile) kept from the old intro.
  11. **Footer** — copyright, at the bottom (scene-dialog column rule).
- Data loads when the dialog opens; each section handles its own loading/empty state and failures (a failed section just hides its list — the play button never waits on data).

### Scenes
`CreatorModeGameScene`, `ChoicesGameScene`, `FlashcardGameScene` (mode `creator`), `DailyModeGameScene` (`daily`), `UnlimitedModeGameScene` (`unlimited`) render `PlayIntroDialog(:isOpen="dialog.howToPlay.isOpen" @closed="startGame")` instead of `HowToPlayDialog(intro …)`. `useGameScene`'s hold for `?comment` / `?rating` deep links keeps working unchanged (same `dialog.howToPlay.isOpen`).

## Styling
Parolla tokens only (`--color-brand-02`, `--color-ui-*`, `--color-text-*`, `--border-radius-01`), dark-mode safe. Play button: brand gradient (`--color-brand-02` → a deeper red), large, rounded. Stats/sections spaced like the reference; content padding matches the scene dialog.

## i18n
New `playIntro.*` keys in `locales/tr.js` and `locales/en.js` (play, share, rate, howToPlay, leaderboard, fullScoreboard, dailyLeaderboard, creator, anon, comments, allComments, noComments, noScores, daily, unlimited, timeLimit, letters, questions, choices, flashcards, views).

## Testing
No test runner. Verify with `yarn lint:eslint` / `yarn lint:stylelint` and headless Chrome screenshots (light + dark, 420px + 1280px): creator room with and without cover, anonymous room, Choices/Flashcards room (no leaderboard), Daily, Unlimited; OYNA starts the game (countdown toast appears); header ⓘ doesn't stack while the intro is open; "Tüm skor tablosu" opens the stats dialog on the scoreboard tab; Puan Ver / Tüm yorumlar open the reviews dialog; notification deep link (`?comment`) still opens reviews first and holds the intro; QuizCard looks unchanged.
