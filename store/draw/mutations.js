import { drawRoomKindEnum } from '@/enums/drawRoomKind.enum'

export default {
  SET_STATUS(state, s) {
    state.status = s
  },
  SET_MY_ID(state, id) {
    state.myId = id
  },
  SET_PUBLIC_ROOMS(state, list) {
    state.publicRooms = list || []
  },
  SET_ROOM_STATE(state, payload) {
    state.room = payload
    state.roomKind = payload.kind || null
    state.players = payload.players || []
    state.hostId = payload.hostId
    state.roundIndex = payload.currentRoundIndex || 0
    state.roundCount = payload.roundCount || 0
    state.iAmHost = state.myId === payload.hostId
    state.iAmDrawer = state.myId === payload.currentDrawerId
    state.drawerId = payload.currentDrawerId || null
    state.nextDrawerId = payload.nextDrawerId || null
    state.nextDrawerName = payload.nextDrawerName || null
    state.pickEndsAt = payload.pickEndsAt || 0

    // When the server flips the room back to 'lobby' (8 s after GAME_END,
    // or after a host restart) the client needs to drop every per-game
    // artefact too — otherwise finalScores stays truthy, the final overlay
    // covers the screen forever, and the host can't reach 'Yeniden Başlat'.
    if (payload.state === 'lobby') {
      state.finalScores = null
      state.lastRoundResult = null
      state.iGuessedCorrectly = false
      state.correctGuesserIds = []
      state.currentWord = null
      state.maskedWord = null
      state.wordOptions = null
      state.pickTimeoutMs = 0
      state.pickEndsAt = 0
      state.durationMs = 0
      state.remainingMs = 0
      state.strokes = []
      state.nextRoundEndsAt = 0
    }

    // System rooms loop 50-round cycles without ever entering 'lobby'. When
    // the cycle resets (next state is waiting / picking / drawing) drop the
    // previous final scoreboard so the overlay doesn't stick.
    if (payload.kind === drawRoomKindEnum.SYSTEM && payload.state !== 'finalScoreboard' && payload.state !== 'roundEnd') {
      state.finalScores = null
      state.finalNextRoundInMs = 0
    }
  },
  SET_WORD_OPTIONS(state, payload) {
    state.wordOptions = payload.words || null
    state.pickTimeoutMs = payload.timeoutMs || 0
  },
  CLEAR_WORD_OPTIONS(state) {
    state.wordOptions = null
    state.pickTimeoutMs = 0
  },
  ROUND_START(state, payload) {
    state.drawerId = payload.drawerId
    state.drawerName = payload.drawerName
    state.roundIndex = payload.roundIndex
    state.roundCount = payload.roundCount
    state.durationMs = payload.durationMs
    state.remainingMs = payload.durationMs
    state.currentWord = payload.word || null
    state.maskedWord = payload.maskedWord || null
    state.category = payload.category || null
    state.iAmDrawer = state.myId === payload.drawerId
    state.iGuessedCorrectly = false
    state.correctGuesserIds = []
    state.strokes = []
    state.lastRoundResult = null

    // Server transitions to 'drawing' here but does not always re-broadcast room_state.
    // Propagate locally so isDrawing getter and toolbar/canvas drawable react immediately.
    if (state.room) state.room.state = 'drawing'
  },
  TIME_UPDATE(state, ms) {
    state.remainingMs = ms
  },
  PUSH_STROKE(state, chunk) {
    state.strokes.push(chunk)
  },
  STROKE_END(/* state, _strokeId */) {
    // no-op: client tracks strokes inline via PUSH_STROKE
  },
  CLEAR_STROKES(state) {
    state.strokes = []
  },
  POP_STROKE(state) {
    state.strokes.pop()
  },
  APPLY_SNAPSHOT(state, payload) {
    state.strokes = payload.strokes || []
  },
  PUSH_CHAT(state, m) {
    state.chat.push(m)

    if (state.chat.length > 200) state.chat.shift()
  },
  MARK_GUESSED(state, payload) {
    state.iGuessedCorrectly = true

    if (state.myId != null && !state.correctGuesserIds.includes(state.myId)) {
      state.correctGuesserIds.push(state.myId)
    }

    state.chat.push({
      isSystem: true,
      systemKind: 'success',
      message: `Tebrikler! Doğru tahmin: ${payload.word} (+${payload.scoreEarned})`,
      timestamp: Date.now()
    })
  },
  MARK_PLAYER_GUESSED(state, playerId) {
    if (playerId != null && !state.correctGuesserIds.includes(playerId)) {
      state.correctGuesserIds.push(playerId)
    }
  },
  PUSH_CLOSE_GUESS(state, guess) {
    state.chat.push({
      isSystem: true,
      systemKind: 'warning',
      isCloseHint: true,
      message: 'Çok yakın!',
      guess,
      timestamp: Date.now()
    })
  },
  ROUND_END(state, payload) {
    state.lastRoundResult = payload
    state.currentWord = null
    state.maskedWord = null
    state.wordOptions = null
    state.nextDrawerId = payload.nextDrawerId || null
    state.nextDrawerName = payload.nextDrawerName || null
    state.nextRoundEndsAt = payload.nextRoundInMs ? Date.now() + payload.nextRoundInMs : 0

    if (state.room) state.room.state = 'roundEnd'
  },
  GAME_END(state, payload) {
    state.finalScores = payload.finalScores || []

    if (state.room) state.room.state = 'gameEnd'
  },
  RESET_FOR_NEW_GAME(state) {
    state.finalScores = null
    state.roundIndex = 0
    state.iGuessedCorrectly = false
  },
  // Wipe per-room state when the user leaves the room (back nav, leave
  // button, or kick). Without this, state.room.code lingers, so the
  // lobby's "code changed → push to room" watcher never fires on a
  // subsequent re-join of the SAME room.
  // Preserved: myId, status, lobby room lists, persisted guest identity.
  LEAVE_ROOM(state) {
    state.room = null
    state.roomKind = null
    state.players = []
    state.hostId = null
    state.iAmHost = false
    state.iAmDrawer = false
    state.drawerId = null
    state.drawerName = null
    state.nextDrawerId = null
    state.nextDrawerName = null
    state.roundIndex = 0
    state.roundCount = 0
    state.currentWord = null
    state.maskedWord = null
    state.category = null
    state.durationMs = 0
    state.remainingMs = 0
    state.pickEndsAt = 0
    state.nextRoundEndsAt = 0
    state.strokes = []
    state.chat = []
    state.wordOptions = null
    state.pickTimeoutMs = 0
    state.iGuessedCorrectly = false
    state.correctGuesserIds = []
    state.lastRoundResult = null
    state.finalScores = null
    state.finalNextRoundInMs = 0
    state.waitingPresent = 0
    state.waitingRequired = 2
    state.roomClosedReason = null
  },
  SET_ROOM_CLOSED(state, reason) {
    state.roomClosedReason = reason || 'closed'
  },
  SET_ERROR(state, e) {
    state.lastError = e
  },
  SET_LOBBY_SNAPSHOT(state, { systemRooms, communityRooms }) {
    state.systemRooms = Array.isArray(systemRooms) ? systemRooms : []
    state.communityRooms = Array.isArray(communityRooms) ? communityRooms : []
    state.publicRooms = state.communityRooms
    state.lobbySubscribed = true
  },
  UPSERT_LOBBY_ROOM(state, room) {
    if (!room || !room.code) return
    const list = room.kind === drawRoomKindEnum.SYSTEM ? state.systemRooms : state.communityRooms
    const i = list.findIndex(r => r.code === room.code)

    if (i >= 0) list.splice(i, 1, room)
    else list.push(room)

    if (room.kind !== drawRoomKindEnum.SYSTEM) state.publicRooms = state.communityRooms
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
  SET_WAITING(state, payload) {
    state.waitingPresent = payload.present || 0
    state.waitingRequired = payload.required || 2

    // WS sends DRAW_WAITING without a follow-up DRAW_ROOM_STATE (the room
    // state transition is conveyed by this message alone). Mirror it onto
    // state.room so the isWaiting getter fires immediately.
    if (state.room) state.room.state = 'waiting'
  },
  SET_FINAL_SCOREBOARD(state, payload) {
    state.finalScores = Array.isArray(payload.scores) ? payload.scores : null
    state.finalNextRoundInMs = payload.nextRoundInMs || 0

    // Same rationale as SET_WAITING: WS sends DRAW_FINAL_SCOREBOARD without a
    // paired DRAW_ROOM_STATE — flip the room state locally so isFinalScoreboard
    // and the overlay logic react in the same tick.
    if (state.room) state.room.state = 'finalScoreboard'
  }
}
