export default {
  user(state) {
    return state.user
  },
  joinedCommunities(state) {
    return state.user?.joinedCommunities || []
  },
  ownedCommunities(state) {
    return state.user?.ownedCommunities || []
  },
  pendingCommunities(state) {
    return state.user?.pendingCommunities || []
  },
  // where the user may post a quiz: owned, or joined with open posting / moderator role
  postableCommunities(_, getters) {
    const joined = getters.joinedCommunities.filter(c => c.postPermission === 'everyone' || c.role === 'moderator')

    return [...getters.ownedCommunities, ...joined].filter((c, i, all) => all.findIndex(o => o.documentId === c.documentId) === i)
  },
  isOpenAuthDialog(state) {
    return state.dialog.auth.isOpen
  }
}
