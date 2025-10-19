# Wordblock Scene

A clean, modern game implementation for Parolla project.

## 📁 File Structure

```
WordblockScene/
├── WordblockScene.component.vue   # Main component
├── WordblockScene.component.scss  # Styles
├── useWordblock.js               # Game logic composable
└── README.md                     # Documentation
```

## 🎮 Features

- **6 Attempts**: Players have 6 tries to guess the word
- **Visual Feedback**:
  - 🟩 Green: Correct letter in correct position
  - 🟨 Yellow: Correct letter in wrong position
  - ⬜ Gray: Letter not in word
- **Virtual Keyboard**: On-screen Turkish layout
- **Physical Keyboard Support**: Type with your keyboard too!
- **Responsive Design**: Works on all screen sizes
- **Smooth Animations**: Pop, flip, and fade effects
- **Smart Letter States**: Keyboard keys change color based on your guesses

## 🔧 Current Implementation

### Demo Word

Currently using a hardcoded demo word: **"PARLA"**

```javascript
// In useWordblock.js
const targetWord = ref('PARLA')
```

## 🚀 API Integration Guide

To integrate with your API, follow these steps:

### 1. Fetch Word from API

In `WordblockScene.component.vue`, add API call:

```javascript
import { useFetch, useStore } from '@nuxtjs/composition-api'

// In setup()
const store = useStore()

// Fetch word from API
const { fetch, fetchState } = useFetch(async () => {
  try {
    const response = await store.dispatch('Wordblock/fetchWord')
    // Assuming API returns: { word: 'PARLA', id: 123 }
    setTargetWord(response.word)
  } catch (error) {
    console.error('Failed to fetch word:', error)
  }
})
```

### 2. Create Vuex Store Module

Create `store/Wordblock/` directory with actions:

```javascript
// store/Wordblock/actions.js
export default {
  async fetchWord({ commit }) {
    try {
      const response = await this.$axios.get('/api/Wordblock/word')
      commit('SET_WORD', response.data.word)
      return response.data
    } catch (error) {
      throw error
    }
  },

  async submitGameResult({ commit }, payload) {
    // payload: { attempts, won, word, guesses }
    try {
      const response = await this.$axios.post('/api/Wordblock/result', payload)
      return response.data
    } catch (error) {
      throw error
    }
  }
}
```

### 3. Submit Game Results

Add result submission when game ends:

```javascript
// In handleSubmit() after game ends
if (result.status === 'won' || result.status === 'lost') {
  await store.dispatch('Wordblock/submitGameResult', {
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

### 4. Loading & Error States

Add loading and error handling:

```vue
<template lang="pug">
.word-block-scene
  // Loading state
  template(v-if="fetchState.pending")
    .word-block-scene__loading Loading word...

  // Error state
  template(v-else-if="fetchState.error")
    .word-block-scene__error
      p Error loading word
      Button(@click="fetch") Retry

  // Game board (existing code)
  template(v-else)
    .scene__inner.word-block-scene__inner
      // ... existing game board code
</template>
```

## 📊 API Endpoints Expected

```
GET  /api/Wordblock/word
Response: {
  word: "PARLA",
  id: 123,
  difficulty: "medium"
}

POST /api/Wordblock/result
Body: {
  word: "PARLA",
  attempts: 4,
  won: true,
  guesses: [
    { word: "PASTA", states: ["correct", "correct", "absent", "absent", "correct"] },
    { word: "PARMA", states: ["correct", "correct", "correct", "absent", "correct"] },
    ...
  ]
}
Response: {
  success: true,
  score: 85,
  ranking: 42
}
```

## 🎨 Customization

### Change Word Length

Modify in `useWordblock.js`:

```javascript
const targetWord = ref('KELIME') // 6 letters instead of 5
```

### Change Max Attempts

Modify in `useWordblock.js`:

```javascript
const MAX_ATTEMPTS = 8 // Instead of 6
```

### Change Colors

Modify in `WordblockScene.component.scss`:

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
- **Enter Key**: Submit your guess (enabled only when word is complete)
- **Backspace Key**: Delete last letter
- **Physical Keyboard**: Also works with your computer keyboard

## 🧪 Testing

To test the game:

1. Navigate to `/Wordblock` or your configured route
2. Click letters on the virtual keyboard (or type with physical keyboard)
3. Fill all 5 letters
4. Press Enter key or click "enter" button
5. See visual feedback on both grid and keyboard
6. Win in 6 attempts or less!

## 🔄 Methods Available

### From `useWordblock.js`:

- `setTargetWord(word)` - Set new target word
- `submitGuess()` - Submit current guess
- `resetGame()` - Reset to start new game
- `handleInputChange(value)` - Handle input changes

### From Component:

- `getCellsForRow(rowIndex)` - Get cells for specific row
- `getCellState(rowIndex, cellIndex)` - Get state of cell
- `handleSubmit()` - Submit guess with API integration

## 📱 Mobile Support

- Fully responsive design
- Touch-friendly input
- Optimized for small screens (360px+)
- Auto-focus on input field

## 🎯 Game States

```javascript
gameStatus.value === 'playing' // Game in progress
gameStatus.value === 'won' // Player won
gameStatus.value === 'lost' // Player lost (6 failed attempts)
```

## 🌐 Internationalization

Update text in component or use i18n:

```pug
// Current
h1.word-block-scene__title Wordblock
p.word-block-scene__subtitle {{ WORD_LENGTH }} harfli kelimeyi {{ MAX_ATTEMPTS }} denemede bul

// With i18n
h1.word-block-scene__title {{ $t('Wordblock.title') }}
p.word-block-scene__subtitle {{ $t('Wordblock.subtitle', { length: WORD_LENGTH, attempts: MAX_ATTEMPTS }) }}
```

---

**Ready for API Integration** ✅  
Follow the API Integration Guide above to connect to your backend!
