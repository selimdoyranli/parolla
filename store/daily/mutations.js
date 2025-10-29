import { GAME_TIME_LIMIT } from '@/system/constant'
import { userTransformer } from '@/transformers'

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
  },

  SET_DAILY_PLAYING_COUNT(state, count) {
    state.dailyPlayingCount = count
  },

  SET_DAILY_SCORES(state, dailyScore) {
    state.dailyScore = {
      items: dailyScore.data,
      meta: dailyScore.meta
    }
  },

  SET_LEADERBOARD(state, leaderboard) {
    const mappedLeaderboard = leaderboard => {
      return leaderboard?.map(scorer => ({
        ...userTransformer(scorer.user),
        ...(scorer.results && { results: scorer.results })
      }))
    }

    state.leaderboard = mappedLeaderboard(leaderboard)
  }
}
