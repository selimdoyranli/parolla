export default {
  id(state) {
    return state.id
  },
  username(state) {
    return state.username
  },
  player(state) {
    return state.player
  },
  isOpenPlayerDialog(state) {
    return state.dialog.player.isOpen
  },
  isOpenAvatarEditorDialog(state) {
    return state.dialog.avatarEditor.isOpen
  }
}
