export default {
  SET_IDENTITY(state, { id, name, avatarSeed }) {
    if (id !== undefined) state.id = id

    if (name !== undefined) state.name = name

    if (avatarSeed !== undefined) state.avatarSeed = avatarSeed
  },
  CLEAR_IDENTITY(state) {
    state.id = null
    state.name = null
    state.avatarSeed = null
  }
}
