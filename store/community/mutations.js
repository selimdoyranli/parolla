export default {
  SET_LIST(state, list) {
    state.list = list
  },
  SET_LIST_FILTERS(state, filters) {
    state.listFilters = { ...state.listFilters, ...filters }
  },
  SET_CURRENT_COMMUNITY(state, community) {
    state.currentCommunity = community
  },
  SET_APPROVED_MEMBERS(state, members) {
    state.approvedMembers = members
  },
  SET_PENDING_MEMBERS(state, members) {
    state.pendingMembers = members
  },
  SET_FEED(state, feed) {
    state.feed = feed
  },
  SET_COMPOSE_FORM(state, form) {
    state.composeForm = { ...state.composeForm, ...form }
  }
}
