# Wordblock Mode Scene

A clean, modern game implementation for Parolla project.

## 📁 File Structure

```
WordblockModeScene/
├── WordblockModeScene.component.vue   # Main component
├── WordblockModeScene.component.scss  # Styles
├── /composables/useWordblock.js       # Game logic composable
└── README.md                          # Documentation
```

## 🎮 Features

- **Dynamic Lengths**: Generically supports multiple independent word games (5, 6, and 7 characters).
- **6 or More Attempts**: Players have a fixed amount of tries to guess the word (e.g. 6 tries configurable).
- **Visual Feedback**:
  - 🟩 Green: Correct letter in correct position
  - 🟨 Yellow: Correct letter in wrong position
  - ⬛ Gray: Letter not in word
- **Virtual Keyboard**: On-screen Turkish layout.
- **Physical Keyboard Support**: Type with your keyboard too!
- **Responsive Design**: Works on all screen sizes, tile layouts adapt fluidly based on lengths.
- **Smooth Animations**: Pop, flip, and fade effects.
- **Smart Letter States**: Keyboard keys change color based on your guesses.

## 🔧 Current Implementation

### Scene Context Usage
The component accepts `charLength` as a prop mapping to independent Vuex storage entries to track their context dynamically isolated.

```javascript
// In pages/WordblockMode/_charLength.vue
<WordblockModeScene :charLength="parseInt($route.params.charLength)" />
```

### Composable Usage
```javascript
import useWordblock from '@/composables/useWordblock'

// Supplying the isolated charLength map configuration
const { targetWord, ...engine } = useWordblock(computed(() => props.charLength))
```

## 🚀 API Integration Guide

To integrate with your API, follow these steps:

### 1. Fetch Word from API passing Parameter Length

In `WordblockModeScene.component.vue`, pass `charLength` downstream via Vuex Actions.

```javascript
import { useFetch, useStore } from '@nuxtjs/composition-api'

// In setup()
const store = useStore()
const charLength = computed(() => props.charLength)

// Fetch word dynamically
const { fetch, fetchState } = useFetch(async () => {
  try {
    const response = await store.dispatch('wordblock/fetchWord', { charLength: charLength.value })
    // Using the scoped dictionary based on length
  } catch (error) {
    console.error('Failed to fetch word:', error)
  }
})
```

### 2. Vuex Store Module Shape

Ensure your `store/wordblock/state.js` exports dictionary mapping per `charLength`:

```javascript
export const defaultGameState = () => ({
  isGameOver: false,
  currentDate: null,
  targetWord: '',
  result: null
})

export const state = () => ({
  games: {
    5: defaultGameState(),
    6: defaultGameState(),
    7: defaultGameState()
  }
})
```

Ensure your `actions.js` fetches correctly filtering the right game length context.

```javascript
// store/wordblock/actions.js
export default {
  async fetchWord({ commit }, { charLength }) {
    try {
      const response = await this.$axios.get(`/api/Wordblock/word?length=${charLength}`)
      commit('SET_TARGET_WORD', { charLength, word: response.data.word })
      return response.data
    } catch (error) {
      throw error
    }
  }
}
```

### 3. Submit Game Results
Add result submission payload scoped securely.

```javascript
// In handleSubmit() after game ends
if (result.status === 'won' || result.status === 'lost') {
  await store.dispatch('wordblock/submitGameResult', {
    charLength: props.charLength, // Isolated scope 
    word: targetWord.value,
    attempts: currentAttempt.value,
    won: result.status === 'won',
    guesses: guesses.value
      .filter(g => g.word)
      .map(g => ({
        word: g.word,
        states: g.states
      }))
  })
}
```

## 🎨 Customization

### Configuring Supported Word Lengths

Modify in `@/system/constant.js` ensuring downstream paths dynamically adapt router validations correctly out-of-the-box.

```javascript
export const WORDBLOCK_AVAILABLE_LENGTHS = [5, 6, 7]
```

### Change Colors

Modify in `WordblockModeScene.component.scss`:

```scss
&[data-state='correct'] {
  background: var(--color-success-01); // Change this
}
```

## ⌨️ Keyboard Layout

The virtual keyboard uses Turkish keyboard layout:

```
Row 1: e r t y u ı o p ğ ü
Row 2: a s d f g h j k l ş i
Row 3: [ENTER] z c v b n m ö ç [BACKSPACE]
```

### Keyboard Features:

- **Color Feedback**: Keys change color based on guess results
  - Green: Letter is in the word and in correct position
  - Yellow: Letter is in the word but wrong position
  - Gray: Letter is not in the word
- **Enter Key**: Submit your guess (enabled only when word length aligns with current `charLength`)
- **Backspace Key**: Delete last letter.
- **Physical Keyboard**: Also works seamlessly intercepting typing correctly supporting isolated Turkish inputs safely filtering non-text nodes.

## 🔄 Methods Available (Composable Context)

### From `composables/useWordblock.js`:

Hook exports scoped context bound globally:

- `setTargetWord(word)` - Set new target word manually triggering a hard reset gracefully natively.
- `submitGuess()` - Submit current guess processing matching algorithm against normalized bounds.
- `resetGame()` - Reset to start new game wiping grid metadata.
- `handleInputChange(value)` - Normalizing native physical events filtering properly.

### From Component:

- `getCellsForRow(rowIndex)` - Fetch UI cells gracefully avoiding out-of-bounds error mapping dynamic spacing grids effectively.
- `getCellState(rowIndex, cellIndex)` - Retrieves semantic status bound tracking class animations internally flawlessly.
- `handleSubmit()` - Event capturing pipeline invoking hooks elegantly.

## 📱 Mobile Support

- Fully responsive design
- Touch-friendly input
- Optimized for small screens (360px+)
- Fluid SCSS tracking `charLength-5`, `charLength-6`, `charLength-7` dynamic mappings guaranteeing tiles remain readable regardless of column amount.

## 🎯 Game States

```javascript
gameStatus.value === 'playing' // Game in progress
gameStatus.value === 'won' // Player won
gameStatus.value === 'lost' // Player lost (fails maximum attempts limits)
```

---

**Architecture Ready For Deep Component Scalability!** ✅  
Leveraging isolated nested arrays using Vue Composition API allows creating N amounts of active Wordblock grids seamlessly without state clashing efficiently mapped gracefully.
