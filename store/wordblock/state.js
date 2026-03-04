const defaultGameState = () => ({
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
  }
})

export default () => ({
  games: {
    5: defaultGameState(),
    6: defaultGameState(),
    7: defaultGameState()
  },
  dailyPlayingCount: 0
})
