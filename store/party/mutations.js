import state from './state'

const CHAT_CAP = 100
const EMOJI_CAP = 30
let emojiSeq = 0

const resetGame = s => {
  s.round = null
  s.answered = { answered: 0, total: 0 }
  s.votes = null
  s.myAnswer = null
  s.retry = null
  s.roundEnd = null
  s.final = null
  s.cancelled = null
}

export default {
  SET_STATUS(s, v) {
    s.status = v
  },
  SET_MY_ID(s, id) {
    s.myId = id
  },
  SET_ROOM_STATE(s, room) {
    s.room = room

    if (room && room.state === 'lobby') resetGame(s)
  },
  ROUND_START(s, msg) {
    resetGame(s)
    s.round = { ...msg, receivedAt: Date.now() }
  },
  ANSWER_ACK(s, text) {
    s.myAnswer = text
    s.retry = null
  },
  ANSWER_RETRY(s, msg) {
    s.retry = { reason: msg.reason, letter: msg.letter }
  },
  SET_PROGRESS(s, msg) {
    s.answered = { answered: msg.answered, total: msg.total }
  },
  SET_VOTES(s, msg) {
    s.votes = msg

    // the server cuts the round short once everyone has voted: resync the countdown in place
    // (a new round object would make the choices scene reset the player's local vote)
    if (s.round && typeof msg.remainingMs === 'number') {
      s.round.remainingMs = msg.remainingMs
      s.round.receivedAt = Date.now()
    }
  },
  ROUND_END(s, msg) {
    s.roundEnd = msg
    s.retry = null
  },
  FINAL(s, msg) {
    s.final = msg
  },
  CANCELLED(s, msg) {
    s.cancelled = msg
  },
  CLOSED(s, reason) {
    s.closedReason = reason || 'empty'
  },
  PUSH_CHAT(s, msg) {
    // server replays history on every (re)join
    if (s.chat.some(c => c.timestamp === msg.timestamp && c.playerId === msg.playerId && c.message === msg.message)) return

    s.chat = [...s.chat, msg].slice(-CHAT_CAP)
  },
  PUSH_EMOJI(s, msg) {
    s.emojis = [...s.emojis, { ...msg, key: ++emojiSeq }].slice(-EMOJI_CAP)
  },
  REMOVE_EMOJI(s, key) {
    s.emojis = s.emojis.filter(e => e.key !== key)
  },
  SET_ERROR(s, err) {
    s.error = err
  },
  RESET(s) {
    Object.assign(s, state())
  }
}
