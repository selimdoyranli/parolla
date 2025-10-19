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
      wordblock: {
        isGameOver: state.wordblock.isGameOver,
        currentDate: state.wordblock.currentDate,
        targetWord: state.wordblock.targetWord,
        result: state.wordblock.result
      }
    })
  }).plugin(store)
}
