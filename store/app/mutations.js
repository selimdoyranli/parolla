export default {
  SET_IS_OPEN_INTRO_HOW_TO_PLAY(state, isOpen) {
    state.isOpenIntroHowToPlay = isOpen
  },

  SET_WS(state, ws) {
    state.ws = ws
  },
  SET_IS_ACTIVE_REACTION_SOUND_FX(state, isActive) {
    state.soundFx.reactionActive = isActive
  },
  SET_IS_ACTIVE_GAME_SCENE_SOUND_FX(state, isActive) {
    state.soundFx.gameSceneActive = isActive
  }
}
