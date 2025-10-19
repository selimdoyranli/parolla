<template lang="pug">
.scene.wordblock-scene(
  ref="rootRef"
  :class="{ 'wordblock-scene--won': gameStatus === 'won', 'wordblock-scene--lost': gameStatus === 'lost' }"
)
  // Scene Inner
  .scene__inner.wordblock-scene__inner
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
    section.wordblock-scene__keyboard(
      v-if="gameStatus === 'playing'"
      :class="{ 'wordblock-scene__keyboard--disabled': currentGuess.length === WORD_LENGTH }"
    )
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

    // Game Over Messages
    .wordblock-scene__gameOver(v-if="gameStatus === 'won'")
      .wordblock-scene__message
        AppIcon.wordblock-scene__messageIcon(name="tabler:trophy" color="var(--color-success-01)")
        h2.wordblock-scene__messageTitle Tebrikler!
        p.wordblock-scene__messageText {{ currentAttempt }}/{{ MAX_ATTEMPTS }} denemede buldunuz
        Button.wordblock-scene__resetButton(color="var(--color-brand-02)" @click="resetGame") Yeniden Oyna

    .wordblock-scene__gameOver(v-if="gameStatus === 'lost'")
      .wordblock-scene__message
        AppIcon.wordblock-scene__messageIcon(name="tabler:x" color="var(--color-danger-01)")
        h2.wordblock-scene__messageTitle Oyun Bitti
        p.wordblock-scene__messageText Doğru kelime: {{ targetWord }}
        Button.wordblock-scene__resetButton(color="var(--color-brand-02)" @click="resetGame") Yeniden Oyna
</template>

<script>
import { defineComponent, ref, onMounted, onUnmounted } from '@nuxtjs/composition-api'
import { Button } from 'vant'
import useWordblock from './useWordblock'

export default defineComponent({
  components: {
    Button
  },
  setup() {
    const rootRef = ref(null)

    const {
      targetWord,
      WORD_LENGTH,
      MAX_ATTEMPTS,
      currentAttempt,
      currentGuess,
      guesses,
      gameStatus,
      letterStates,
      getCurrentRowDisplay,
      getGameStats,
      submitGuess,
      deleteLetter,
      addLetter,
      resetGame,
      setTargetWord,
      getGameData
    } = useWordblock()

    // Turkish keyboard layout (F klavye düzeni)
    const keyboardLayout = [
      ['e', 'r', 't', 'y', 'u', 'ı', 'o', 'p', 'ğ', 'ü'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ş', 'i'],
      ['z', 'c', 'v', 'b', 'n', 'm', 'ö', 'ç']
    ]

    // Get row class
    const getRowClass = rowIndex => {
      return {
        'wordblock-scene__row--current': rowIndex === currentAttempt && gameStatus === 'playing',
        'wordblock-scene__row--completed': rowIndex < currentAttempt
      }
    }

    // Get cells for a specific row
    const getCellsForRow = rowIndex => {
      if (rowIndex < currentAttempt.value) {
        // Completed row
        return guesses.value[rowIndex].word.split('')
      } else if (rowIndex === currentAttempt.value && gameStatus.value === 'playing') {
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
      } else if (rowIndex === currentAttempt.value && gameStatus.value === 'playing') {
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

      return letterStates[normalizedKey] || null
    }

    // Handle key press from virtual keyboard
    const handleKeyPress = key => {
      if (gameStatus.value !== 'playing') return
      addLetter(key)
    }

    // Handle backspace from virtual keyboard
    const handleBackspace = () => {
      if (gameStatus.value !== 'playing') return
      deleteLetter()
    }

    // Handle submit
    const handleSubmit = () => {
      if (currentGuess.value.length !== WORD_LENGTH.value) return

      const result = submitGuess()

      if (!result.success) {
        // Handle error - could show notification here
        console.warn('Submit failed:', result.error, result.message)

        return
      }

      // Log result for API integration
      if (result.status === 'won' || result.status === 'lost') {
        console.log('Game ended:', result)
        console.log('Game data for API:', getGameData())

        // TODO: Send to API
        // await store.dispatch('wordblock/submitGameResult', getGameData())
      }
    }

    // Handle physical keyboard events
    const handleKeydown = event => {
      if (gameStatus.value !== 'playing') return

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
      // Add keyboard listener for physical keyboard
      window.addEventListener('keydown', handleKeydown)
    })

    onUnmounted(() => {
      // Remove keyboard listener
      window.removeEventListener('keydown', handleKeydown)
    })

    return {
      rootRef,
      targetWord,
      WORD_LENGTH,
      MAX_ATTEMPTS,
      currentAttempt,
      currentGuess,
      guesses,
      gameStatus,
      letterStates,
      keyboardLayout,
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
      getGameData
    }
  }
})
</script>

<style lang="scss" src="./WordblockScene.component.scss"></style>
