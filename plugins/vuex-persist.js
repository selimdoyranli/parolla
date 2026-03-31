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
          : {}
    })
  }).plugin(store)
}
