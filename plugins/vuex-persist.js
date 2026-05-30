import VuexPersistence from 'vuex-persist'

export default ({ store }) => {
  new VuexPersistence({
    key: 'persistStore',
    reducer: state => ({
      auth: {
        user: state.auth.user
      },
      app: {
        soundFx: state.app.soundFx
      },
      daily: {
        isGameOver: state.daily.isGameOver,
        currentDate: state.daily.currentDate,
        questions: state.daily.questions
      },
      wordblock:
        state.wordblock && state.wordblock.games
          ? {
              games: state.wordblock.games,
              isActiveKeyboard: state.wordblock.isActiveKeyboard
            }
          : {},
      tycoon:
        state.tycoon && state.tycoon['knowledge-kingdom']
          ? {
              'knowledge-kingdom': {
                economyVersion: state.tycoon['knowledge-kingdom'].economyVersion,
                gold: state.tycoon['knowledge-kingdom'].gold,
                ownedItems: state.tycoon['knowledge-kingdom'].ownedItems
              }
            }
          : {},
      guest: state.guest
        ? {
            id: state.guest.id,
            name: state.guest.name,
            avatarSeed: state.guest.avatarSeed
          }
        : {}
    })
  }).plugin(store)

  // One-shot migration: returning users may have the legacy single-flag
  // soundFx.isActive. Map it to both new flags, then drop the old key so
  // future saves don't keep it around.
  const sfx = store.state.app.soundFx

  if (sfx && typeof sfx.isActive === 'boolean') {
    store.commit('app/SET_IS_ACTIVE_REACTION_SOUND_FX', sfx.isActive)
    store.commit('app/SET_IS_ACTIVE_GAME_SCENE_SOUND_FX', sfx.isActive)
    delete sfx.isActive
  }
}
