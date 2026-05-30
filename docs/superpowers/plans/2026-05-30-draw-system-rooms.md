# Draw Mode — Sistem (Resmi) Odalar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add always-on, host-less draw rooms per `DrawWordCategory` with auto sub-room spawning, mid-round join, 50-round continuous cycles, reactive lobby socket push, and a tabbed lobby UI ("Resmi Odalar" / "Topluluk Odaları").

**Architecture:** Add a parallel system-room map in the WS draw channel (`state.systemRooms`), a `systemRoomManager` that bootstraps from Strapi and runs a GC loop, a `lobbyPusher` that fans out delta updates to subscribed clients, and a small game-loop adapter for the `waiting` state and 50-round reset cycle. Frontend grows a Vant tab in the lobby + a kind-aware DrawRoom view + waiting/final overlays on the canvas.

**Tech Stack:** Node 18+ (WS), Strapi 5 (content source, no changes), Nuxt 2 + composition-api + Vant 2 + Vuex (frontend). Spec: `docs/superpowers/plans/../specs/2026-05-30-draw-system-rooms-design.md`.

**Repos involved (paths in this plan are relative to each repo's root):**
- `parolla-ws` — `/Users/selim.doyranli/projects/selimdoyranli/github/parolla-ws`
- `parolla` — `/Users/selim.doyranli/projects/selimdoyranli/github/parolla`
- `parolla-strapi` — no changes

**Verification approach:** Repos don't ship unit-test frameworks. Each task verifies via syntax check (`node -c`), lint (`pnpm lint` / `npx eslint`), and (for stateful logic) a smoke script run against a live local stack. Manual end-to-end at the end.

---

## File Structure (all changes)

### parolla-ws (create)
- `src/channels/draw/systemRoomManager.js` — boot, ensureRoomForJoin, GC, refresh
- `src/channels/draw/lobbyPusher.js` — subscriber set + debounced upsert/remove
- `src/channels/draw/roomDto.js` — uniform lobby summary DTO builder (system + community)
- `scripts/manual/system-room-smoke.js` — multi-client smoke for waiting → start → fill → spawn → GC

### parolla-ws (modify)
- `src/constants/messageTypes.js` — new types (subscribe/unsubscribe/snapshot/upsert/remove/waiting/final)
- `src/channels/draw/state.js` — add `systemRooms` Map + `lobbySubscribers` Set + `getRoom(code)` helper
- `src/channels/draw/roomManager.js` — `kind` defaults to `'community'`; `addPlayer`/`removePlayer` notify lobby
- `src/channels/draw/gameLoop.js` — `waiting` state, kind-aware bypass of host gating, 50-round cycle, `DRAW_WAITING` + `DRAW_FINAL_SCOREBOARD`
- `src/channels/draw/messageHandler.js` — lobby subscribe/unsubscribe handling; `draw_room_join` accepts slug
- `src/channels/draw/index.js` — onConnect snapshot still works; onDisconnect tracks lobby subscribers
- `src/server.js` — call `systemRoomManager.bootstrap()` + register `/admin/draw/refresh` endpoint

### parolla (create)
- `components/Draw/SystemRoomList/SystemRoomList.component.vue` — category grouped list
- `components/Draw/SystemRoomList/SystemRoomList.component.scss` — scoped styles
- `components/Draw/CommunityRoomList/CommunityRoomList.component.vue` — extracted existing list + create dialog trigger
- `components/Draw/CommunityRoomList/CommunityRoomList.component.scss`

### parolla (modify)
- `enums/wsType.enum.js` — new draw_lobby_*, draw_final_scoreboard, draw_waiting types
- `store/draw/state.js` — `systemRooms`, `communityRooms` (alias of publicRooms), `lobbySubscribed`, `roomKind`, `waiting`, `finalScores`
- `store/draw/mutations.js` — UPSERT/REMOVE/SET_LOBBY_SUBSCRIBED/SET_WAITING/SET_FINAL_SCOREBOARD
- `store/draw/actions.js` — handleMessage cases for new types
- `pages/DrawMode/DrawLobby/index.vue` — Vant Tabs wrapper; subscribe lifecycle
- `pages/DrawMode/DrawRoom/_code.vue` — kind detection; hide host UI for system
- `components/Draw/DrawCanvas/DrawCanvas.component.vue` — `waiting` overlay + `finalScoreboard` overlay (reuse DrawScoreboard or inline)

---

## Phase 1 — WS foundation (state + kind)

### Task 1: Extend draw state with system rooms + lobby subscribers + getRoom helper

**Files:**
- Modify: `parolla-ws/src/channels/draw/state.js`

- [ ] **Step 1: Read current file**

Open `parolla-ws/src/channels/draw/state.js`. Current content:
```js
const drawState = {
  rooms: new Map(),
  playerRoom: new Map(),
}
module.exports = drawState
```

- [ ] **Step 2: Replace file with extended state + helper**

```js
'use strict'

/**
 * Draw channel state — module-singleton.
 *
 *   rooms             — community rooms (Map<code, Room>); code = 6-char uppercase.
 *   systemRooms       — system/official rooms (Map<code, Room>); code = SLUG (e.g. "YEMEKLER")
 *                       or SLUG-N for sub-rooms. URL form is lowercase.
 *   playerRoom        — Map<playerId, code>; resolves to either map.
 *   lobbySubscribers  — Set<ws>; clients that want delta updates of the room list.
 */
const drawState = {
  rooms: new Map(),
  systemRooms: new Map(),
  playerRoom: new Map(),
  lobbySubscribers: new Set(),
}

/**
 * Lookup a room by code in either map. System rooms take precedence so a
 * theoretical 6-char slug never gets shadowed by a community code.
 */
function getRoom(code) {
  if (!code) return null
  const key = String(code).toUpperCase()
  return drawState.systemRooms.get(key) || drawState.rooms.get(key) || null
}

module.exports = drawState
module.exports.getRoom = getRoom
```

- [ ] **Step 3: Syntax check**

Run: `node -c parolla-ws/src/channels/draw/state.js`
Expected: exits 0, no output.

- [ ] **Step 4: Confirm no other code imports broke**

Run: `grep -rn "require.*channels/draw/state" parolla-ws/src --include="*.js"`
Expected: every caller does `require('./state')` and uses `drawState.rooms` or `.playerRoom` — both still present. New fields are additive.

- [ ] **Step 5: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla-ws
git add src/channels/draw/state.js
git commit -m "$(cat <<'EOF'
feat(draw): add systemRooms map + lobby subscribers to channel state

Foundation for the official/system rooms feature. State is additive —
existing community-room consumers see no behavioral change.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Add room `kind` field to community room shape

**Files:**
- Modify: `parolla-ws/src/channels/draw/roomManager.js`

- [ ] **Step 1: Read `makeRoom` in roomManager.js**

Locate the `makeRoom` function (around line 17-60). It returns an object literal starting with `code`. Find the spot after `code` is set.

- [ ] **Step 2: Add `kind: 'community'` to the returned room object**

After `code,` line in the room literal, insert:
```js
    kind: 'community',
```

- [ ] **Step 3: Syntax check**

Run: `node -c parolla-ws/src/channels/draw/roomManager.js`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla-ws
git add src/channels/draw/roomManager.js
git commit -m "$(cat <<'EOF'
feat(draw): tag community rooms with kind='community'

Prepares roomManager for the kind switch the system-room feature needs;
no behavior change.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Add new message type constants

**Files:**
- Modify: `parolla-ws/src/constants/messageTypes.js`
- Modify: `parolla/enums/wsType.enum.js`

- [ ] **Step 1: Add WS-side constants**

Find the `DRAW_` block in `parolla-ws/src/constants/messageTypes.js`. After the last `DRAW_ERROR` entry, insert:

```js
  DRAW_LOBBY_SUBSCRIBE: 'draw_lobby_subscribe',
  DRAW_LOBBY_UNSUBSCRIBE: 'draw_lobby_unsubscribe',
  DRAW_LOBBY_SNAPSHOT: 'draw_lobby_snapshot',
  DRAW_LOBBY_ROOM_UPSERT: 'draw_lobby_room_upsert',
  DRAW_LOBBY_ROOM_REMOVE: 'draw_lobby_room_remove',
  DRAW_FINAL_SCOREBOARD: 'draw_final_scoreboard',
  DRAW_WAITING: 'draw_waiting',
```

- [ ] **Step 2: Mirror in frontend enum**

In `parolla/enums/wsType.enum.js`, before the closing `})`, insert the same keys (camelCase keys, same string values):

```js
  DRAW_LOBBY_SUBSCRIBE: 'draw_lobby_subscribe',
  DRAW_LOBBY_UNSUBSCRIBE: 'draw_lobby_unsubscribe',
  DRAW_LOBBY_SNAPSHOT: 'draw_lobby_snapshot',
  DRAW_LOBBY_ROOM_UPSERT: 'draw_lobby_room_upsert',
  DRAW_LOBBY_ROOM_REMOVE: 'draw_lobby_room_remove',
  DRAW_FINAL_SCOREBOARD: 'draw_final_scoreboard',
  DRAW_WAITING: 'draw_waiting',
```

- [ ] **Step 3: Syntax check both**

Run: `node -c parolla-ws/src/constants/messageTypes.js`
Expected: exits 0.

Run: `cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla && npx eslint enums/wsType.enum.js`
Expected: no output.

- [ ] **Step 4: Commit both repos**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla-ws
git add src/constants/messageTypes.js
git commit -m "$(cat <<'EOF'
feat(draw): add system-room + lobby message type constants

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"

cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
git add enums/wsType.enum.js
git commit -m "$(cat <<'EOF'
feat(draw): mirror new draw lobby/system message types in FE enum

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — Room DTO + lobby pusher

### Task 4: Create roomDto module

**Files:**
- Create: `parolla-ws/src/channels/draw/roomDto.js`

- [ ] **Step 1: Write the file**

```js
'use strict'

/**
 * Build the lobby summary DTO for a room. Used by lobbyPusher.snapshot/upsert
 * and the legacy roomManager.listPublic.
 */
function buildLobbyDto(room) {
  const base = {
    code: room.code,
    kind: room.kind,
    playerCount: room.players ? room.players.size : 0,
    capacity: room.capacity,
    currentRoundIndex: room.currentRoundIndex || 0,
    state: room.state,
  }

  if (room.kind === 'system') {
    return {
      ...base,
      slug: room.slug,
      subIndex: room.subIndex,
      categoryTitle: room.categoryTitle,
    }
  }

  return {
    ...base,
    isPublic: room.isPublic !== false,
    hostName: hostNameOf(room),
  }
}

function hostNameOf(room) {
  if (!room || !room.hostId || !room.players) return null
  const host = room.players.get(room.hostId)
  return host ? host.name : null
}

module.exports = { buildLobbyDto }
```

- [ ] **Step 2: Syntax check**

Run: `node -c parolla-ws/src/channels/draw/roomDto.js`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla-ws
git add src/channels/draw/roomDto.js
git commit -m "$(cat <<'EOF'
feat(draw): add unified lobby summary DTO builder

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Create lobbyPusher module

**Files:**
- Create: `parolla-ws/src/channels/draw/lobbyPusher.js`

- [ ] **Step 1: Write the file**

```js
'use strict'

const drawState = require('./state')
const { buildLobbyDto } = require('./roomDto')

const MessageType = require('../../constants/messageTypes')

// Coalesce multiple upsert/remove events that happen in the same tick into
// one push per (code) so a flurry of state changes does not amplify traffic.
const pendingUpserts = new Map() // code → room
const pendingRemoves = new Set() // codes
let flushScheduled = false

function scheduleFlush() {
  if (flushScheduled) return
  flushScheduled = true
  process.nextTick(flush)
}

function flush() {
  flushScheduled = false
  if (pendingRemoves.size === 0 && pendingUpserts.size === 0) return

  const subs = Array.from(drawState.lobbySubscribers)

  for (const [code, room] of pendingUpserts) {
    if (pendingRemoves.has(code)) continue // remove wins
    const dto = buildLobbyDto(room)
    sendAll(subs, { type: MessageType.DRAW_LOBBY_ROOM_UPSERT, room: dto })
  }
  for (const code of pendingRemoves) {
    sendAll(subs, { type: MessageType.DRAW_LOBBY_ROOM_REMOVE, code })
  }

  pendingUpserts.clear()
  pendingRemoves.clear()
}

function sendAll(subs, payload) {
  const str = JSON.stringify(payload)
  for (const ws of subs) {
    if (ws && ws.readyState === 1) {
      try { ws.send(str) } catch (_e) { /* ignore */ }
    }
  }
}

function upsert(room) {
  if (!room || !room.code) return
  pendingUpserts.set(room.code, room)
  pendingRemoves.delete(room.code)
  scheduleFlush()
}

function remove(code) {
  if (!code) return
  pendingRemoves.add(code)
  pendingUpserts.delete(code)
  scheduleFlush()
}

function subscribe(ws) {
  if (!ws) return
  drawState.lobbySubscribers.add(ws)
  // Send snapshot immediately, not on next tick.
  const systemRooms = []
  for (const r of drawState.systemRooms.values()) systemRooms.push(buildLobbyDto(r))
  const communityRooms = []
  for (const r of drawState.rooms.values()) {
    if (r.isPublic !== false) communityRooms.push(buildLobbyDto(r))
  }
  try {
    ws.send(JSON.stringify({
      type: MessageType.DRAW_LOBBY_SNAPSHOT,
      systemRooms,
      communityRooms,
    }))
  } catch (_e) { /* ignore */ }
}

function unsubscribe(ws) {
  if (!ws) return
  drawState.lobbySubscribers.delete(ws)
}

module.exports = { upsert, remove, subscribe, unsubscribe }
```

- [ ] **Step 2: Syntax check**

Run: `node -c parolla-ws/src/channels/draw/lobbyPusher.js`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla-ws
git add src/channels/draw/lobbyPusher.js
git commit -m "$(cat <<'EOF'
feat(draw): add lobbyPusher with debounced upsert/remove + snapshot

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — systemRoomManager

### Task 6: Create systemRoomManager skeleton (createRoom + slug normalization + ensureRoomForJoin)

**Files:**
- Create: `parolla-ws/src/channels/draw/systemRoomManager.js`

- [ ] **Step 1: Write the file**

```js
'use strict'

const axios = require('axios')
const https = require('https')
const drawState = require('./state')
const lobbyPusher = require('./lobbyPusher')

const API_URL = process.env.API_URL || 'https://strapi.parolla.app/api'
const httpsAgent = new https.Agent({ rejectUnauthorized: false })

const CAPACITY = 16
const ROUND_COUNT = 50
const ROUND_DURATION_SEC = 60
const PICK_DURATION_SEC = 10
const GC_INTERVAL_MS = 30_000
const SUB_ROOM_EMPTY_TTL_MS = 60_000
const MAX_SUB_INDEX = 50

function slugToKey(slug, subIndex) {
  const base = String(slug).toUpperCase()
  return subIndex === 1 ? base : `${base}-${subIndex}`
}

function createSystemRoom({ slug, subIndex, categoryTitle, locale }) {
  const code = slugToKey(slug, subIndex)
  const room = {
    code,
    kind: 'system',
    hostId: null,
    isPublic: true,
    password: null,
    capacity: CAPACITY,
    roundCount: ROUND_COUNT,
    roundDurationSec: ROUND_DURATION_SEC,
    pickDurationSec: PICK_DURATION_SEC,
    categories: [slug],
    locale: locale || 'tr-TR',
    players: new Map(),
    state: 'waiting',
    turnQueue: [],
    currentDrawerId: null,
    currentRoundIndex: 0,
    currentWord: null,
    currentWordCategory: null,
    pickOptions: null,
    pickEndsAt: null,
    drawStartedAt: null,
    correctGuessers: [],
    correctGuessSet: new Set(),
    strokes: [],
    chatHistory: [],
    usedWordTitles: new Set(),
    pickTimer: null,
    roundTimer: null,
    finalTimer: null,
    // system-only
    slug,
    subIndex,
    categoryTitle,
    emptySince: null,
  }
  drawState.systemRooms.set(code, room)
  lobbyPusher.upsert(room)
  return room
}

/**
 * Resolve which system room a joining player should land in for the given
 * slug. Auto-spawns sub-rooms when the prior ones are full.
 */
function ensureRoomForJoin(slug) {
  const baseSlug = String(slug).toLowerCase()
  for (let n = 1; n <= MAX_SUB_INDEX; n++) {
    const key = slugToKey(baseSlug, n)
    let room = drawState.systemRooms.get(key)
    if (!room) {
      // Spawn only if we previously had a higher-index room or if this is the
      // base — never silently spawn an arbitrary key, must follow sequence.
      // Look up category metadata from the base room.
      const baseRoom = drawState.systemRooms.get(slugToKey(baseSlug, 1))
      if (!baseRoom) return null // unknown category
      room = createSystemRoom({
        slug: baseSlug,
        subIndex: n,
        categoryTitle: baseRoom.categoryTitle,
        locale: baseRoom.locale,
      })
    }
    if (room.players.size < room.capacity) return room
  }
  return null
}

async function fetchCategories() {
  // Strapi maxLimit defaults to 100; categories are far fewer, one page is plenty.
  const url =
    `${API_URL}/draw-word-categories?locale=tr-TR` +
    `&filters[isActive][$eq]=true` +
    `&pagination[pageSize]=100` +
    `&sort=title:asc`
  const res = await axios.get(url, { httpsAgent, timeout: 8000 })
  const items = (res.data && res.data.data) || []
  return items
    .map((c) => ({
      slug: c.slug || (c.attributes && c.attributes.slug),
      title: c.title || (c.attributes && c.attributes.title),
    }))
    .filter((c) => c.slug && c.title)
}

/**
 * Boot all main system rooms from current Strapi state. Idempotent — does
 * not duplicate rooms that already exist.
 */
async function bootstrap() {
  try {
    const cats = await fetchCategories()
    for (const c of cats) {
      const key = slugToKey(c.slug, 1)
      if (!drawState.systemRooms.has(key)) {
        createSystemRoom({ slug: c.slug, subIndex: 1, categoryTitle: c.title, locale: 'tr-TR' })
      }
    }
    return { count: cats.length }
  } catch (err) {
    // Log and continue — WS can still serve community rooms even if Strapi is down.
    // eslint-disable-next-line no-console
    console.error('[draw/systemRoomManager] bootstrap failed:', err.message)
    return { count: 0, error: err.message }
  }
}

/**
 * Admin-callable refresh; adds any newly-active categories. Does not remove
 * stale ones (keeps existing players intact).
 */
async function refresh() {
  return bootstrap()
}

let gcInterval = null

function startGc() {
  if (gcInterval) return
  gcInterval = setInterval(() => {
    const now = Date.now()
    for (const room of drawState.systemRooms.values()) {
      if (room.kind !== 'system' || room.subIndex < 2) continue
      if (room.players.size === 0) {
        if (!room.emptySince) room.emptySince = now
        else if (now - room.emptySince > SUB_ROOM_EMPTY_TTL_MS) {
          drawState.systemRooms.delete(room.code)
          lobbyPusher.remove(room.code)
        }
      } else {
        room.emptySince = null
      }
    }
  }, GC_INTERVAL_MS)
}

function stopGc() {
  if (gcInterval) {
    clearInterval(gcInterval)
    gcInterval = null
  }
}

module.exports = {
  bootstrap,
  refresh,
  ensureRoomForJoin,
  createSystemRoom,
  slugToKey,
  startGc,
  stopGc,
}
```

- [ ] **Step 2: Verify axios is installed**

Run: `node -e "require('axios')" 2>&1` from inside `parolla-ws`.
Expected: no error (axios is already used by `wordService.js`).

- [ ] **Step 3: Syntax check**

Run: `node -c parolla-ws/src/channels/draw/systemRoomManager.js`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla-ws
git add src/channels/draw/systemRoomManager.js
git commit -m "$(cat <<'EOF'
feat(draw): add systemRoomManager (bootstrap, ensureRoomForJoin, GC, refresh)

Spawns one system room per Strapi DrawWordCategory at boot, auto-creates
sequentially-numbered sub-rooms when capacity is hit, and GCs sub-rooms
that sit empty for 60 s.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 — Game loop adaptations

### Task 7: gameLoop — bypass host gating + emit DRAW_WAITING for system rooms

**Files:**
- Modify: `parolla-ws/src/channels/draw/gameLoop.js`

- [ ] **Step 1: Read existing `startGame` and `broadcastRoomState`**

Open the file to confirm location of `startGame` (around line 35) and the function that constructs room snapshots (`broadcastRoomState`, scan for it).

- [ ] **Step 2: Add helper `enterWaiting` near top**

After `broadcastSystemChat` (around line 24), add:

```js
const MessageType = require('../../constants/messageTypes')
const lobbyPusher = require('./lobbyPusher')

/**
 * Put a system room into 'waiting' state and notify everyone. Idempotent.
 */
function enterWaiting(room, broadcast) {
  if (room.kind !== 'system') return
  clearRoomTimers(room)
  room.state = 'waiting'
  room.currentDrawerId = null
  room.pickOptions = null
  room.pickEndsAt = null
  room.strokes = []
  broadcast(room, {
    type: MessageType.DRAW_WAITING,
    present: room.players.size,
    required: 2,
  })
  lobbyPusher.upsert(room)
}
```

- [ ] **Step 3: Loosen `startGame` so system rooms can start from 'waiting'**

Replace the early-return:
```js
  if (room.state !== 'lobby') return
```
with:
```js
  if (room.kind === 'system') {
    if (room.state !== 'waiting') return
  } else if (room.state !== 'lobby') {
    return
  }
```

- [ ] **Step 4: Export `enterWaiting`**

Find `module.exports = { ... }` at the bottom and add `enterWaiting`.

- [ ] **Step 5: Syntax check**

Run: `node -c parolla-ws/src/channels/draw/gameLoop.js`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla-ws
git add src/channels/draw/gameLoop.js
git commit -m "$(cat <<'EOF'
feat(draw): add waiting state + system-room start gating in gameLoop

System rooms start from 'waiting' instead of 'lobby'; reuse same
startGame path. enterWaiting() centralizes the reset + broadcast.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: gameLoop — 50-round cycle ends in finalScoreboard then auto-resets

**Files:**
- Modify: `parolla-ws/src/channels/draw/gameLoop.js`

- [ ] **Step 1: Locate end-of-round transition**

Find where `currentRoundIndex` is incremented and either continues to next round or calls `endGame`. (Search for `currentRoundIndex++` and `roundCount`.)

- [ ] **Step 2: Add `enterFinalScoreboard` helper near `enterWaiting`**

```js
const FINAL_SCOREBOARD_MS = 15_000

function buildFinalScores(room) {
  const out = []
  for (const p of room.players.values()) {
    out.push({ playerId: p.id, name: p.name, score: p.score || 0 })
  }
  out.sort((a, b) => b.score - a.score)
  return out
}

function enterFinalScoreboard(room, broadcast, sendTo) {
  clearRoomTimers(room)
  room.state = 'finalScoreboard'
  broadcast(room, {
    type: MessageType.DRAW_FINAL_SCOREBOARD,
    scores: buildFinalScores(room),
    nextRoundInMs: FINAL_SCOREBOARD_MS,
  })
  lobbyPusher.upsert(room)

  room.finalTimer = setTimeout(() => {
    if (room.kind !== 'system') return
    // Reset cycle
    room.currentRoundIndex = 0
    room.usedWordTitles = new Set()
    for (const p of room.players.values()) p.score = 0
    if (room.players.size >= 2) {
      room.state = 'waiting'
      // startGame will move to 'picking'
      // eslint-disable-next-line no-use-before-define
      startGame(room, broadcast, sendTo)
    } else {
      enterWaiting(room, broadcast)
    }
  }, FINAL_SCOREBOARD_MS)
}
```

- [ ] **Step 3: Hook into round-end transition (system rooms only)**

In the round-end logic, find the spot that decides to start the next round or end the game. Wrap the existing community endGame branch with kind check; for system, if `currentRoundIndex >= roundCount` call `enterFinalScoreboard`.

Concretely: search for `if (room.currentRoundIndex >= room.roundCount)` in `gameLoop.js`. Wherever it currently does the end-game path, replace with:

```js
if (room.currentRoundIndex >= room.roundCount) {
  if (room.kind === 'system') {
    enterFinalScoreboard(room, broadcast, sendTo)
  } else {
    endGame(room, broadcast)
  }
  return
}
```

- [ ] **Step 4: Export `enterFinalScoreboard`**

Add it to `module.exports`.

- [ ] **Step 5: Syntax check**

Run: `node -c parolla-ws/src/channels/draw/gameLoop.js`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla-ws
git add src/channels/draw/gameLoop.js
git commit -m "$(cat <<'EOF'
feat(draw): 50-round cycle ends in finalScoreboard then auto-resets

System rooms loop indefinitely: round 50 → 15 s scoreboard → reset to
round 1. Scores are wiped between cycles (no persistence by design).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: gameLoop — system room auto-start when player count crosses 2

**Files:**
- Modify: `parolla-ws/src/channels/draw/roomManager.js`
- Modify: `parolla-ws/src/channels/draw/messageHandler.js`

- [ ] **Step 1: Update `addPlayer` to trigger system start**

In `roomManager.js`, find `addPlayer` (it returns `{ ok }`). After the player is added to `room.players`, before returning, add:

```js
  // System-room auto-progression: 2nd player flips waiting → picking via
  // the same startGame path used by community games. addPlayer is called
  // synchronously from messageHandler so a side-effect here is safe.
  if (room.kind === 'system' && room.state === 'waiting' && room.players.size >= 2) {
    room.__autoStartPending = true
  }
```

- [ ] **Step 2: Update `removePlayer` to fall back to waiting**

In `removePlayer`, after deletion of the player, before the empty-cleanup block, add:

```js
  if (room.kind === 'system' && room.players.size < 2 && room.state !== 'waiting') {
    room.__autoWaitPending = true
  }
```

- [ ] **Step 3: Update messageHandler to act on the flags**

In `messageHandler.js`, where `addPlayer` is called and succeeds (`DRAW_ROOM_JOIN` and `DRAW_ROOM_CREATE` cases), after the successful `broadcastRoomState`, add a follow-up:

```js
  if (room.__autoStartPending) {
    delete room.__autoStartPending
    await loop.startGame(room, broadcastToRoom, sendTo)
  }
```

Similarly, where `removePlayer` is called (`DRAW_ROOM_LEAVE`, `DRAW_ROOM_KICK`, `onDisconnect` via channels/draw/index.js), check `room.__autoWaitPending` and call `loop.enterWaiting(room, broadcastToRoom)`.

For the `onDisconnect` path in `channels/draw/index.js`, mirror the check.

- [ ] **Step 4: Syntax check both files**

Run: `node -c parolla-ws/src/channels/draw/roomManager.js && node -c parolla-ws/src/channels/draw/messageHandler.js && node -c parolla-ws/src/channels/draw/index.js`
Expected: all exit 0.

- [ ] **Step 5: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla-ws
git add src/channels/draw/roomManager.js src/channels/draw/messageHandler.js src/channels/draw/index.js
git commit -m "$(cat <<'EOF'
feat(draw): system rooms auto-start at 2 players, fall to waiting under 2

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5 — Lobby integration

### Task 10: Subscribe / unsubscribe / join-by-slug in messageHandler

**Files:**
- Modify: `parolla-ws/src/channels/draw/messageHandler.js`

- [ ] **Step 1: Add subscribe + unsubscribe cases**

Inside the `switch (data.type)` block, after `DRAW_ROOM_LIST`, add:

```js
    case MessageType.DRAW_LOBBY_SUBSCRIBE: {
      lobbyPusher.subscribe(ws)
      return true
    }
    case MessageType.DRAW_LOBBY_UNSUBSCRIBE: {
      lobbyPusher.unsubscribe(ws)
      return true
    }
```

Add at the top of the file:
```js
const lobbyPusher = require('./lobbyPusher')
const systemRoomManager = require('./systemRoomManager')
```

- [ ] **Step 2: Make `DRAW_ROOM_JOIN` slug-aware**

Find the `DRAW_ROOM_JOIN` case. Replace the room lookup `drawState.rooms.get(...)` with the unified resolver:

```js
    case MessageType.DRAW_ROOM_JOIN: {
      const raw = String(data.code || '').trim()
      if (!raw) {
        ws.send(JSON.stringify({ type: MessageType.DRAW_ERROR, code: 'room_not_found', message: 'Oda bulunamadı' }))
        return true
      }

      let room
      // Treat lowercase identifiers as slugs (system rooms).
      if (raw === raw.toLowerCase()) {
        // Strip trailing -N for the base slug; ensureRoomForJoin walks the chain.
        const baseSlug = raw.replace(/-\d+$/, '')
        room = systemRoomManager.ensureRoomForJoin(baseSlug)
        if (!room) {
          ws.send(JSON.stringify({ type: MessageType.DRAW_ERROR, code: 'room_not_found', message: 'Oda bulunamadı' }))
          return true
        }
      } else {
        room = drawState.getRoom(raw)
        if (!room) {
          ws.send(JSON.stringify({ type: MessageType.DRAW_ERROR, code: 'room_not_found', message: 'Oda bulunamadı' }))
          return true
        }
      }

      if (room.kind === 'community' && room.password && data.password !== room.password) {
        ws.send(JSON.stringify({ type: MessageType.DRAW_ERROR, code: 'bad_password', message: 'Yanlış şifre' }))
        return true
      }
      if (drawState.playerRoom.has(player.id)) {
        ws.send(JSON.stringify({ type: MessageType.DRAW_ERROR, code: 'already_in_room', message: 'Zaten bir odadasınız' }))
        return true
      }
      const add = rm.addPlayer(room, player, ws)
      if (!add.ok) {
        ws.send(JSON.stringify({ type: MessageType.DRAW_ERROR, code: 'join_fail', message: add.error }))
        return true
      }
      if (room.state === 'drawing' || room.state === 'roundEnd' || room.state === 'picking') {
        ws.send(JSON.stringify({
          type: MessageType.DRAW_STATE_SNAPSHOT,
          strokes: room.strokes,
          state: room.state,
        }))
      }
      loop.broadcastRoomState(room, broadcastToRoom)
      loop.broadcastSystemChat(room, broadcastToRoom, `${player.name} odaya katıldı`, 'info')
      lobbyPusher.upsert(room)
      if (room.__autoStartPending) {
        delete room.__autoStartPending
        await loop.startGame(room, broadcastToRoom, sendTo)
      }
      return true
    }
```

- [ ] **Step 3: Reject DRAW_GAME_START for system rooms**

In the `DRAW_GAME_START` case, before `await loop.startGame`, add:

```js
      if (room.kind === 'system') return true
```

- [ ] **Step 4: Add lobby push on player remove (Leave/Kick)**

In the `DRAW_ROOM_LEAVE`, `DRAW_ROOM_KICK` cases, after `rm.removePlayer`, before broadcasting, add:

```js
        lobbyPusher.upsert(room)
        if (room.__autoWaitPending) {
          delete room.__autoWaitPending
          loop.enterWaiting(room, broadcastToRoom)
        }
```

- [ ] **Step 5: Make onDisconnect handle the same flags**

In `channels/draw/index.js`, after `rm.removePlayer`, before `if (wasDrawer)`, add the same lobby push + autoWait check.

- [ ] **Step 6: Syntax check**

Run: `node -c parolla-ws/src/channels/draw/messageHandler.js && node -c parolla-ws/src/channels/draw/index.js`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla-ws
git add src/channels/draw/messageHandler.js src/channels/draw/index.js
git commit -m "$(cat <<'EOF'
feat(draw): lobby subscribe + slug-aware join + lifecycle lobby pushes

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Lobby push on state transitions inside gameLoop

**Files:**
- Modify: `parolla-ws/src/channels/draw/gameLoop.js`

- [ ] **Step 1: Locate `broadcastRoomState`**

Find the function that broadcasts the full room snapshot to all players. Whenever it is called, lobby subscribers will also want a summary.

- [ ] **Step 2: Add `lobbyPusher.upsert(room)` after every `broadcastRoomState` invocation**

`grep -n "broadcastRoomState(" parolla-ws/src/channels/draw/gameLoop.js` to enumerate. For each call site (NOT the definition), append `lobbyPusher.upsert(room)`.

If there are many, the safest path is to make `broadcastRoomState` itself call `lobbyPusher.upsert(room)` at the end. Open it; at the bottom, before any return, add `lobbyPusher.upsert(room)`.

- [ ] **Step 3: Syntax check**

Run: `node -c parolla-ws/src/channels/draw/gameLoop.js`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla-ws
git add src/channels/draw/gameLoop.js
git commit -m "$(cat <<'EOF'
feat(draw): push lobby update on every broadcastRoomState

Centralizes the lobby-sync so any state transition that already calls
broadcastRoomState (round start/end, drawer change, game end) keeps
subscribed clients in sync with no extra wiring per call site.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 6 — Server boot + refresh endpoint

### Task 12: Wire bootstrap + GC + refresh endpoint into server.js

**Files:**
- Modify: `parolla-ws/src/server.js`

- [ ] **Step 1: Locate the HTTP request handler**

Open `parolla-ws/src/server.js`. Find `http.createServer((req, res) => { ... })`.

- [ ] **Step 2: Add admin refresh endpoint inside the request handler**

Replace the existing fallback `res.writeHead(200); res.end('...')` with:

```js
    if (req.method === 'POST' && req.url === '/admin/draw/refresh') {
      const token = req.headers['x-admin-token']
      if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
        res.writeHead(401, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'unauthorized' }))
        return
      }
      // Lazy require to avoid pulling Strapi-aware modules at boot just for the route.
      const sysRm = require('./channels/draw/systemRoomManager')
      sysRm
        .refresh()
        .then((r) => {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(r))
        })
        .catch((err) => {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: err.message }))
        })
      return
    }

    res.writeHead(200)
    res.end('WebSocket sunucusu çalışıyor!')
```

- [ ] **Step 3: Bootstrap + start GC after server listen**

Find `server.listen(...)`. Immediately after (still inside the surrounding `try`), add:

```js
  // Boot system (official) rooms from Strapi + start sub-room GC.
  const systemRoomManager = require('./channels/draw/systemRoomManager')
  systemRoomManager
    .bootstrap()
    .then(({ count, error }) => {
      if (error) console.warn(`[draw] system-room bootstrap soft-failed: ${error}`)
      else console.log(`[draw] system rooms ready: ${count} categories`)
    })
  systemRoomManager.startGc()
```

- [ ] **Step 4: Syntax check**

Run: `node -c parolla-ws/src/server.js`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla-ws
git add src/server.js
git commit -m "$(cat <<'EOF'
feat(draw): boot system rooms and expose /admin/draw/refresh endpoint

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 7 — Smoke verification (WS-only)

### Task 13: Smoke script for system rooms

**Files:**
- Create: `parolla-ws/scripts/manual/system-room-smoke.js`

- [ ] **Step 1: Write the smoke script**

```js
'use strict'

/**
 * Manual smoke for system (official) rooms.
 *
 * Usage:
 *   node scripts/manual/system-room-smoke.js wss://0.0.0.0:1881 <jwt1> <jwt2> [slug=yemekler]
 *
 * Validates:
 *   1. Single client lands in waiting state and gets DRAW_WAITING.
 *   2. Second client triggers a round (DRAW_WORD_OPTIONS / DRAW_ROUND_START).
 *   3. Lobby subscribe receives snapshot + upserts on join.
 */

const WebSocket = require('ws')

const [, , wsUrl, jwt1, jwt2, slugArg] = process.argv
const slug = slugArg || 'yemekler'

function connect(jwt, label) {
  const url = `${wsUrl}?token=${encodeURIComponent(jwt)}&channel=draw`
  const ws = new WebSocket(url, { rejectUnauthorized: false })
  ws._label = label
  ws.on('open', () => console.log(`[${label}] open`))
  ws.on('error', (e) => console.error(`[${label}] err`, e.message))
  ws.on('message', (buf) => {
    let data
    try { data = JSON.parse(buf.toString()) } catch (_e) { return }
    console.log(`[${label}] <-`, data.type, summarize(data))
    ws._last = data
  })
  return ws
}

function summarize(d) {
  if (d.type === 'draw_lobby_snapshot') return `system=${d.systemRooms?.length} community=${d.communityRooms?.length}`
  if (d.type === 'draw_room_state') return `state=${d.state} players=${d.players?.length} round=${d.currentRoundIndex}`
  if (d.type === 'draw_waiting') return `present=${d.present}/${d.required}`
  if (d.type === 'draw_final_scoreboard') return `scores=${d.scores?.length}`
  return ''
}

async function main() {
  if (!wsUrl || !jwt1 || !jwt2) {
    console.error('usage: node system-room-smoke.js <wsUrl> <jwt1> <jwt2> [slug]')
    process.exit(2)
  }

  const a = connect(jwt1, 'A')
  await new Promise((r) => a.on('open', r))
  a.send(JSON.stringify({ type: 'draw_lobby_subscribe' }))
  await new Promise((r) => setTimeout(r, 500))
  a.send(JSON.stringify({ type: 'draw_room_join', code: slug }))
  await new Promise((r) => setTimeout(r, 800))

  const b = connect(jwt2, 'B')
  await new Promise((r) => b.on('open', r))
  b.send(JSON.stringify({ type: 'draw_room_join', code: slug }))

  console.log('--- watching for ~12 s, then exit ---')
  await new Promise((r) => setTimeout(r, 12_000))
  a.close()
  b.close()
}

main().catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Run it (manual, requires two valid JWTs)**

```bash
node parolla-ws/scripts/manual/system-room-smoke.js \
  ws://0.0.0.0:1881 "<jwt1>" "<jwt2>" yemekler
```
Expected:
- `[A] <- draw_lobby_snapshot system=N community=M`
- `[A] <- draw_room_state state=waiting`
- `[A] <- draw_waiting present=1/2`
- After B joins: `state=picking` or `drawing`, eventually `draw_word_options` for the drawer.

(Skip in autonomous runs without valid JWTs; report as "manual-only" verification step.)

- [ ] **Step 3: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla-ws
git add scripts/manual/system-room-smoke.js
git commit -m "$(cat <<'EOF'
test(draw): smoke script for system-room waiting → start flow

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 8 — Frontend store + subscription wiring

### Task 14: Extend Vuex draw state for system rooms + waiting + final scoreboard

**Files:**
- Modify: `parolla/store/draw/state.js`

- [ ] **Step 1: Add new state fields**

Replace the existing `state.js` returned object with the same fields plus these additions (keep existing ones intact):

```js
export default () => ({
  status: 'idle',
  channel: 'draw',
  publicRooms: [],          // legacy; kept for backward compat
  communityRooms: [],       // new — drives Topluluk Odaları tab
  systemRooms: [],          // new — drives Resmi Odalar tab
  lobbySubscribed: false,
  roomKind: null,           // 'community' | 'system' | null
  room: null,
  players: [],
  hostId: null,
  myId: null,
  roundIndex: 0,
  roundCount: 0,
  drawerId: null,
  drawerName: null,
  nextDrawerId: null,
  nextDrawerName: null,
  nextRoundEndsAt: 0,
  currentWord: null,
  maskedWord: null,
  category: null,
  durationMs: 0,
  remainingMs: 0,
  pickEndsAt: 0,
  strokes: [],
  chat: [],
  wordOptions: null,
  pickTimeoutMs: 0,
  iAmDrawer: false,
  iAmHost: false,
  iGuessedCorrectly: false,
  correctGuesserIds: [],
  lastRoundResult: null,
  finalScores: null,
  finalNextRoundInMs: 0,    // new — system-room cycle timer
  waitingPresent: 0,        // new — current player count when state=waiting
  waitingRequired: 2,       // new
  lastError: null
})
```

- [ ] **Step 2: Lint**

Run: `cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla && npx eslint store/draw/state.js`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
git add store/draw/state.js
git commit -m "$(cat <<'EOF'
feat(draw): extend Vuex state for system rooms + waiting + final cycle

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 15: Add mutations for lobby snapshot/upsert/remove + waiting + final scoreboard

**Files:**
- Modify: `parolla/store/draw/mutations.js`

- [ ] **Step 1: Add new mutations at the end of the existing default export**

Inside the `export default { ... }` object, add (do not remove anything):

```js
  SET_LOBBY_SNAPSHOT(state, { systemRooms, communityRooms }) {
    state.systemRooms = Array.isArray(systemRooms) ? systemRooms : []
    state.communityRooms = Array.isArray(communityRooms) ? communityRooms : []
    state.publicRooms = state.communityRooms
    state.lobbySubscribed = true
  },
  UPSERT_LOBBY_ROOM(state, room) {
    if (!room || !room.code) return
    const list = room.kind === 'system' ? state.systemRooms : state.communityRooms
    const i = list.findIndex(r => r.code === room.code)
    if (i >= 0) list.splice(i, 1, room)
    else list.push(room)
    if (room.kind !== 'system') state.publicRooms = state.communityRooms
  },
  REMOVE_LOBBY_ROOM(state, code) {
    state.systemRooms = state.systemRooms.filter(r => r.code !== code)
    state.communityRooms = state.communityRooms.filter(r => r.code !== code)
    state.publicRooms = state.communityRooms
  },
  SET_LOBBY_SUBSCRIBED(state, v) {
    state.lobbySubscribed = !!v
  },
  SET_ROOM_KIND(state, kind) {
    state.roomKind = kind || null
  },
  SET_WAITING(state, { present, required }) {
    state.waitingPresent = present || 0
    state.waitingRequired = required || 2
  },
  SET_FINAL_SCOREBOARD(state, { scores, nextRoundInMs }) {
    state.finalScores = Array.isArray(scores) ? scores : null
    state.finalNextRoundInMs = nextRoundInMs || 0
  },
```

- [ ] **Step 2: Inside `SET_ROOM_STATE` (existing mutation), set `state.roomKind`**

Find `SET_ROOM_STATE(state, payload)`. Near the top of its body, add:
```js
    state.roomKind = payload.kind || null
```

- [ ] **Step 3: Lint**

Run: `npx eslint store/draw/mutations.js`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
git add store/draw/mutations.js
git commit -m "$(cat <<'EOF'
feat(draw): add lobby + waiting + final scoreboard mutations

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 16: Wire new message types in actions.handleMessage

**Files:**
- Modify: `parolla/store/draw/actions.js`

- [ ] **Step 1: Add new message-type branches to the switch**

In `handleMessage`'s switch, add:

```js
      case wsTypeEnum.DRAW_LOBBY_SNAPSHOT:
        commit('SET_LOBBY_SNAPSHOT', {
          systemRooms: message.systemRooms,
          communityRooms: message.communityRooms,
        })
        break
      case wsTypeEnum.DRAW_LOBBY_ROOM_UPSERT:
        commit('UPSERT_LOBBY_ROOM', message.room)
        break
      case wsTypeEnum.DRAW_LOBBY_ROOM_REMOVE:
        commit('REMOVE_LOBBY_ROOM', message.code)
        break
      case wsTypeEnum.DRAW_WAITING:
        commit('SET_WAITING', { present: message.present, required: message.required })
        break
      case wsTypeEnum.DRAW_FINAL_SCOREBOARD:
        commit('SET_FINAL_SCOREBOARD', {
          scores: message.scores,
          nextRoundInMs: message.nextRoundInMs,
        })
        break
```

- [ ] **Step 2: Lint**

Run: `npx eslint store/draw/actions.js`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
git add store/draw/actions.js
git commit -m "$(cat <<'EOF'
feat(draw): handle new lobby + waiting + final scoreboard WS messages

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 9 — Frontend lobby UI

### Task 17: Extract CommunityRoomList component (no behavior change)

**Files:**
- Create: `parolla/components/Draw/CommunityRoomList/CommunityRoomList.component.vue`
- Create: `parolla/components/Draw/CommunityRoomList/CommunityRoomList.component.scss`
- Modify: `parolla/pages/DrawMode/DrawLobby/index.vue` (extract into the new component)

- [ ] **Step 1: Read current `DrawLobby/index.vue`**

Skim it; identify the public-rooms list, the "Yeni Oda" button, and the join-by-code field. These three blocks move into `CommunityRoomList`.

- [ ] **Step 2: Create the new component**

```html
<template lang="pug">
.community-room-list
  .community-room-list__top
    Button(type="primary" block round @click="$emit('create')") Yeni Oda
    Field(
      :model-value="joinCode"
      placeholder="6 haneli kod"
      maxlength="6"
      @input="onCodeInput"
    )
    Button(plain block round :disabled="!canJoin" @click="onJoin") Kodla Katıl

  .community-room-list__empty(v-if="!communityRooms.length") Açık oda yok.

  .community-room-list__rooms(v-else)
    .community-room-list__room(
      v-for="r in communityRooms"
      :key="r.code"
      @click="$emit('join', r.code)"
    )
      .community-room-list__room-title {{ r.hostName || r.code }}
      .community-room-list__room-meta {{ r.playerCount }}/{{ r.capacity }} · {{ stateLabel(r.state) }}
</template>

<script>
import { defineComponent, ref, computed } from '@nuxtjs/composition-api'
import { Button, Field } from 'vant'

const STATE_LABELS = {
  lobby: 'Bekliyor',
  picking: 'Seçiliyor',
  drawing: 'Çiziliyor',
  roundEnd: 'Tur bitti'
}

export default defineComponent({
  components: { Button, Field },
  props: {
    communityRooms: { type: Array, default: () => [] }
  },
  emits: ['create', 'join'],
  setup(_, { emit }) {
    const joinCode = ref('')
    const canJoin = computed(() => joinCode.value.length === 6)
    const onCodeInput = v => {
      joinCode.value = String(v || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 6)
    }
    const onJoin = () => {
      if (canJoin.value) emit('join', joinCode.value)
    }
    const stateLabel = s => STATE_LABELS[s] || s
    return { joinCode, canJoin, onCodeInput, onJoin, stateLabel }
  }
})
</script>

<style src="./CommunityRoomList.component.scss" lang="scss" scoped />
```

- [ ] **Step 3: Create the scss file**

```scss
.community-room-list {
  &__top {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  &__empty {
    text-align: center;
    color: #999;
    padding: 24px 0;
  }

  &__rooms {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__room {
    padding: 12px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    cursor: pointer;

    &-title { font-weight: 600; }
    &-meta { color: #999; font-size: 12px; }
  }
}
```

- [ ] **Step 4: Lint**

Run: `npx eslint components/Draw/CommunityRoomList/CommunityRoomList.component.vue`
Expected: no output.

- [ ] **Step 5: Commit (component only — DrawLobby integration in next task)**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
git add components/Draw/CommunityRoomList/
git commit -m "$(cat <<'EOF'
feat(draw): extract CommunityRoomList component

Self-contained — used by DrawLobby once tabs are wired.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 18: Create SystemRoomList component

**Files:**
- Create: `parolla/components/Draw/SystemRoomList/SystemRoomList.component.vue`
- Create: `parolla/components/Draw/SystemRoomList/SystemRoomList.component.scss`

- [ ] **Step 1: Write the .vue**

```html
<template lang="pug">
.system-room-list
  .system-room-list__empty(v-if="!grouped.length") Resmi oda yok.

  .system-room-list__group(
    v-for="g in grouped"
    :key="g.slug"
  )
    h4.system-room-list__group-title {{ g.title }}

    .system-room-list__cards
      .system-room-list__card(
        v-for="r in g.rooms"
        :key="r.code"
        @click="$emit('join', linkFor(r))"
      )
        .system-room-list__card-title
          | {{ g.title }}
          span.system-room-list__card-sub(v-if="r.subIndex > 1") &nbsp;#{{ r.subIndex }}
        .system-room-list__card-meta
          | {{ r.playerCount }}/{{ r.capacity }} ·
          | {{ stateLabel(r) }}
</template>

<script>
import { defineComponent, computed } from '@nuxtjs/composition-api'

const STATE_LABELS = {
  waiting: 'Oyuncular bekleniyor',
  picking: 'Kelime seçiliyor',
  drawing: 'Çiziliyor',
  roundEnd: 'Tur bitti',
  finalScoreboard: 'Final'
}

function stateLabelFor(r) {
  if (r.state === 'waiting') return STATE_LABELS.waiting
  if (r.state === 'finalScoreboard') return STATE_LABELS.finalScoreboard
  return `Tur ${(r.currentRoundIndex || 0) + 1}/50`
}

export default defineComponent({
  props: {
    systemRooms: { type: Array, default: () => [] }
  },
  emits: ['join'],
  setup(props) {
    const grouped = computed(() => {
      const map = new Map()
      for (const r of props.systemRooms) {
        if (!map.has(r.slug)) {
          map.set(r.slug, { slug: r.slug, title: r.categoryTitle || r.slug, rooms: [] })
        }
        map.get(r.slug).rooms.push(r)
      }
      // Sort sub-rooms by subIndex
      for (const g of map.values()) g.rooms.sort((a, b) => (a.subIndex || 1) - (b.subIndex || 1))
      return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title, 'tr'))
    })
    const linkFor = r => r.subIndex > 1 ? `${r.slug}-${r.subIndex}` : r.slug
    return { grouped, linkFor, stateLabel: stateLabelFor }
  }
})
</script>

<style src="./SystemRoomList.component.scss" lang="scss" scoped />
```

- [ ] **Step 2: Write the scss**

```scss
.system-room-list {
  &__empty {
    text-align: center;
    color: #999;
    padding: 24px 0;
  }

  &__group {
    margin-bottom: 16px;

    &-title {
      font-size: 14px;
      color: #666;
      margin: 0 0 8px;
    }
  }

  &__cards {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__card {
    padding: 12px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    cursor: pointer;

    &-title { font-weight: 600; }
    &-sub { color: #ff7878; }
    &-meta { color: #999; font-size: 12px; margin-top: 4px; }
  }
}
```

- [ ] **Step 3: Lint**

Run: `npx eslint components/Draw/SystemRoomList/SystemRoomList.component.vue`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
git add components/Draw/SystemRoomList/
git commit -m "$(cat <<'EOF'
feat(draw): add SystemRoomList component (category-grouped)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 19: Rewrite DrawLobby/index.vue to use Vant Tabs + subscribe lifecycle

**Files:**
- Modify: `parolla/pages/DrawMode/DrawLobby/index.vue`

- [ ] **Step 1: Read current file to capture existing imports + behaviors**

Open `pages/DrawMode/DrawLobby/index.vue` to capture the structure (already partially seen — uses `useDrawSocket`, `useDrawCreateDialog`, etc.).

- [ ] **Step 2: Replace template and script with tab-based layout**

```html
<template lang="pug">
.draw-lobby
  .draw-lobby__header
    h2 Çiz
  Tabs(v-model="activeTab" :swipeable="false" :line-width="40")
    Tab(name="official" title="Resmi Odalar")
      SystemRoomList(:system-rooms="systemRooms" @join="onJoin")
    Tab(name="community" title="Topluluk Odaları")
      CommunityRoomList(
        :community-rooms="communityRooms"
        @create="onCreate"
        @join="onJoin"
      )

  DrawRoomCreateDialog(
    v-if="showCreate"
    @close="showCreate = false"
    @submit="submitCreate"
  )
</template>

<script>
import { defineComponent, computed, ref, onMounted, onBeforeUnmount, getCurrentInstance } from '@nuxtjs/composition-api'
import { Tab, Tabs } from 'vant'
import SystemRoomList from '@/components/Draw/SystemRoomList/SystemRoomList.component.vue'
import CommunityRoomList from '@/components/Draw/CommunityRoomList/CommunityRoomList.component.vue'
import DrawRoomCreateDialog from '@/components/Draw/DrawRoomCreateDialog/DrawRoomCreateDialog.component.vue'
import { wsTypeEnum } from '@/enums/wsType.enum'
import { useDrawSocket } from '@/composables/useDrawSocket'

export default defineComponent({
  components: { Tab, Tabs, SystemRoomList, CommunityRoomList, DrawRoomCreateDialog },
  layout: 'Default/Default.layout',
  middleware: 'auth',
  setup() {
    const { send } = useDrawSocket()
    const vm = getCurrentInstance().proxy
    const store = vm.$store
    const router = vm.$router

    const activeTab = ref('official')
    const showCreate = ref(false)

    const systemRooms = computed(() => store.state.draw.systemRooms)
    const communityRooms = computed(() => store.state.draw.communityRooms.length
      ? store.state.draw.communityRooms
      : store.state.draw.publicRooms)

    onMounted(() => {
      send(wsTypeEnum.DRAW_LOBBY_SUBSCRIBE)
    })
    onBeforeUnmount(() => {
      send(wsTypeEnum.DRAW_LOBBY_UNSUBSCRIBE)
    })

    const onCreate = () => { showCreate.value = true }
    const submitCreate = settings => {
      send(wsTypeEnum.DRAW_ROOM_CREATE, { settings })
      showCreate.value = false
    }
    const onJoin = code => {
      router.push(vm.localePath({ name: 'DrawMode-DrawRoom-_code', params: { code } }))
    }

    return { activeTab, systemRooms, communityRooms, showCreate, onCreate, submitCreate, onJoin }
  }
})
</script>
```

(Adjust `router.push` to whatever route name the current lobby already uses; if the existing code path is `/ciz/oda/<code>` via raw push, just `router.push('/ciz/oda/' + code)`.)

- [ ] **Step 3: Add scoped styles or import existing**

Reuse the existing `index.scss` if any, or add minimal:

```scss
<style lang="scss" scoped>
.draw-lobby {
  padding: 16px;
  &__header h2 { margin: 0 0 12px; }
}
</style>
```

- [ ] **Step 4: Lint**

Run: `npx eslint pages/DrawMode/DrawLobby/index.vue`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
git add pages/DrawMode/DrawLobby/index.vue
git commit -m "$(cat <<'EOF'
feat(draw): tabbed lobby — Resmi Odalar (default) + Topluluk Odaları

Subscribes to the draw lobby on mount and unsubscribes on unmount so the
room cards stay in sync without page refresh.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 10 — DrawRoom kind awareness + canvas overlays

### Task 20: DrawRoom — hide host UI for system rooms

**Files:**
- Modify: `parolla/pages/DrawMode/DrawRoom/_code.vue`

- [ ] **Step 1: Read existing setup**

Open the file. Find where host-only controls render (e.g., a "Oyunu Başlat" button, kick buttons, capacity/round count display). They're driven by `state.draw.iAmHost` typically.

- [ ] **Step 2: Add `roomKind` to template guards**

Pull `roomKind` from the store:
```js
const roomKind = computed(() => store.state.draw.roomKind)
```

Wrap host-only UI blocks with `v-if="roomKind !== 'system' && iAmHost"`.

For the round counter, format `Tur {{ roundIndex+1 }}/{{ roomKind === 'system' ? 50 : roundCount }}`.

- [ ] **Step 3: Lint**

Run: `npx eslint pages/DrawMode/DrawRoom/_code.vue`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
git add pages/DrawMode/DrawRoom/_code.vue
git commit -m "$(cat <<'EOF'
feat(draw): hide host controls in system (official) rooms

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 21: DrawCanvas — waiting overlay

**Files:**
- Modify: `parolla/components/Draw/DrawCanvas/DrawCanvas.component.vue`
- Modify: `parolla/components/Draw/DrawCanvas/DrawCanvas.component.scss`

- [ ] **Step 1: Add the overlay markup**

Inside the root template element of DrawCanvas, after the canvas element, add:

```pug
.draw-canvas__overlay(v-if="isWaiting")
  .draw-canvas__overlay-card
    .draw-canvas__overlay-title Oyuncular bekleniyor
    .draw-canvas__overlay-meta {{ waitingPresent }}/{{ waitingRequired }}
.draw-canvas__overlay(v-else-if="isFinal")
  .draw-canvas__overlay-card
    .draw-canvas__overlay-title Final Sonucu
    ol.draw-canvas__overlay-scores
      li(v-for="s in finalScores" :key="s.playerId")
        span {{ s.name }}
        span {{ s.score }}
    .draw-canvas__overlay-meta Yeni döngü {{ finalCountdown }}sn içinde
```

- [ ] **Step 2: Wire computed props in the script**

Inside `setup()`:

```js
import { computed, onMounted, onBeforeUnmount, ref } from '@nuxtjs/composition-api'
// ...
const store = getCurrentInstance().proxy.$store
const isWaiting = computed(() => store.state.draw.room && store.state.draw.room.state === 'waiting')
const isFinal = computed(() => store.state.draw.room && store.state.draw.room.state === 'finalScoreboard')
const waitingPresent = computed(() => store.state.draw.waitingPresent)
const waitingRequired = computed(() => store.state.draw.waitingRequired)
const finalScores = computed(() => store.state.draw.finalScores || [])

const finalCountdown = ref(0)
let finalTimer = null
const startCountdown = () => {
  const target = Date.now() + (store.state.draw.finalNextRoundInMs || 0)
  if (finalTimer) clearInterval(finalTimer)
  finalTimer = setInterval(() => {
    finalCountdown.value = Math.max(0, Math.ceil((target - Date.now()) / 1000))
    if (finalCountdown.value === 0 && finalTimer) {
      clearInterval(finalTimer)
      finalTimer = null
    }
  }, 250)
}
watch(isFinal, v => { if (v) startCountdown() })
onBeforeUnmount(() => { if (finalTimer) clearInterval(finalTimer) })
```

(Add `watch` to the imports from `@nuxtjs/composition-api` if missing.)

- [ ] **Step 3: Add styles**

In `DrawCanvas.component.scss`, append:

```scss
.draw-canvas {
  position: relative;

  &__overlay {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  &__overlay-card {
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
    min-width: 240px;
    text-align: center;
  }

  &__overlay-title { font-weight: 700; margin-bottom: 8px; }
  &__overlay-meta { color: #999; margin-top: 8px; }
  &__overlay-scores {
    list-style: decimal inside;
    padding: 0;
    text-align: left;
    max-height: 180px;
    overflow: auto;

    li { display: flex; justify-content: space-between; margin: 4px 0; }
  }
}
```

(If `.draw-canvas` is already styled, just append the new selectors; don't duplicate the position rule.)

- [ ] **Step 4: Lint**

Run: `npx eslint components/Draw/DrawCanvas/DrawCanvas.component.vue && npx stylelint "components/Draw/DrawCanvas/DrawCanvas.component.scss"`
Expected: no output (or warnings only).

- [ ] **Step 5: Commit**

```bash
cd /Users/selim.doyranli/projects/selimdoyranli/github/parolla
git add components/Draw/DrawCanvas/
git commit -m "$(cat <<'EOF'
feat(draw): canvas overlays for waiting + finalScoreboard states

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 11 — End-to-end verification

### Task 22: Manual end-to-end smoke

**Verification flow (run after all previous tasks are committed and `pnpm dev` in all three repos):**

- [ ] **Step 1:** `cd parolla-strapi && pnpm dev` (Strapi listening on 1337 with DrawWordCategory + DrawWord seeded).
- [ ] **Step 2:** `cd parolla-ws && npm run dev` — confirm console shows `[draw] system rooms ready: N categories` and no errors.
- [ ] **Step 3:** `cd parolla && pnpm dev` — open `/ciz`. Default tab should be "Resmi Odalar"; cards for each active category should appear.
- [ ] **Step 4:** Click on a category card (e.g. Yemekler) → URL becomes `/ciz/oda/yemekler`, canvas shows the "Oyuncular bekleniyor (1/2)" overlay.
- [ ] **Step 5:** Open the same URL in a second browser session (different user) → both reach `picking` / `drawing`; play one round normally.
- [ ] **Step 6:** Open `/ciz` lobby in a third tab → confirm the player count on the Yemekler card updates without manual refresh; round-tur counter updates as turns advance.
- [ ] **Step 7:** Switch tab to "Topluluk Odaları" → existing flow intact; "Yeni Oda" still works.
- [ ] **Step 8:** Saturate Yemekler #1 to capacity, then add one more player → that player lands in `/ciz/oda/yemekler-2`; lobby card list shows the new sub-room.
- [ ] **Step 9:** Have everyone leave the sub-room. Within ≤90 s the card disappears from the lobby (60 s empty threshold + up to 30 s GC interval).
- [ ] **Step 10:** Stay in a single 2-player game and let it run through 50 rounds → final scoreboard overlay shows, ~15 s later resets to round 1 / round counter at top reads `Tur 1/50`.

If any of these steps fail, re-open the task that introduced the change, fix, recommit.

---

## Final Self-review checklist

Before declaring done:

- [ ] All 22 tasks committed (one commit per task in their respective repos).
- [ ] `pnpm typecheck` (parolla-strapi) clean, `npx eslint` (parolla & parolla-ws) clean.
- [ ] All commits use Conventional Commits and the trailer `Co-Authored-By: Claude Opus 4.7 (1M context)`.
- [ ] Spec file (`docs/superpowers/specs/2026-05-30-draw-system-rooms-design.md`) still committed and unmodified by the implementation.
