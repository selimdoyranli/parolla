# Party Mode — Design

Date: 2026-10-30 · Repos: `parolla` (web), `parolla-ws` (new `party` channel). Strapi: read-only, no schema changes.

## Intent

Let a group play a creator quiz **together, in real time**, over a socket: one person opens a room from the quiz intro ("Party kur — Bir oda kur ve eş zamanlı olarak arkadaşlarınla oyna"), friends join by code/link/QR, everyone answers the same question in the same round, and a leaderboard (Trivia/QA) or a majority vote (Bu mu O mu) moves the game forward. A Kahoot-style **presentation mode** lets the host put the question on a TV while players answer on phones.

Reference: an existing party system the user shared as screenshots during the brainstorm (kept locally, not in the repo). Party follows that flow **adapted to parolla**: parolla colours (`--color-brand-02` #ff7878, `--color-brand-01`, existing `--color-*` tokens), Rubik, Vant 2 components (round `Button`, `Switch`, chips, `Popup`/sheet, `Dialog`), light **and** dark mode, compact and good-looking on mobile first.

It is purely for fun: **nothing is recorded anywhere**.

## Goals

- "Party kur" entry on the creator quiz intro (`PlayIntroDialog`, creator mode, QA and Choices quizzes only).
- Room with 6-digit code, invite link, QR; join by link or by typing the code on a party entry page.
- Logged-in users join as themselves; guests join through a guest dialog (random name + DiceBear avatar, editable) — the Draw mode pattern.
- Lobby: next-game card + start button, game queue with "Oyun ekle" picker, room settings, player list, code/QR card, chat.
- Round-based play for **QA/Trivia** (scored, leaderboard) and **Bu mu O mu** (majority vote decides the duel winner).
- Final results screen (QA also lists every player's answer per question, folded per question); the host takes everyone back to the lobby; next "Oyunu başlat" plays the next quiz in the queue.
- Presentation mode and Host remote ("Kumanda") in the first release.
- Reuse the existing game scenes so their fit-text / media-fit / compact work is kept.

## Non-goals

- Flashcard quizzes (no Party button there).
- Music, Geo, Tournament or daily/unlimited content in the queue (the reference's Music/Geo/Tournament tabs don't exist here).
- Public room listing. Rooms are reachable **only** by code or link.
- Any persistence: no room scoreboard rows, no profile stats, no gold/economy events, no play/view count bumps, no daily play counter, no Choices duel stats (`room-choice` win rates).
- Guests creating rooms.
- Ads on party screens.
- Changes to the native shells; party runs inside the mobile WebView like any web page.

## Anti-goals (would make it a failure even if it "works")

- A new, separate question screen that loses the creator scene's fit-text/media-fit behaviour on small screens.
- Desktop three-column layout squeezed onto phones; it must be a deliberately compact single column on mobile.
- Light-only styling or hard-coded colours that break dark mode.
- A pass button or any way to skip a round: every round waits for an answer (or time-out).
- Breaking the solo creator game, Draw mode, or the tour channel while adding party.

## Decisions (agreed with user)

| Topic | Decision |
|---|---|
| Entry | "Party kur" in the creator quiz intro, copy: "Bir oda kur ve eş zamanlı olarak arkadaşlarınla oyna". |
| Quiz types | QA (text answer + trivia options) and Bu mu O mu. Not Flashcard. |
| Question screen | Reuse `CreatorModeGameScene` (and `ChoicesGameScene`) — same markup, SCSS, `questionFitText`, `fitMediaQuestion`, compact header. Hide what doesn't apply (alphabet strip, pass, stats row, intro/stat/ad dialogs). |
| Pass | No pass. Round waits for an answer; time-out = no answer for that round. |
| Round timer | Per round, chosen by host in lobby (chips: 15/30/45/60/90/120 sn). |
| Bu mu O mu | Same king-of-the-hill flow as solo (`useChoices`). Each round everyone votes within the host's round time and may change their vote until time runs out; the majority choice wins and goes on to the next round. Live vote bar, "Senin oyun", Şampiyon/Meydan okuyan badges, "Seçimin kazandı!" result card. |
| Final results | Shown at the end of both types (Trivia: ranking; Choices: room's champion), then the host takes everyone back to the lobby (`party_lobby`). |
| Queue | Host adds quizzes via "Oyun ekle" modal (type tabs + search + trending grid). After final results → lobby; "Oyunu başlat" plays the next queued quiz. |
| Join | Code or link/QR only. Guests allowed via a guest dialog with random DiceBear avatar + name, editable (Draw mode logic). |
| Persistence | None. Fun only. |
| Presentation mode | In v1. Host doesn't compete; question shown big on host screen; players answer on their devices. |
| Host remote | In v1. QR + `/party/:code/remote` link, same account required. |

## How it works

### Flow

1. Logged-in user opens a QA or Choices creator quiz → intro → **Party kur**. Web asks ws to create a room seeded with that quiz → navigates to the party room page as host.
   - **Not logged in** → **Party kur** still opens the room setup screen, but the settings card ("ODA AYARLARI") starts with a danger-tinted notice — lock icon, "Parti odası oluşturmak için giriş yapman gerekiyor. Arkadaşların hesapları olmadan da odana katılabilir." and a **GİRİŞ YAP** button (existing login flow; WebView uses the native Google path) — and every setting below it (e.g. "Şifre ile koru") is shown disabled. No room is created until they log in.
2. Host shares code / link / QR. Joiner opens link (or types code on the party entry page). Logged in → straight in. Guest → guest dialog → "Katıl".
3. Lobby. Host edits settings, manages queue, starts. Players see "Kurucu bekleniyor", the queue (read-only), players, chat.
4. **Oyunu başlat** → game for the queue head starts for everyone. Room locks automatically while a game runs (anyone with the code can join until start).
5. Rounds (below) → final results → host's "Lobiye dön" → lobby. Finished quiz leaves the queue.
6. Host cancels mid-game → "Oyun iptal edildi · Kurucu oyunu iptal etti. Bu oyun için puan verilmedi." → lobby countdown.

### QA / Trivia round

- Server broadcasts the question (without the answer), round index (`3/10`), deadline.
- Answer handling is **the solo creator game's `handleAnswer` behaviour**, same scene, same input: a wrong-letter answer shows the same hint and the player types again (no answer consumed, clock keeps running); `pas`/`bitir` are not commands in party (no pass, no early finish). The first accepted answer is the player's answer for the round. QA text answers follow the solo rules: comma-separated alternatives, `formatAnswer` normalisation (tr lowercase, whitespace removed, `encodeEnglish`), and the "must start with the question's letter" rule with the same letter hint in the placeholder ("A... (Cevabını gir)"). Trivia uses `formatTriviaAnswer` exact match against the correct option. The server validates — the ws, not the client, decides correctness.
- Round ends when everyone (active, non-presenter players) has answered or time runs out.
- Round result: own card (DOĞRU!/YANLIŞ! + correct answer + points earned) and leaderboard (according to the leaderboard visibility setting), then next round after 5 s when Oto mod is on, otherwise when the host presses "Sonraki tur".
- Leaderboard visibility "Hiçbir zaman": no ranking between rounds or on the final screen; each player sees only their own score and correct count (my call). "Oyun sonunda": ranking only on the final screen.
- **Scoring (my call):** correct answers earn points scaled by speed, Kahoot-like — e.g. 1000 at instant answer down to 500 at the deadline; wrong/no answer 0. Leaderboard shows rank change (▲1).

### Bu mu O mu round

- Server holds the queue of choices, current champion and challenger (same order logic as `useChoices.initGame`). **Every choice is played** — no cap; a long quiz taking up to an hour is fine.
- Players vote left/right; vote changes allowed until the deadline; live tallies broadcast.
- At the deadline the side with more votes wins. **My call:** tie or zero votes → champion stays.
- Winner card for each player ("Seçimin kazandı!" / "Oda başka karar verdi"), then next round (Oto mod / host).
- End: the last standing choice is the room's champion, shown with the existing `winner-layout` styling (without rating/comments/replay; replaced by lobby return).

### Presentation mode

- Lobby switch "Sunum modu". When on: host doesn't play, isn't on the leaderboard, shows a "Sunuyor" badge in the player list.
- Host screen: the full scene (fit-text question + media, or the two Choices cards) without an input; big timer, "5/8 cevapladı", avatars of who answered; round results and final results big.
- Player device: QA → answer input only ("Soru ekranda"); Trivia → option buttons only; Choices → two compact vote buttons (1 / 2). Own result card after each round.

### Host remote

- Lobby "Kumanda" button → dialog with QR + `parolla.app/party/:code/remote` + copy link. Must be opened with the host's account.
- Remote screen: Oyunu başlat, Sonraki tur, Oto ilerleme switch, Oyunu iptal et, short queue view. No question content.

### Lobby (host)

Mobile single column, top → bottom:
- Header: parolla brand + "PARTİ LOBİSİ · <host>'un odası", help, Çıkış.
- Code card: QR thumb (tap → big QR), code `701 518`, copy, share (existing share flow / `postToNative('sharer')` in WebView).
- Next game card: cover, title, type label, **Oyunu başlat**, "Kumanda" link.
- Players card: `n / 10`, host crown, "Sen", empty slots, "Oyuncuları yönet" (kick).
- Queue card: ordered list (up/down, delete, "Oyna" to jump to front), "Oyun ekle".
- Settings card: Odayı kilitle, Sohbet, Tur süresi chips; collapsible Gelişmiş: Oto mod, Sunum modu, Liderlik tablosu (Her zaman / Oyun sonunda / Hiçbir zaman). Info pills: 10 kişilik, Şifreli (if password set).
- Chat: one-line bar docked at the bottom (last message + unread), opens a sheet. Desktop: three-column layout (main / players+code / chat).

First-pass mobile mockups: `.superpowers/brainstorm/*/content/party-flow.html` (screens 1–3 and 5 stand; screen 4 is superseded by the reused creator scene).

### Lobby (player)

Next game card with "Kurucu bekleniyor"; presentation notice when on; read-only queue; players; code card; chat.

### "Oyun ekle" modal

Tabs: Soru-Cevap, Bu mu O mu. Search box ("… quizlerinde ara"). Trending grid (cover, title, question count, play count). Built on `creator/fetchRooms` (type filter + keyword already exist) and existing quiz card components. Only public, non-hidden quizzes.

### Guest dialog

Reuse Draw mode's guest identity (`store/draw/guest`, `helpers/guest-identity`, `CreateGuestDrawerDialog` pattern): random name + DiceBear seed, regenerate each, edit name (`USERNAME_REGEX`), "Katıl", plus a "Giriş yap" link. Identity persisted locally so the next party reuses it.

### Settings, chat, moderation

- Max 10 players (fixed). Optional room password (Draw's `EnterPasswordDialog`).
- Chat in the lobby (always on) and during games when the host's "Oyun sırasında sohbet" setting is on (AppHeader chat button + dialog like tour; tour's fixed panel too when it fits beside the game column). Emoji reactions are always on. Messages pass through the existing bad-word censoring.
- Host can kick.
- **Host leaves** (user decision): host passes to another **logged-in** player in the room (longest-present logged-in player — my call on the order). Everything that shows the host updates reactively for everyone: crown/"Kurucu" label, "<host>'un odası" room title, host-only controls (start, queue, settings, remote). Guests never become host.
  - No logged-in player left to take over → every remaining player gets a blocking dialog warning that the host left and the party can't continue, with a single **Quizlere dön** button that sends them to the quiz list. The room closes.
- Reconnect with the same identity keeps a player's seat and score during a running game.
- Room closes when empty (short grace period for reconnects).

## Architecture (constraints, not a plan)

- **ws:** new `src/channels/party/` registered like `draw` (`register('party', …)`, messages prefixed `party_`). Draw's `codeGen`, room manager, host migration, vote/kick and broadcast helpers are the template; state is in-memory only. ws fetches each queued quiz from Strapi (read-only) when its game starts and keeps answers server-side; question payloads to clients never include answers. Port `formatAnswer` / `formatTriviaAnswer` / letter-rule logic so the server matches the solo game exactly.
- **web:** routes for party entry (`/party`) and room (`/party/:code`, `/party/:code/remote`) in `nuxt.config.js` i18n pages (tr/en paths), new `store/party` module, socket via the existing `isomorphic-ws` / `WS_URL` setup used by Draw. Scenes get a party path: `useGameScene` today drives itself from the route's store module (`creator/…` alphabet, countdown, `postStats`, economy). Party needs those driven by socket state instead, with stats/economy/ads/dialogs off — without changing solo behaviour.
- **Deploy order:** ws first (new channel is additive), then web. Per standing rule, no deploys during active hours; user deploys.

## Left to the builder

- Exact ws message names/payloads, room/game state shape, timers.
- How `useGameScene` / `useChoices` are split or flagged for party mode.
- Component breakdown for lobby, queue, modal, results, remote; i18n keys (tr + en).
- Exact speed-scoring curve within the stated range.
- Responsive breakpoints and desktop layout details (follow the reference screenshots).
- Empty/edge states: quiz deleted/hidden mid-queue, all players leave mid-game, host's remote and main tab both connected.

## Calls I made (user to confirm)

- Max 10 players, not configurable.
- Kahoot-like speed scoring (1000 → 500).
- Choices tie / no votes → champion stays.
- Cancelled quiz stays in the queue; finished quiz is removed.
- Scores are per quiz; no cumulative room total.
- Order of host hand-off: longest-present logged-in player.
- Wrong-letter answer → retry like solo; `pas`/`bitir` not commands in party.
- Leaderboard "Hiçbir zaman" → own score only, also on the final screen.
- No ads on party screens.
