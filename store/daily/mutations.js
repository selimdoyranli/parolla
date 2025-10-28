import { GAME_TIME_LIMIT } from '@/system/constant'

export default {
  SET_CURRENT_DATE(state, date) {
    state.currentDate = date
  },

  SET_ALPHABET(state, alphabet) {
    state.alphabet = alphabet
  },

  SET_IS_GAME_OVER(state, { isGameOver }) {
    state.isGameOver = isGameOver
  },

  SET_QUESTIONS(state, { questions }) {
    state.questions = questions
  },

  SET_ALPHABET_ACTIVE_INDEX(state, index) {
    state.alphabet.activeIndex = index
  },

  UPDATE_COUNTDOWN_REMAIN_TIME(state, remainTime) {
    state.countdown.remainTime = remainTime
  },

  UPDATE_COUNTDOWN_TIMER(state, ms) {
    state.countdown.time = ms
  },

  RESET_COUNTDOWN_TIMER(state) {
    state.countdown.time = GAME_TIME_LIMIT
  },

  RESET_ALPHABET(state) {
    state.alphabet.activeIndex = 0

    state.alphabet.items.forEach(item => {
      item.isPassed = false
      item.isWrong = false
      item.isCorrect = false
    })
  },

  SET_IS_OPEN_STATS_DIALOG(state, isOpen) {
    state.dialog.stats.isOpen = isOpen
  }
}
