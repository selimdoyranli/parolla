export default {
  SET_IS_GAME_OVER(state, isGameOver) {
    state.isGameOver = isGameOver
  },

  SET_GAME_RESULT(state, result) {
    state.result = result
  },

  SET_IS_OPEN_HOW_TO_PLAY_DIALOG(state, isOpen) {
    state.dialog.howToPlay.isOpen = isOpen
  },

  SET_IS_OPEN_STATS_DIALOG(state, isOpen) {
    state.dialog.stats.isOpen = isOpen
  },

  SET_DAILY_PLAYING_COUNT(state, count) {
    state.dailyPlayingCount = count
  }
}
