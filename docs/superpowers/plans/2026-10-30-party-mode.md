# Party Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Real-time party rooms for creator QA and Bu mu O mu quizzes: create from the quiz intro, join by code/link/QR (guests allowed), round-based play over the ws server, presentation mode and host remote, nothing persisted.

**Architecture:** A new in-memory `party` channel in `parolla-ws` (template: `src/channels/draw`) owns rooms, queue, timers, answer checking and scoring. The web app gets a `store/party` module fed by a `usePartySocket` composable, party pages, and a "party" path through the **existing** `CreatorModeGameScene` / `ChoicesGameScene` so their fit-text and layout are reused.

**Tech Stack:** Node.js + `ws` (no build, CommonJS); Nuxt 2 / Vue 2, `@nuxtjs/composition-api`, Pug, SCSS, Vant 2, Vuex; new web dependency `qrcode` (QR data URLs).

**Spec:** `parolla/docs/superpowers/specs/2026-10-30-party-mode-design.md` — executors read it; this plan argues from it.

## Global Constraints

- Branches: work on `feat/party-mode` in **both** `parolla-ws` and `parolla`, created from `main` inside the existing repo folders. **No git worktrees.** Never push or deploy (user deploys manually).
- Never write the reference product's name anywhere: code, comments, i18n, commit messages, docs.
- Nothing is persisted: no Strapi writes, no `postStats`, no `economy/*` dispatches, no `increaseDailyPlayingCount`, no `countRoomView`, no duel stats, no localStorage game stats from party play.
- Quiz types: QA (`quizType` qa: text + trivia answers) and Choices. Flashcard never gets party.
- Max 10 players, fixed. Round duration chips: 15/30/45/60/90/120 s, default 30. Auto mode delay: 5 s.
- Scoring: correct = `round(500 + 500 * remainingMs / roundMs)` (1000 instant → 500 at deadline), wrong/none = 0.
- Answer handling = solo creator rules: comma-separated alternatives, `formatAnswer` (tr lowercase, trim, remove whitespace, `encodeEnglish` fold), letter rule (non-trivia answer must start with the question's letter → retry, not consumed), trivia exact via `formatTriviaAnswer`. `pas`/`bitir` are ordinary answers in party.
- Choices: every choice is played (no cap). Tie or zero votes → champion stays.
- Leaderboard visibility: `always` | `end` | `never`. `never` → each player only ever receives their own score/correct count (also final).
- Host: only logged-in users create rooms. Host leaves → longest-present **logged-in** player becomes host; none → room closes with reason `no_host` (client shows blocking dialog, single "Quizlere dön").
- Guests: identity from `store/draw/guest` (shared with Draw). Logged-in → no dialog.
- Rooms reachable only by code/link. No public listing.
- Room auto-locks while a game runs; reconnecting players (same id) may always re-enter.
- No ads on party screens.
- Web code style: Pug templates, Composition API, component folder pattern (`X.component.vue` + `X.component.scss`), no semicolons, colours only via `--color-*` tokens (light + dark), Vant 2 components. Mobile-first single column; desktop ≥ 992px three columns (main / players+code / chat).
- All user-facing copy in both `locales/tr.js` and `locales/en.js` under a `party` key.
- Routes (both locales same path, like GeoGuess): `/party` (entry: code input), `/party/:code` (room), `/party/:code/remote` (host remote).

## Shared protocol (ws ⇄ web)

All frames are `{ type, ...fields }`. Client → server:

| type | fields | who |
|---|---|---|
| `party_create` | `roomId` (quiz slug/id as used by `rooms/:id`), `locale` | logged-in |
| `party_join` | `code`, `password?` | anyone |
| `party_leave` | — | member |
| `party_kick` | `playerId` | host |
| `party_settings` | `patch` ⊂ `{ roundDurationSec, autoAdvance, presentation, leaderboard, chat, locked, password }` | host / remote (autoAdvance only) |
| `party_queue_add` | `roomId`, `locale` | host |
| `party_queue_move` | `index`, `dir` (−1 / 1) | host |
| `party_queue_remove` | `index` | host |
| `party_queue_play` | `index` (move to front and start) | host |
| `party_start` / `party_next` / `party_cancel` | — | host / remote |
| `party_answer` | `text` (QA text, or the trivia option text) | player |
| `party_vote` | `side` (`left`/`right`) | player |
| `party_chat` | `message` (≤ 300 chars, lobby only) | member |
| `party_emoji` | `emoji` (one of `PARTY_EMOJIS`) | member |
| `party_remote_join` | `code` | remote socket |

Server → client:

| type | fields |
|---|---|
| `party_room_state` | `room`: `{ code, hostId, hostName, state ('lobby'│'playing'│'final'), settings (no password; `hasPassword`), players: [{ id, name, diceBear, profilePhoto, avatarSource, isGuest, isHost, connected, joinedAt }], capacity: 10, queue: [{ roomId, title, quizType, coverPhoto, questionCount, choiceCount }], game: null │ { quizType, roomId, title, total, index, phase ('round'│'result'│'final'), presenterId } }` |
| `party_round_start` | `index`, `total`, `durationMs`, `remainingMs`, and `question: { question, questionType, answerType, media, mediaNote, triviaOptions, letter }` (QA, **never the answer**) or `duel: { champion, challenger }` (Choices; choice objects as `room.choices`) |
| `party_answer_ack` | `text` |
| `party_answer_retry` | `reason: 'letter'`, `letter` |
| `party_progress` | `answered`, `total` (QA) |
| `party_votes` | `left`, `right`, `voters`, `total`, `mine` (per-recipient) |
| `party_round_end` | QA: `correctAnswer`, `me: { correct, points, answer, score, correctCount, rank }`, `leaderboard: [{ playerId, name, avatar fields, score, correctCount, rankDelta }] │ null`, `nextInMs │ null` · Choices: `winnerSide`, `winner`, `left`, `right`, `mineWon │ null`, `nextInMs │ null` |
| `party_final` | QA: `leaderboard │ null`, `me` · Choices: `champion`, `eliminated` (in elimination order) · plus `lobbyInMs` (8000) |
| `party_cancelled` | `lobbyInMs` (3000) |
| `party_closed` | `reason` (`no_host`, `empty`, `kicked`) |
| `party_error` | `code`, `message` |
| `party_chat` | `playerId`, `playerName`, `isGuest`, `message`, `timestamp`, `isSystem?` |
| `party_emoji` | `playerId`, `emoji` |

Error codes the web must handle: `room_not_found`, `bad_password`, `room_full`, `room_locked`, `login_required`, `already_in_room`, `quiz_unsupported` (flashcard/missing), `not_host`.

## Review Focus

1. **Reconnect mid-round** (phone locks, WebView backgrounded): the player must come back to the same round with their score and remaining time, not a fresh lobby → ws Task 5 test `reconnect keeps score and gets round snapshot`.
2. **Host with two tabs / remote + main tab on the same account**: the remote socket must not terminate the host's main socket (the global `gameState.players` map is keyed by user id) → ws Task 3 test `remote id does not collide`.
3. **Answer typed with Turkish characters / spaces / casing** ("Resident Evil 4" vs "residentevil4", "İstanbul" vs "istanbul") must match exactly as solo → ws Task 1 assertions.
4. **Everyone leaves during a running game, or the quiz in the queue was deleted/hidden** → room closes cleanly with timers cleared; queue add/start of a missing quiz returns `quiz_unsupported` and the game doesn't start → ws Task 4/5 tests.
5. **Leaving the party page while the scene is mounted** must not leave creator store data that breaks the next solo creator game (the scene reads the `creator` store) → web Task 11 step "reset creator state on leave", checked by opening a solo quiz after a party.

---

## parolla-ws (branch `feat/party-mode`)

Self-checks are plain Node scripts with `assert` under `scripts/manual/` (repo has no test runner; follow `scripts/manual/vote-kick-check.js` style). Run with `node scripts/manual/<file>`; pass = exits 0 printing `ok`.

### Task 1: Party pure logic (answer check, scoring, duel)

**Files:**
- Create: `src/channels/party/answerCheck.js`, `src/channels/party/scoring.js`, `src/channels/party/duel.js`
- Test: `scripts/manual/party-logic-check.js`

**Interfaces — Produces:**
- `formatAnswer(s: string): string` — `toLocaleLowerCase('tr')`, trim, remove all whitespace, then the web `encodeEnglish` fold (port `parolla/composables/useFormatter.js` `encodeEnglish` exactly, incl. space→`-` which is moot after whitespace removal).
- `formatTriviaAnswer(s): string` — tr lowercase, trim, remove whitespace, **no** fold.
- `checkAnswer(question: { answer, answerType, letter }, raw: string): { status: 'correct'│'wrong'│'retry', letter? }` — trivia: exact `formatTriviaAnswer` vs `answer`; text: retry if `!formatAnswer(raw).startsWith(formatAnswer(letter))`, else correct if any comma-split alternative equals after `formatAnswer`.
- `speedScore(remainingMs: number, roundMs: number): number` — per Global Constraints, clamped to [500, 1000].
- `createDuel(choices: Choice[]): DuelState` — same order as `useChoices.initGame` (`[...choices]`, first two shifted as champion/challenger); `resolveDuel(state, { left, right }): { winnerSide, winner, done }` — left = champion, right = challenger; tie/zero → champion; winner becomes champion, next queue item becomes challenger, `done` when queue empty; tracks `eliminated` array.

- [ ] **Step 1: Write `scripts/manual/party-logic-check.js`** asserting:
  - `checkAnswer({ answer: 'Resident Evil 4,RE4', answerType: 'textField', letter: 'R' }, 'resident evil 4').status === 'correct'`; `'re4'` → correct; `'xbox'` → `retry` with `letter: 'R'`; `'rambo'` → `wrong`.
  - `checkAnswer({ answer: 'İstanbul', answerType: 'textField', letter: 'İ' }, 'istanbul').status === 'correct'`.
  - trivia: `{ answer: 'mahsul', answerType: 'trivia' }`, `'Mahsul'` → correct, `'mahsül'` → wrong; trivia never returns retry.
  - `'pas'` with letter `P` and answer `'Paris'` → `wrong` (not special).
  - `speedScore(30000, 30000) === 1000`, `speedScore(0, 30000) === 500`, `speedScore(15000, 30000) === 750`, `speedScore(-5, 30000) === 500`.
  - duel over `[a,b,c]`: votes `{left:0,right:0}` → winner `a`; then `{left:1,right:2}` → winner `c`, `done === true`, `eliminated` = `[b, a]`.
  - Use the real enum values: read `parolla/enums/quiz.enum.js` for `answerTypeEnum` strings and use them in both code and test.
- [ ] **Step 2:** `node scripts/manual/party-logic-check.js` → fails (modules missing).
- [ ] **Step 3:** Implement the three modules.
- [ ] **Step 4:** Re-run → prints `ok`.
- [ ] **Step 5:** Commit `feat(party): answer check, speed scoring and duel logic`.

### Task 2: Party room manager

**Files:**
- Create: `src/channels/party/state.js` (rooms `Map<code, Room>`, `playerRoom Map<playerId, code>`, `getRoom(code)`), `src/channels/party/roomManager.js`, `src/channels/party/roomDto.js`
- Reuse: `src/channels/draw/codeGen.js` — but party codes are **6 digits** (`000000`–`999999`, shown as `701 518`); add `uniqueNumericCode(takenMap)` in a party-local `codeGen.js` rather than changing draw's.
- Test: `scripts/manual/party-room-check.js`

**Interfaces — Produces:**
- `makeRoom({ host, quiz }): Room` — `settings` defaults `{ roundDurationSec: 30, autoAdvance: true, presentation: false, leaderboard: 'always', chat: true, locked: false, password: null }`, `queue: [quiz]`, `state: 'lobby'`, `players: Map`, `remotes: Set<ws>`, `chatHistory: []`.
- `addPlayer(room, player, ws): { ok, error?, rejoined }` — errors `room_full` (10), `room_locked` (settings.locked or state ≠ lobby) unless the id is already a member (then reattach ws, `connected = true`, `rejoined: true`).
- `markDisconnected(room, playerId)` / `removePlayer(room, playerId): { hostChanged: boolean, noHostLeft: boolean }` — host leaves → earliest `joinedAt` player with `!isGuest`; none (but players remain) → `noHostLeft`.
- `applySettings(room, patch, { fromRemote }): Settings` — validates: duration ∈ {15,30,45,60,90,120}, leaderboard ∈ {always,end,never}, booleans, password string ≤ 32 or null; remote may only change `autoAdvance`; ignored while `state !== 'lobby'` except `autoAdvance`.
- `queueAdd/queueMove/queueRemove/queueToFront(room, …)` — max 20 items; index validation.
- `toRoomDto(room): object` — exactly the `party_room_state.room` shape in the protocol table.
- `clearRoomTimers(room)`, `closeRoom(room, reason, broadcast)`.

- [ ] **Step 1:** Test asserting: capacity 10 (11th → `room_full`); locked rejects new id but accepts existing id with `rejoined: true`; host migration skips guests (`isGuest: true`) and picks earliest logged-in; only guests left → `noHostLeft: true`; `applySettings` rejects `roundDurationSec: 20` (unchanged) and remote patch `{ presentation: true }` ignored; queue move/remove bounds; `toRoomDto` has `hasPassword` and no `password` key.
- [ ] **Step 2:** run → fail. **Step 3:** implement. **Step 4:** run → `ok`.
- [ ] **Step 5:** Commit `feat(party): room manager, queue and settings`.

### Task 3: Connection wiring (party channel, guests, remote)

**Files:**
- Modify: `src/handlers/connectionHandler.js` (channel parse ~L230: accept `party`; guest path ~L258: allow `channelName === 'party'`; auth path: when `channel=party` and `query.remote === '1'`, require a valid token and register the player under id `remote:<userId>` with `player.remoteOf = userId`, so the existing "terminate previous socket of same id" logic never hits the host's main socket)
- Modify: `src/server.js` (`require('./channels/party')`), `src/constants/messageTypes.js` (all `PARTY_*` from the protocol table)
- Create: `src/channels/party/index.js` (`register('party', { onConnect, onMessage, onDisconnect })`, routes `party_*` to the handler from Task 6; stub handler acceptable until Task 6)
- Test: `scripts/manual/party-connect-smoke.js` (spawns nothing; connects to a locally running server `WS_URL=ws://localhost:1881` — start it with `npm run dev` in another shell)

**Interfaces — Produces:** guest player ids `guest_<uuid>`, remote ids `remote:<userId>` with `remoteOf`; `ws._channel === 'party'`.

- [ ] **Step 1:** Smoke script: guest connects with `channel=party&guestId=<uuid>&guestName=test1&guestAvatarSeed=x` → receives `connected`; guest with `remote=1` → closed/`party_error login_required`.
- [ ] **Step 2:** Run against server → fails before wiring. **Step 3:** implement. **Step 4:** run → `ok`; also run `node scripts/manual/draw-smoke.js` → still passes (draw untouched).
- [ ] **Step 5:** Commit `feat(party): connection wiring for party channel and host remote`.

### Task 4: Quiz loader

**Files:** Create `src/channels/party/quizService.js`. Test: `scripts/manual/party-quiz-check.js`.

**Interfaces — Produces:** `loadQuiz(roomId: string, locale: string): Promise<Quiz | null>` → `GET ${API_URL}/rooms/${encodeURIComponent(roomId)}?locale=…` (same request the web's `creator/fetchRoom` makes; axios + `httpsAgent` like `draw/wordService.js`). Returns `{ roomId, title, quizType, coverPhoto, questionCount, choiceCount, questions: [{ question, questionType, answerType, media, mediaNote, triviaOptions, letter, answer }], choices }` where `letter = room.alphabet[i]`, `questions` from `qaItems`. Returns `null` for flashcard, not visible, 404 or network error. Cache per `roomId|locale` for 5 minutes. `toPublicQuestion(q)` strips `answer`.

- [ ] **Step 1:** Check script hits the real API for one known public QA quiz and one choices quiz (pick ids from `https://strapi.parolla.app/api/rooms?pagination[pageSize]=5`), asserts shape, that `toPublicQuestion` has no `answer`, and that a flashcard quiz returns `null`.
- [ ] **Step 2–4:** fail → implement → `ok`. Read the actual `qaItems` field names from the response before coding.
- [ ] **Step 5:** Commit `feat(party): load quizzes from strapi read-only`.

### Task 5: Game loop (QA + Choices, results, cancel, reconnect snapshot)

**Files:** Create `src/channels/party/gameLoop.js`. Test: `scripts/manual/party-loop-check.js` (drives the loop in-process with fake broadcast/sendTo collectors and short durations; inject `now()` / timers via a small `clock` param so the test runs in < 2 s).

**Interfaces — Consumes:** Task 1, 2, 4. **Produces:** `startGame(room, io)`, `submitAnswer(room, playerId, text, io)`, `submitVote(room, playerId, side, io)`, `nextRound(room, io)`, `cancelGame(room, io)`, `snapshotFor(room, playerId): frames[]` where `io = { broadcast(room, msg), sendTo(room, playerId, msg), clock? }`.

Behaviour (spec "QA / Trivia round", "Bu mu O mu round", "Presentation mode"):
- Answering set = connected players except the presenter (`settings.presentation` → host).
- QA round ends when every answering player has an accepted answer or at deadline. Retry doesn't count. Second answer after acceptance ignored.
- `party_round_end` per player (`sendTo`) so `me` is personal; `leaderboard` included per visibility; `nextInMs = 5000` when `autoAdvance`, else `null` (waits for `party_next`).
- After last round → `party_final` per player, state `final`, then after `lobbyInMs` → back to `lobby`, finished quiz shifted off the queue, broadcast room state.
- Cancel → clear timers, `party_cancelled`, after 3 s lobby; quiz stays in queue.
- Choices: live `party_votes` on every vote (per-recipient `mine`); vote change allowed until deadline; ends early only at deadline (votes can change).

- [ ] **Step 1:** Test: 2 players + presenter-off QA 2 questions: A answers correct fast, B wrong → A points ≥ 500, B 0; leaderboard `never` → round_end to B has `leaderboard: null`; retry for wrong letter doesn't end the round; round ends early when both accepted; final then lobby with queue shifted; cancel keeps queue; Choices 3 choices tie → champion stays; `snapshotFor` mid-round returns a `party_round_start` with reduced `remainingMs` and the player's score (Review Focus 1); presenter excluded from answering set and leaderboard.
- [ ] **Step 2–4:** fail → implement → `ok`.
- [ ] **Step 5:** Commit `feat(party): round loop, results and cancel`.

### Task 6: Message handler, disconnect grace, chat

**Files:** Create `src/channels/party/messageHandler.js`; modify `src/channels/party/index.js`. Test: `scripts/manual/party-smoke.js` (end-to-end over real sockets against `npm run dev`, 2 guests + it needs one logged-in token: read `PARTY_SMOKE_TOKEN` env; skip host-only parts with a printed notice when absent).

**Interfaces — Consumes:** Tasks 2, 4, 5. **Produces:** `handlePartyMessage(ws, player, data)`; every protocol row implemented with the permission column enforced (`not_host` error otherwise).

- `party_create`: guest → `login_required`; `loadQuiz` null → `quiz_unsupported`; already in a room → `already_in_room`.
- Disconnect: `markDisconnected`, broadcast state; 30 s grace timer → `removePlayer`; host change → system chat `"<name> artık kurucu"` + state; `noHostLeft` → `party_closed { reason: 'no_host' }` and close; room empty → close.
- Remote: `party_remote_join` only if `player.remoteOf === room.hostId`; add ws to `room.remotes`; remotes receive every broadcast of room state / game phase (not personal frames).
- Chat: only when `settings.chat`; lobby only (`state === 'lobby'`); history 100; emoji allowed in any state when chat on; reuse `src/utils/chatRateLimit.js`. `PARTY_EMOJIS = ['👏','😂','🔥','😮','😢','❤️']`.
- Kick: `party_closed { reason: 'kicked' }` to target, then remove.

- [ ] **Step 1:** Smoke: join by code, wrong password, full room, chat broadcast, guest create rejected, kick, leave-and-rejoin within grace keeps score.
- [ ] **Step 2–4:** fail → implement → `ok`.
- [ ] **Step 5:** Commit `feat(party): message handling, disconnect grace and chat`; then update `parolla-ws/CLAUDE.md` with a short "party channel" section and commit `docs: party channel`.

---

## parolla (branch `feat/party-mode`)

First step of Task 7: `git checkout -b feat/party-mode` and commit the already-written spec, this plan and the `.gitignore` `.superpowers/` line (`docs: party mode spec and plan`).

Verification for every web task: `npx eslint <changed js/vue files>` and `npx stylelint <changed scss>` clean, plus `yarn dev` compiles without errors. UI tasks also: open the page at 375 px and 1280 px in light and dark (`html.dark`/theme toggle the app already uses) and check against the spec section named in the task. The local ws URL is `WS_URL` in `.env` (`ws://localhost:1881` for local ws).

### Task 7: Party plumbing (enum, store, socket, routes, i18n skeleton)

**Files:**
- Modify: `enums/wsType.enum.js` (all `PARTY_*`), `nuxt.config.js` i18n pages (`Party/index` → `/party`, `Party/_code/index` → `/party/:code`, `Party/_code/remote` → `/party/:code/remote`, same path for tr/en), `locales/tr.js`, `locales/en.js` (`party: {}` root), `package.json` (`qrcode`)
- Create: `store/party/{state,getters,mutations,actions}.js`, `composables/usePartySocket.js`, empty pages `pages/Party/index.vue`, `pages/Party/_code/index.vue`, `pages/Party/_code/remote.vue`

**Interfaces — Produces:**
- `usePartySocket({ remote = false } = {})` → `{ status, reconnectStatus, open, close, send(type, payload) }` — same lifecycle as `useDrawSocket` (module singleton, queue until `connected`, auto-reconnect via `helpers/ws-reconnect`) but `channel: 'party'` (+ `remote: '1'` when remote), guest params from `store/draw/guest`, dispatches to `party/handleMessage`. Do **not** modify `useDrawSocket`. After reconnect, re-send `party_join` (or `party_remote_join`) for the current code automatically.
- `store/party` state: `myId, status, room (party_room_state.room), round (party_round_start payload + receivedAt), answered ({answered,total}), votes, myAnswer, retry, roundEnd, final, cancelled, closedReason, chat [], emojis [], error`. Getters: `isHost, me, players, queue, settings, isPresenter, game`. `handleMessage` maps each server type to one mutation; `party_error` also toasts via `helpers/toast` with `party.errors.<code>`.

- [ ] Steps: add files → `yarn add qrcode` → lint → `yarn dev` boots, visiting `/party` renders the empty page → commit `feat(party): store, socket and routes`.

### Task 8: Entry points (intro button, entry page, join + guest + login gate)

**Files:**
- Modify: `components/Dialog/PlayIntroDialog/PlayIntroDialog.component.{vue,scss}` — Party card under the play button, only `mode === 'creator'` and quiz type QA or Choices (use the enums in `enums/quiz.enum.js`): icon tile, title "Party kur", sub "Bir oda kur ve eş zamanlı olarak arkadaşlarınla oyna", chevron; navigates to `/party/new?quiz=<roomId>`-style setup (see below).
- Fill `pages/Party/index.vue`: code input (6 digits, auto-format `701 518`), "Katıl" → `/party/:code`.
- Fill `pages/Party/_code/index.vue` join flow: `code === 'new'` + `?quiz=` → logged-in: `party_create` then `router.replace` to the real code; logged-out: render the lobby settings card disabled with the login notice (exact copy: "Parti odası oluşturmak için giriş yapman gerekiyor. Arkadaşların hesapları olmadan da odana katılabilir." + "GİRİŞ YAP" opening the app's existing login dialog/route) — danger-tinted card per the user's screenshot. Real code: logged-in → `party_join`; guest → `CreateGuestDrawerDialog` first (reuse as is, title overridden via a `title` prop if needed), then connect + join. `bad_password` → reuse `components/Draw/EnterPasswordDialog`. Other errors → toast + back to `/party`.

- [ ] Steps: implement → lint → manual: logged-out intro → Party kur shows login gate; logged-in creates room and URL becomes `/party/123456`; second browser as guest joins via link → commit `feat(party): intro entry, join and guest flow`.

### Task 9: Lobby

**Files:** Create `components/Party/` folder components (one responsibility each): `PartyHeader`, `PartyCodeCard` (QR via `qrcode.toDataURL`, copy, share via existing share helper/`postToNative('sharer')` in WebView, tap → large QR dialog), `PartyNextGameCard` (start button for host; "Kurucu bekleniyor" for players; presentation notice), `PartyPlayerList` (n/10, crown "Kurucu", "Sunuyor" badge, "Sen", empty slots, host kick via action sheet), `PartyQueue` (order, up/down, delete, "Oyna", "Oyun ekle" opener; read-only for players), `PartySettings` (Odayı kilitle, Sohbet, Tur süresi chips, collapsible Gelişmiş: Oto mod, Sunum modu, Liderlik tablosu chips; Şifre ile koru; pills 10 kişilik/Şifreli), `PartyChat` (mobile: one-line bar → bottom sheet; desktop: right column; empty state "Henüz mesaj yok · Herkes toplanırken bir merhaba de."). Modify `pages/Party/_code/index.vue` to lay them out (mobile single column with sticky bottom start/chat dock; ≥ 992 px three columns).

Base the visual style on the approved mockup (`.superpowers/brainstorm/*/content/party-flow.html`, screens 2–3, local only) translated to tokens: brand `--color-brand-02`, surfaces `--color-ui-01/02/03`, borders `--color-border-0x`, text `--color-text-0x`.

- [ ] Steps: implement → lint → manual 375/1280 light/dark, host vs player view, settings round-trip between two browsers, host leave → crown + "<name>'in odası" title update reactively, guests-only left → blocking dialog with "Quizlere dön" → commit `feat(party): lobby`.

### Task 10: "Oyun ekle" modal

**Files:** Create `components/Party/PartyAddGameDialog`. Tabs Soru-Cevap / Bu mu O mu, search box ("Soru-Cevap quizlerinde ara…"), trending grid using the existing quiz card component and `creator/fetchRooms` (type filter + keyword, sort `byViewCount` for trending); infinite/load-more as `RoomList` does. Pick → `party_queue_add`; header pill "Kuyrukta N oyun".

- [ ] Steps: implement → lint → manual add both types, search works, flashcards never listed → commit `feat(party): add-to-queue dialog`.

### Task 11: QA game in the existing creator scene

**Files:**
- Modify: `composables/useGameMode.js` (party room route → `gameModeKeyEnum.CREATOR`, so creator-only fit-text branches run), `composables/useGameScene.js` (new option `party: { submit(text) }`): when set — `handleAnswer` skips `pas`/`bitir`, keeps the letter check, calls `party.submit(raw)` instead of local correctness and does not advance; `endGame`, `startGame` stats/economy/localStorage/interstitial and `handleBeforeUnload` are no-ops; countdown is not the Vant global timer.
- Modify: `components/Scene/CreatorModeGameScene/CreatorModeGameScene.component.{vue,scss}` — prop `party` (Boolean): hide alphabet strip, pass buttons (show the send button even with empty field), stats row, `PlayIntroDialog`, stats dialog, interstitial; countdown chip shows party round progress `index+1/total` and a per-round ring fed by `round.remainingMs`; "2/3 cevapladı" chip; after acceptance the input locks with "Cevabın gönderildi · diğerleri bekleniyor"; retry → existing `handleNotStartsWithActiveChar` toast.
- Create: `components/Party/PartyRoundResult` (DOĞRU!/YANLIŞ! card + correct answer + `+points`, leaderboard top list with rank delta and bars, "Sıradaki soru" progress when `nextInMs`), `components/Party/PartyHostSheet` (Ayarlar sheet: Oto ilerleme switch, "Sonraki tur", "Oyunu iptal et").
- Modify `pages/Party/_code/index.vue`: when `game.quizType` is QA, feed the **creator** store (`SET_ROOM` with quiz meta, `SET_QUESTIONS` with a `total`-length array whose current index holds `round.question`, `SET_ALPHABET_ITEMS` from letters received so far / placeholders, `SET_ALPHABET_ACTIVE_INDEX`), render `CreatorModeGameScene(party)`. On leaving the page or returning to lobby, reset creator store (`RESET_ALPHABET`, `SET_IS_GAME_OVER false`, empty questions) — Review Focus 5.
- Presentation: host (presenter) renders the scene with the input hidden plus big timer, answered avatars; players render only the answer area (text input, or trivia `TriviaOptionList`) with "Soru ekranda".

- [ ] Steps: implement → lint → manual: 2 browsers, text + trivia + media questions at 375 px and 1280 px, long question fit-text still fits, wrong letter retry, result + leaderboard each visibility setting, auto vs manual next, presentation on/off; then open a solo creator quiz and play it normally (Review Focus 5) → commit `feat(party): QA rounds in the creator scene`.

### Task 12: Choices game in the existing choices scene

**Files:**
- Modify: `components/Scene/ChoicesGameScene/ChoicesGameScene.component.{vue,scss}` — prop `party`: champion/challenger from `party.round.duel`, click → `party_vote`, `selectedSide` = my vote (changeable), badges Şampiyon / Meydan okuyan / "Senin oyun", live vote bar under the cards (`left% · n` / `right% · n`, "N OY"), lock card "Oyun değişti · hâlâ değiştirebilirsin · x/y oy verdi", round result card "Seçimin kazandı!" (success) / "Oda başka karar verdi" (neutral) with "Oylarla karar verildi"; hide `PlayIntroDialog`, interstitial, rating/replay/share in the winner layout. Do not call `useChoices` side effects (duel posting) in party.
- Presentation: host shows the cards big + bar; players get two compact vote buttons (1 / 2) with the choice text.

- [ ] Steps: implement → lint → manual: 3 choices tie keeps champion, vote change, presentation, final champion → commit `feat(party): choices voting rounds`.

### Task 13: Final results, cancel, host-left, reconnect, emoji

**Files:** Create `components/Party/PartyFinalResults` (QA: podium top 3 + list with score/correct count, or own score only when `never`; Choices: champion via the existing winner styling + elimination order), `components/Party/PartyCancelled` ("OYUN İPTAL EDİLDİ", "Kurucu oyunu iptal etti. Bu oyun için puan verilmedi.", "Lobiye dönülüyor" progress), `components/Party/PartyHostLeftDialog` (blocking, single "Quizlere dön" → creator quiz list route), `components/Party/PartyEmojiReactions` (floating emojis + picker button during game when chat on). Reuse the app's existing socket status banner component used on draw pages for reconnecting.

- [ ] Steps: implement → lint → manual: finish game → final → lobby with queue shifted; cancel → overlay → lobby; host leaves with only guests → dialog; kill ws and restart → reconnect banner then same round; kicked → toast + `/party` → commit `feat(party): final results, cancel and host-left flows`.

### Task 14: Host remote

**Files:** Create `components/Party/PartyRemoteDialog` (lobby "Kumanda": QR of `/party/:code/remote` + copy link + "Aynı hesapla giriş yapmalısın"); fill `pages/Party/_code/remote.vue` (`usePartySocket({ remote: true })`, `party_remote_join`; logged-out → login gate; not host → error state): Oyunu başlat, Sonraki tur, Oto ilerleme switch, Oyunu iptal et, short queue list, current phase/round label; no question content.

- [ ] Steps: implement → lint → manual: open remote on a second device/browser with host account, main tab stays connected (Review Focus 2), start/next/cancel drive both → commit `feat(party): host remote`.

### Task 15: Whole-branch check

- [ ] Both repos: `git log --oneline main..feat/party-mode`; ws: run every `scripts/manual/party-*` script → all `ok`; `node scripts/manual/draw-smoke.js` → still ok.
- [ ] Web: `yarn lint:eslint` and `yarn lint:stylelint` clean; `yarn generate` succeeds (route heads unaffected).
- [ ] `grep -ri` for the reference product name in both repos → no matches.
- [ ] Add `parolla/CLAUDE.md` "Party mode" paragraph (routes, store, scene party prop, ws channel, nothing persisted). Commit `docs: party mode notes`.
