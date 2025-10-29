export default {
  isGameOver(state) {
    return state.isGameOver
  },

  alphabet(state) {
    return state.alphabet
  },

  questions(state) {
    return state.questions
  },

  countdown(state) {
    return state.countdown
  },

  correctAnswers(state) {
    return state.alphabet.items.filter(item => item.isCorrect)
  },

  wrongAnswers(state) {
    return state.alphabet.items.filter(item => item.isWrong)
  },

  passedAnswers(state) {
    return state.alphabet.items.filter(item => item.isPassed)
  },

  dialog(state) {
    return state.dialog
  },

  dailyPlayingCount(state) {
    return state.dailyPlayingCount
  },

  dailyScores(state) {
    return state.dailyScore
  },

  leaderboard(state) {
    return state.leaderboard
  }
}
