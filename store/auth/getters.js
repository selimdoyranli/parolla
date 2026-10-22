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
  // where the user may post a quiz: owned or joined with open posting / moderator role, never hidden by moderation
  postableCommunities(_, getters) {
    const owned = getters.ownedCommunities.filter(c => !c.isHidden)
    const joined = getters.joinedCommunities.filter(c => !c.isHidden && (c.postPermission === 'everyone' || c.role === 'moderator'))

    return [...owned, ...joined].filter((c, i, all) => all.findIndex(o => o.documentId === c.documentId) === i)
  },
  isOpenAuthDialog(state) {
    return state.dialog.auth.isOpen
  }
}
