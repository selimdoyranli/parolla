export default {
  targetWord: state => charLength => {
    return state.games[charLength].targetWord
  },

  isGameOver: state => charLength => {
    return state.games[charLength].isGameOver
  },

  currentDate: state => charLength => {
    return state.games[charLength].currentDate
  },

  result: state => charLength => {
    return state.games[charLength].result
  },

  dialog: state => charLength => {
    return state.games[charLength].dialog
  },

  dailyPlayingCount(state) {
    return state.dailyPlayingCount
  }
}
