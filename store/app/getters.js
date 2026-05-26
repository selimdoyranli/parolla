export default {
  root(state) {
    return state
  },

  ws(state) {
    return state.ws
  },

  isActiveReactionSoundFx(state) {
    return state.soundFx.reactionActive
  },
  isActiveGameSceneSoundFx(state) {
    return state.soundFx.gameSceneActive
  }
}
