export default () => ({
  targetWord: '',
  isGameOver: false,
  result: {
    status: null,
    attempts: 0,
    word: '',
    guesses: [],
    elapsedTime: null
  },
  dialog: {
    howToPlay: {
      isOpen: false
    },
    stats: {
      isOpen: false
    }
  }
})
