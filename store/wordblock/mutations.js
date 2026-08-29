import { userTransformer } from '@/transformers'
import { resolveGame } from './game'

// Flatten a leaderboard row into the shape PlayerAvatar/Leaderboard expect: the user
// fields at the top level, with the game results kept alongside.
const mapScorers = leaderboard =>
  leaderboard?.map(scorer => ({
    ...userTransformer(scorer.user),
    rank: scorer.rank,
    ...(scorer.results && { results: scorer.results })
  }))

export default {
  SET_TARGET_WORD(state, { locale, charLength, word }) {
    resolveGame(state, locale, charLength).targetWord = word.toLocaleUpperCase(locale)
  },

  SET_CURRENT_DATE(state, { locale, charLength, date }) {
    resolveGame(state, locale, charLength).currentDate = date
  },

  SET_IS_GAME_OVER(state, { locale, charLength, isGameOver }) {
    resolveGame(state, locale, charLength).isGameOver = isGameOver
  },

  SET_GAME_RESULT(state, { locale, charLength, result }) {
    resolveGame(state, locale, charLength).result = result
  },

  SET_IS_OPEN_HOW_TO_PLAY_DIALOG(state, { locale, charLength, isOpen }) {
    resolveGame(state, locale, charLength).dialog.howToPlay.isOpen = isOpen
  },

  SET_IS_OPEN_STATS_DIALOG(state, { locale, charLength, isOpen }) {
    resolveGame(state, locale, charLength).dialog.stats.isOpen = isOpen
  },

  SET_DAILY_PLAYING_COUNT(state, count) {
    state.dailyPlayingCount = count
  },

  SET_IS_ACTIVE_KEYBOARD(state, isActive) {
    state.isActiveKeyboard = isActive
  },

  SET_LEADERBOARD(state, { leaderboard, meta }) {
    state.leaderboard.items = mapScorers(leaderboard)
    state.leaderboard.meta = meta
  },

  SET_USER_RANK(state, userRank) {
    state.userRank = userRank
  },

  SET_TODAYS_LEADERS(state, { charLength, leaderboard, meta }) {
    const slot = state.todaysLeaders[charLength]

    if (!slot) return

    slot.items = mapScorers(leaderboard)
    slot.meta = meta
  }
}
