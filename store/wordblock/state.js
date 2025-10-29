export default () => ({
  targetWord: '',
  isGameOver: false,
  currentDate: null,
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
  },
  dailyPlayingCount: 0
})
