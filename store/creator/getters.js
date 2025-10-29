export default {
  rooms(state) {
    return state.room.list
  },

  roomsPagination(state) {
    return state.room.pagination
  },

  roomTotal(state) {
    return state.room.total
  },

  room(state) {
    return state.room.room
  },

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

  scoreboard(state) {
    return state.scoreboard
  },

  scoreboardPagination(state) {
    return state.scoreboard.pagination
  },

  todaysSolvedTotalQuiz(state) {
    return state.todaysSolvedTotalQuiz
  },

  todaysQuiz(state) {
    return state.todaysQuiz
  }
}
