<template lang="pug">
.scene.game-scene.wordblock-scene(ref="rootRef" :class="sceneClasses")
  // Scene Inner
  .scene__inner.game-scene__inner.wordblock-scene__inner
    // Fetch State
    template(v-if="fetchState.pending")
      Empty(:description="$t('gameScene.pendingQuestions')")

    template(v-else-if="fetchState.error")
      Empty(image="error" :description="$t('gameScene.error.fetchQuestions.description')")
        Button(@click="reFetch") {{ $t('gameScene.error.fetchQuestions.action') }}

    template(v-else)
      // Game Board
      .wordblock-scene__board
        // Guess Rows
        .wordblock-scene__row(
          v-for="(guess, rowIndex) in guesses"
          :key="rowIndex"
          :class="getRowClass(rowIndex)"
          :data-word="getRowWord(rowIndex)"
        )
          .wordblock-scene__cell(
            v-for="(letter, cellIndex) in getCellsForRow(rowIndex)"
            :key="cellIndex"
            :class="getCellClass(rowIndex, cellIndex)"
            :style="getCellStyle(rowIndex, cellIndex)"
            :data-state="getCellState(rowIndex, cellIndex)"
            :data-letter="letter"
          ) {{ letter }}

    // Keyboard Section
    section.wordblock-scene__keyboard(:class="{ 'wordblock-scene__keyboard--disabled': currentGuess.length === WORD_LENGTH }")
      .wordblock-scene__keyboardRow
        button.wordblock-scene__key(
          v-for="key in keyboardLayout[0]"
          :key="key"
          :data-key="key"
          :data-state="getKeyState(key)"
          @click="handleKeyPress(key)"
        ) {{ key }}

      .wordblock-scene__keyboardRow
        .wordblock-scene__spacer.wordblock-scene__spacer--half
        button.wordblock-scene__key(
          v-for="key in keyboardLayout[1]"
          :key="key"
          :data-key="key"
          :data-state="getKeyState(key)"
          @click="handleKeyPress(key)"
        ) {{ key }}
        .wordblock-scene__spacer.wordblock-scene__spacer--half

      .wordblock-scene__keyboardRow
        button.wordblock-scene__key.wordblock-scene__key--wide(
          :disabled="currentGuess.length !== WORD_LENGTH"
          data-key="enter"
          @click="handleSubmit"
        ) enter
        button.wordblock-scene__key(
          v-for="key in keyboardLayout[2]"
          :key="key"
          :data-key="key"
          :data-state="getKeyState(key)"
          @click="handleKeyPress(key)"
        ) {{ key }}
        button.wordblock-scene__key.wordblock-scene__key--wide(data-key="backspace" @click="handleBackspace")
          AppIcon(name="tabler:backspace")

  HowToPlayDialog(v-if="!isGameOver" :isOpen="dialog.howToPlay.isOpen" @closed="handleHowToPlayDialogClose")
  WordblockModeStatsDialog(:isOpen="dialog.stats.isOpen" @closed="handleStatsDialogClose")
</template>

<script>
import { defineComponent, useFetch, useStore, useContext, ref, computed, onMounted, onUnmounted } from '@nuxtjs/composition-api'
import { Button, Empty, Toast } from 'vant'

export default defineComponent({
  components: {
    Button,
    Empty
  },
  setup() {
    const rootRef = ref(null)

    const store = useStore()
    const { i18n } = useContext()

    // Check if it's a new day and reset game if needed
    const day = new Date().toLocaleDateString('tr').slice(0, 10)
    let storedDay = null

    if (process.browser) {
      const persistStore = JSON.parse(window.localStorage.getItem('persistStore'))
      storedDay = persistStore && persistStore.wordblock && persistStore.wordblock.currentDate

      if (day !== storedDay) {
        // New day - reset game
        store.commit('wordblock/SET_IS_GAME_OVER', false)
        store.commit('wordblock/SET_CURRENT_DATE', day)
        store.commit('wordblock/SET_GAME_RESULT', {
          status: null,
          attempts: 0,
          word: '',
          guesses: [],
          elapsedTime: null
        })
      }
    }

    const { fetch, fetchState } = useFetch(async () => {
      await store.dispatch('wordblock/fetchWord')
    })

    const {
      isGameOver,
      gameResult,
      startGame,
      endGame,
      targetWord,
      WORD_LENGTH,
      MAX_ATTEMPTS,
      currentAttempt,
      currentGuess,
      guesses,
      gameStatus,
      gameStatusEnum,
      letterStates,
      getCurrentRowDisplay,
      getGameStats,
      submitGuess,
      deleteLetter,
      addLetter,
      resetGame,
      setTargetWord,
      getGameData,
      updateKeyboardStates,
      restoreGameState,
      openHowToPlayDialog,
      closeHowToPlayDialog,
      openStatsDialog,
      closeStatsDialog,
      dialog
    } = useWordblock()

    // Turkish keyboard layout
    const keyboardLayout = [
      ['e', 'r', 't', 'y', 'u', 'ı', 'o', 'p', 'ğ', 'ü'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ş', 'i'],
      ['z', 'c', 'v', 'b', 'n', 'm', 'ö', 'ç']
    ]

    // Scene classes computed
    const sceneClasses = computed(() => ({
      'game-scene--gameOver': isGameOver.value,
      'wordblock-scene--won': gameStatus.value === gameStatusEnum.WON,
      'wordblock-scene--lost': gameStatus.value === gameStatusEnum.LOST
    }))

    // Get row class
    const getRowClass = rowIndex => {
      return {
        'wordblock-scene__row--current': rowIndex === currentAttempt && gameStatus.value === gameStatusEnum.PLAYING,
        'wordblock-scene__row--completed': rowIndex < currentAttempt
      }
    }

    // Get cells for a specific row
    const getCellsForRow = rowIndex => {
      if (rowIndex < currentAttempt.value) {
        // Completed row
        return guesses.value[rowIndex].word.split('')
      } else if (rowIndex === currentAttempt.value && gameStatus.value === gameStatusEnum.PLAYING) {
        // Current row
        return getCurrentRowDisplay.value
      } else {
        // Empty future rows
        return Array(WORD_LENGTH.value).fill('')
      }
    }

    // Get word for a specific row
    const getRowWord = rowIndex => {
      if (rowIndex < currentAttempt.value) {
        // Completed row - return the guessed word
        return guesses.value[rowIndex].word
      } else if (rowIndex === currentAttempt.value && gameStatus.value === gameStatusEnum.PLAYING) {
        // Current row - return current guess
        return currentGuess.value
      } else {
        // Empty future rows
        return ''
      }
    }

    // Get cell state
    const getCellState = (rowIndex, cellIndex) => {
      if (rowIndex < currentAttempt.value) {
        return guesses.value[rowIndex].states[cellIndex]
      }

      return null
    }

    // Get cell class with staggered animation
    const getCellClass = (rowIndex, cellIndex) => {
      const classes = []

      if (rowIndex < currentAttempt.value) {
        classes.push('wordblock-scene__cell--revealed')
      }

      if (rowIndex === currentAttempt.value && cellIndex < currentGuess.value.length) {
        classes.push('wordblock-scene__cell--filled')
      }

      return classes.join(' ')
    }

    // Get cell style for staggered animation delay
    const getCellStyle = (rowIndex, cellIndex) => {
      if (rowIndex < currentAttempt.value) {
        // Add staggered animation delay for revealed cells
        const delay = cellIndex * 0.2 // 100ms delay between each cell

        return {
          animationDelay: `${delay}s`
        }
      }

      return {}
    }

    // Get keyboard key state for visual feedback
    const getKeyState = key => {
      const normalizedKey = key.toLocaleUpperCase('tr-TR')

      return letterStates.value[normalizedKey] || null
    }

    // Handle key press from virtual keyboard
    const handleKeyPress = key => {
      if (gameStatus.value !== gameStatusEnum.PLAYING) return
      addLetter(key)
    }

    // Handle backspace from virtual keyboard
    const handleBackspace = () => {
      if (gameStatus.value !== gameStatusEnum.PLAYING) return
      deleteLetter()
    }

    // Handle submit
    const handleSubmit = () => {
      if (currentGuess.value.length !== WORD_LENGTH.value) return

      // Store current attempt index before it gets incremented
      const attemptIndex = currentAttempt.value

      const result = submitGuess()

      if (!result.success) {
        // Handle error - could show notification here
        console.warn('Submit failed:', result.error, result.message)

        return
      }

      // Calculate animation duration based on word length
      // Each cell has 0.6s animation + staggered delay (0.2s per cell)
      // Last cell finishes at: 0.6s + ((wordLength - 1) * 0.2s)
      const animationDuration = 600 + (WORD_LENGTH.value - 1) * 200

      // Update keyboard states after all animations complete
      setTimeout(() => {
        const submittedGuess = guesses.value[attemptIndex]

        if (submittedGuess && submittedGuess.word) {
          updateKeyboardStates(submittedGuess.word, submittedGuess.states)
        }
      }, animationDuration)

      // Log result for API integration
      if (result.status === 'won' || result.status === 'lost') {
        endGame()

        if (gameStatus.value === gameStatusEnum.WON) {
          const getWonToastMessage = message => {
            Toast({
              message: message,
              position: 'bottom',
              duration: 3000
            })
          }

          if (result.attempts === 1) {
            getWonToastMessage(i18n.t('dialog.stats.won.attempts.one'))
          }

          if (result.attempts === 2) {
            getWonToastMessage(i18n.t('dialog.stats.won.attempts.two'))
          }

          if (result.attempts === 3) {
            getWonToastMessage(i18n.t('dialog.stats.won.attempts.three'))
          }

          if (result.attempts === 4) {
            getWonToastMessage(i18n.t('dialog.stats.won.attempts.four'))
          }

          if (result.attempts === 5) {
            getWonToastMessage(i18n.t('dialog.stats.won.attempts.five'))
          }
        }

        setTimeout(() => {
          openStatsDialog()
        }, animationDuration + 100)

        console.info('Game data for API:', getGameData())
      }
    }

    // Handle physical keyboard events
    const handleKeydown = event => {
      if (gameStatus.value !== gameStatusEnum.PLAYING) return

      if (event.key === 'Backspace') {
        deleteLetter()
      } else if (event.key === 'Enter') {
        handleSubmit()
      } else if (event.key.length === 1) {
        const key = event.key.toLocaleLowerCase('tr-TR')

        // Check if it's a valid Turkish letter
        if (/^[a-zçğıöşü]$/.test(key)) {
          addLetter(key)
        }
      }
    }

    onMounted(() => {
      // Check game over state - if game was already completed today, restore state and show stats
      if (isGameOver.value) {
        restoreGameState()
        openStatsDialog()
      }

      // Add keyboard listener for physical keyboard
      window.addEventListener('keydown', handleKeydown)
    })

    onUnmounted(() => {
      // Remove keyboard listener
      window.removeEventListener('keydown', handleKeydown)
    })

    const handleHowToPlayDialogClose = () => {
      startGame()
    }

    const handleStatsDialogClose = () => {
      closeStatsDialog()
    }

    const reFetch = async () => {
      await fetch()

      if (targetWord.value) {
        openHowToPlayDialog()
      }
    }

    return {
      fetch,
      fetchState,
      reFetch,
      rootRef,
      isGameOver,
      startGame,
      endGame,
      targetWord,
      WORD_LENGTH,
      MAX_ATTEMPTS,
      currentAttempt,
      currentGuess,
      guesses,
      gameStatus,
      gameStatusEnum,
      letterStates,
      keyboardLayout,
      sceneClasses,
      getRowClass,
      getGameStats,
      getCellsForRow,
      getRowWord,
      getCellState,
      getCellClass,
      getCellStyle,
      getKeyState,
      handleKeyPress,
      handleBackspace,
      handleSubmit,
      resetGame,
      setTargetWord,
      getGameData,
      openHowToPlayDialog,
      closeHowToPlayDialog,
      dialog,
      handleHowToPlayDialogClose,
      handleStatsDialogClose,
      openStatsDialog,
      closeStatsDialog
    }
  }
})
</script>

<style lang="scss" src="./WordblockScene.component.scss"></style>
