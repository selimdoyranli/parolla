export default {
  tourScoreOfUser(state) {
    return state.tourScoreOfUser
  },

  tour(state) {
    return state.tour
  },

  userList(state) {
    return state.userList
  },

  leaderboard(state) {
    return state.leaderboard
  },

  chatMessages(state) {
    return state.chat.messages
  },

  isChatFocused(state) {
    return state.chat.isFocused
  },

  dialog(state) {
    return state.dialog
  }
}
