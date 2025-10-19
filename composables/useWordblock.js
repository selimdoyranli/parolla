import { useStore, ref, computed, onMounted } from '@nuxtjs/composition-api'

/**
 * Game Status Enum
 */
const gameStatusEnum = Object.freeze({
  FIRST_START: 'firstStart',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost'
})

/**
 * Wordblock Game Logic
 *
 * A composable hook that manages the game state and logic for the Wordblock game.
 * Supports Turkish characters and provides clean methods for API integration.
 *
 * @returns {Object} Game state and methods
 */
export default () => {
  const store = useStore()

  // Demo word - will be replaced with API data
  const targetWord = computed(() => store.getters['wordblock/targetWord'])
  const WORD_LENGTH = computed(() => targetWord.value.length)
  const MAX_ATTEMPTS = 5

  const isGameOver = computed(() => store.getters['wordblock/isGameOver'])
  const gameResult = computed(() => store.getters['wordblock/result'])

  // Game state
  const currentAttempt = ref(0)
  const currentGuess = ref('')
  const guesses = ref([])
  const gameStatus = ref(gameStatusEnum.FIRST_START) // 'firstStart', 'playing', 'won', 'lost'
  const letterStates = ref({}) // Track letter states for visual feedback
  const startTime = ref(null)
  const endTime = ref(null)

  const startGame = () => {
    closeHowToPlayDialog()
    gameStatus.value = gameStatusEnum.PLAYING
    startTime.value = Date.now()
    store.commit('wordblock/SET_IS_GAME_OVER', false)
  }

  const endGame = () => {
    const day = new Date().toLocaleDateString('tr').slice(0, 10)

    store.commit('wordblock/SET_IS_GAME_OVER', true)
    store.commit('wordblock/SET_CURRENT_DATE', day)
    store.commit('wordblock/SET_GAME_RESULT', {
      status: gameStatus.value,
      attempts: currentAttempt.value,
      word: targetWord.value,
      guesses: guesses.value,
      elapsedTime: endTime.value && startTime.value ? endTime.value - startTime.value : null
    })
  }

  // Initialize guesses array
  const initializeGuesses = () => {
    guesses.value = Array(MAX_ATTEMPTS)
      .fill(null)
      .map(() => ({
        word: '',
        states: [] // 'correct', 'present', 'absent'
      }))
  }

  initializeGuesses()

  /**
   * Restore game state from persistStore when game is over
   * Populates the board cells with user's previous answers
   */
  const restoreGameState = () => {
    if (isGameOver.value && gameResult.value && gameResult.value.guesses && gameResult.value.guesses.length > 0) {
      // Restore guesses from store
      gameResult.value.guesses.forEach((guess, index) => {
        if (guess && guess.word && guess.states) {
          guesses.value[index] = {
            word: guess.word,
            states: guess.states,
            timestamp: guess.timestamp || null
          }
        }
      })

      // Restore game status
      if (gameResult.value.status === gameStatusEnum.WON) {
        gameStatus.value = gameStatusEnum.WON
      } else if (gameResult.value.status === gameStatusEnum.LOST) {
        gameStatus.value = gameStatusEnum.LOST
      }

      // Restore current attempt count
      currentAttempt.value = gameResult.value.attempts || gameResult.value.guesses.length

      // Restore keyboard letter states
      gameResult.value.guesses.forEach((guess, index) => {
        if (guess && guess.word && guess.states) {
          updateKeyboardStates(guess.word, guess.states)
        }
      })

      // Restore time data if available
      if (gameResult.value.elapsedTime) {
        endTime.value = gameResult.value.elapsedTime
      }
    }
  }

  /**
   * Normalize Turkish characters for comparison
   * Converts to uppercase Turkish locale
   */
  const normalizeTurkish = text => {
    return text.toLocaleUpperCase('tr-TR')
  }

  /**
   * Check if letter exists and count occurrences
   * Handles duplicate letters
   */
  const checkLetterState = (letter, position, guess) => {
    const targetLetter = targetWord.value[position]

    // Exact match - always correct
    if (letter === targetLetter) {
      return 'correct'
    }

    // Count occurrences in target word
    const targetLetterCount = targetWord.value.split('').filter(l => l === letter).length

    // Count how many times we've already marked this letter as correct
    const correctCount = guess.split('').filter((l, i) => l === letter && targetWord.value[i] === letter).length

    // Count how many times we've marked this letter as present before this position
    let presentCount = 0

    for (let i = 0; i < position; i++) {
      if (guess[i] === letter && targetWord.value[i] !== letter) {
        presentCount++
      }
    }

    // If letter exists in target and we haven't exceeded the count
    if (targetWord.value.includes(letter) && correctCount + presentCount < targetLetterCount) {
      return 'present'
    }

    return 'absent'
  }

  /**
   * Evaluate the guess and return states for each letter
   */
  const evaluateGuess = guess => {
    const states = []
    const normalizedGuess = normalizeTurkish(guess)

    for (let i = 0; i < normalizedGuess.length; i++) {
      const letter = normalizedGuess[i]
      const state = checkLetterState(letter, i, normalizedGuess)
      states.push(state)
    }

    return states
  }

  /**
   * Update keyboard letter states after animation delay
   * Called after cell reveal animations are complete
   */
  const updateKeyboardStates = (guess, states) => {
    const normalizedGuess = normalizeTurkish(guess)
    const newStates = { ...letterStates.value }

    for (let i = 0; i < normalizedGuess.length; i++) {
      const letter = normalizedGuess[i]
      const state = states[i]

      // Update letter states for keyboard coloring (priority: correct > present > absent)
      if (
        !newStates[letter] ||
        (newStates[letter] === 'absent' && state !== 'absent') ||
        (newStates[letter] === 'present' && state === 'correct')
      ) {
        newStates[letter] = state
      }
    }

    // Update the ref value with new object to trigger reactivity
    letterStates.value = newStates
  }

  /**
   * Submit the current guess
   * Returns result object with success status and game state
   */
  const submitGuess = () => {
    if (currentGuess.value.length !== WORD_LENGTH.value) {
      return { success: false, error: 'incomplete', message: 'Kelime tamamlanmamış' }
    }

    const normalizedGuess = normalizeTurkish(currentGuess.value)
    const states = evaluateGuess(normalizedGuess)

    guesses.value[currentAttempt.value] = {
      word: normalizedGuess,
      states,
      timestamp: Date.now()
    }

    // Check if won
    if (normalizedGuess === normalizeTurkish(targetWord.value)) {
      gameStatus.value = gameStatusEnum.WON
      endTime.value = Date.now()
      currentAttempt.value++ // Increment to show the winning row
      currentGuess.value = ''

      return {
        success: true,
        status: gameStatusEnum.WON,
        attempts: currentAttempt.value,
        elapsedTime: endTime.value - startTime.value
      }
    }

    // Move to next attempt
    currentAttempt.value++
    currentGuess.value = ''

    // Check if lost
    if (currentAttempt.value >= MAX_ATTEMPTS) {
      gameStatus.value = gameStatusEnum.LOST
      endTime.value = Date.now()

      return {
        success: true,
        status: gameStatusEnum.LOST,
        attempts: MAX_ATTEMPTS,
        elapsedTime: endTime.value - startTime.value,
        correctWord: targetWord.value
      }
    }

    return { success: true, status: 'continue' }
  }

  /**
   * Delete last letter from current guess
   */
  const deleteLetter = () => {
    if (currentGuess.value.length > 0) {
      currentGuess.value = currentGuess.value.slice(0, -1)
    }
  }

  /**
   * Add letter to current guess
   */
  const addLetter = letter => {
    if (currentGuess.value.length < WORD_LENGTH.value && gameStatus.value === gameStatusEnum.PLAYING) {
      currentGuess.value += normalizeTurkish(letter)
    }
  }

  /**
   * Handle input change with Turkish character support
   * Filters out invalid characters
   */
  const handleInputChange = value => {
    // Allow Turkish characters: A-Z, Ç, Ğ, İ, Ö, Ş, Ü
    const normalized = normalizeTurkish(value).replace(/[^A-ZÇĞİÖŞÜ]/g, '')

    if (normalized.length <= WORD_LENGTH.value) {
      currentGuess.value = normalized
    }
  }

  /**
   * Reset game to initial state
   */
  const resetGame = () => {
    currentAttempt.value = 0
    currentGuess.value = ''
    gameStatus.value = gameStatusEnum.FIRST_START
    startTime.value = null
    endTime.value = null
    letterStates.value = {}
    initializeGuesses()
  }

  /**
   * Set new target word (for API integration)
   * Automatically resets the game
   */
  const setTargetWord = word => {
    targetWord.value = normalizeTurkish(word)
    resetGame()
  }

  /**
   * Get current row display array
   * Shows current guess with empty cells
   */
  const getCurrentRowDisplay = computed(() => {
    const display = Array(WORD_LENGTH.value).fill('')

    for (let i = 0; i < currentGuess.value.length; i++) {
      display[i] = currentGuess.value[i]
    }

    return display
  })

  /**
   * Get game statistics
   */
  const getGameStats = computed(() => {
    return {
      currentAttempt: currentAttempt.value,
      totalAttempts: MAX_ATTEMPTS,
      guessedWords: guesses.value.filter(g => g.word).length,
      gameStatus: gameStatus.value,
      elapsedTime: endTime.value && startTime.value ? endTime.value - startTime.value : null,
      isComplete: gameStatus.value !== gameStatusEnum.PLAYING && gameStatus.value !== gameStatusEnum.FIRST_START
    }
  })

  /**
   * Get game data for API submission
   */
  const getGameData = () => {
    return {
      targetWord: targetWord.value,
      attempts: currentAttempt.value,
      won: gameStatus.value === gameStatusEnum.WON,
      guesses: guesses.value
        .filter(g => g.word)
        .map(g => ({
          word: g.word,
          states: g.states,
          timestamp: g.timestamp
        })),
      startTime: startTime.value,
      endTime: endTime.value,
      elapsedTime: endTime.value && startTime.value ? endTime.value - startTime.value : null
    }
  }

  const dialog = computed(() => store.getters['wordblock/dialog'])

  const openHowToPlayDialog = () => {
    store.commit('wordblock/SET_IS_OPEN_HOW_TO_PLAY_DIALOG', true)
  }

  const closeHowToPlayDialog = () => {
    store.commit('wordblock/SET_IS_OPEN_HOW_TO_PLAY_DIALOG', false)
  }

  const openStatsDialog = () => {
    store.commit('wordblock/SET_IS_OPEN_STATS_DIALOG', true)
  }

  const closeStatsDialog = () => {
    store.commit('wordblock/SET_IS_OPEN_STATS_DIALOG', false)
  }

  onMounted(() => {
    // Restore game state if game was already completed
    if (isGameOver.value) {
      restoreGameState()
    } else {
      openHowToPlayDialog()
    }
  })

  return {
    // State
    targetWord,
    isGameOver,
    gameResult,
    WORD_LENGTH,
    MAX_ATTEMPTS,
    currentAttempt,
    currentGuess,
    guesses,
    gameStatus,
    gameStatusEnum,
    letterStates,

    // Computed
    getCurrentRowDisplay,
    getGameStats,
    dialog,

    // Methods
    submitGuess,
    deleteLetter,
    addLetter,
    handleInputChange,
    startGame,
    endGame,
    resetGame,
    setTargetWord,
    getGameData,
    normalizeTurkish,
    updateKeyboardStates,
    restoreGameState,
    openHowToPlayDialog,
    closeHowToPlayDialog,
    openStatsDialog,
    closeStatsDialog
  }
}
