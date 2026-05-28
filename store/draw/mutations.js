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
    state.players = payload.players || []
    state.hostId = payload.hostId
    state.roundIndex = payload.currentRoundIndex || 0
    state.roundCount = payload.roundCount || 0
    state.iAmHost = state.myId === payload.hostId
    state.iAmDrawer = state.myId === payload.currentDrawerId
    state.drawerId = payload.currentDrawerId || null
    state.nextDrawerId = payload.nextDrawerId || null
    state.nextDrawerName = payload.nextDrawerName || null
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
    state.chat.push({
      isSystem: true,
      message: `Tebrikler! Doğru tahmin: ${payload.word} (+${payload.scoreEarned})`,
      timestamp: Date.now()
    })
  },
  PUSH_CLOSE_GUESS(state, guess) {
    state.chat.push({
      isSystem: true,
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
  SET_ERROR(state, e) {
    state.lastError = e
  }
}
