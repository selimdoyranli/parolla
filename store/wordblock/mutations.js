export default {
  SET_TARGET_WORD(state, { charLength, word }) {
    state.games[charLength].targetWord = word.toLocaleUpperCase(this.$i18n.locale)
  },

  SET_CURRENT_DATE(state, { charLength, date }) {
    state.games[charLength].currentDate = date
  },

  SET_IS_GAME_OVER(state, { charLength, isGameOver }) {
    state.games[charLength].isGameOver = isGameOver
  },

  SET_GAME_RESULT(state, { charLength, result }) {
    state.games[charLength].result = result
  },

  SET_IS_OPEN_HOW_TO_PLAY_DIALOG(state, { charLength, isOpen }) {
    state.games[charLength].dialog.howToPlay.isOpen = isOpen
  },

  SET_IS_OPEN_STATS_DIALOG(state, { charLength, isOpen }) {
    state.games[charLength].dialog.stats.isOpen = isOpen
  },

  SET_DAILY_PLAYING_COUNT(state, count) {
    state.dailyPlayingCount = count
  }
}
