import { ref, computed } from '@nuxtjs/composition-api'

export default () => {
  const flashcards = ref([])
  const currentIndex = ref(0)
  const isFlipped = ref(true)
  const originalFlashcards = ref([])
  const isShuffled = ref(false)
  const isWatchlistActive = ref(false)
  const stillProgress = ref([])
  const inMemory = ref([])
  const isWatchlistComplete = ref(false)

  const currentCard = computed(() => {
    return flashcards.value[currentIndex.value] || null
  })

  const totalCards = computed(() => flashcards.value.length)

  const isFirst = computed(() => currentIndex.value === 0)
  const isLast = computed(() => currentIndex.value === flashcards.value.length - 1)

  const stillProgressCount = computed(() => stillProgress.value.length)
  const inMemoryCount = computed(() => inMemory.value.length)

  const initGame = flashcardsArray => {
    if (!flashcardsArray || flashcardsArray.length === 0) return

    const sorted = [...flashcardsArray].sort((a, b) => a.order - b.order)
    originalFlashcards.value = sorted
    flashcards.value = [...sorted]
    currentIndex.value = 0
    isFlipped.value = true
    isShuffled.value = false
  }

  const flipCard = () => {
    isFlipped.value = !isFlipped.value
  }

  const nextCard = () => {
    if (currentIndex.value < flashcards.value.length - 1) {
      isFlipped.value = true
      currentIndex.value++
    }
  }

  const prevCard = () => {
    if (currentIndex.value > 0) {
      isFlipped.value = true
      currentIndex.value--
    }
  }

  const toggleShuffle = () => {
    const currentCardId = currentCard.value?.id || currentCard.value?.documentId
    isShuffled.value = !isShuffled.value

    if (isShuffled.value) {
      // Shuffle: Fisher-Yates
      const shuffled = [...flashcards.value]

      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }

      flashcards.value = shuffled
    } else {
      // Restore original order
      flashcards.value = [...originalFlashcards.value]
    }

    // Stay on the same card
    if (currentCardId) {
      const newIndex = flashcards.value.findIndex(c => (c.id || c.documentId) === currentCardId)

      if (newIndex !== -1) {
        currentIndex.value = newIndex
      }
    }
  }

  const toggleWatchlist = () => {
    isWatchlistActive.value = !isWatchlistActive.value

    if (isWatchlistActive.value) {
      stillProgress.value = []
      inMemory.value = []
      isWatchlistComplete.value = false
    }
  }

  const findNextAvailableCard = excludeIndex => {
    const inMemoryIds = inMemory.value.map(c => c.id || c.documentId)

    for (let i = 0; i < flashcards.value.length; i++) {
      const card = flashcards.value[i]
      const cardId = card.id || card.documentId

      if (!inMemoryIds.includes(cardId) && i !== excludeIndex) {
        return i
      }
    }

    return -1
  }

  const advanceToNextAvailable = () => {
    const inMemoryIds = inMemory.value.map(c => c.id || c.documentId)
    const remaining = flashcards.value.filter(c => !inMemoryIds.includes(c.id || c.documentId))

    if (remaining.length === 0) {
      isWatchlistComplete.value = true

      return
    }

    const nextIndex = findNextAvailableCard(currentIndex.value)

    if (nextIndex !== -1) {
      isFlipped.value = true
      currentIndex.value = nextIndex
    } else {
      // Current card is the only one remaining
      isFlipped.value = true
    }
  }

  const markStillProgress = () => {
    if (!currentCard.value) return

    const cardId = currentCard.value.id || currentCard.value.documentId
    const alreadyExists = stillProgress.value.some(c => (c.id || c.documentId) === cardId)

    if (!alreadyExists) {
      stillProgress.value.push({ ...currentCard.value })
    }

    // Remove from inMemory if it was there
    inMemory.value = inMemory.value.filter(c => (c.id || c.documentId) !== cardId)

    advanceToNextAvailable()
  }

  const markInMemory = () => {
    if (!currentCard.value) return

    const cardId = currentCard.value.id || currentCard.value.documentId
    const alreadyExists = inMemory.value.some(c => (c.id || c.documentId) === cardId)

    if (!alreadyExists) {
      inMemory.value.push({ ...currentCard.value })
    }

    // Remove from stillProgress if it was there
    stillProgress.value = stillProgress.value.filter(c => (c.id || c.documentId) !== cardId)

    advanceToNextAvailable()
  }

  return {
    flashcards,
    currentIndex,
    isFlipped,
    isShuffled,
    currentCard,
    totalCards,
    isFirst,
    isLast,
    initGame,
    flipCard,
    nextCard,
    prevCard,
    toggleShuffle,
    isWatchlistActive,
    stillProgress,
    inMemory,
    isWatchlistComplete,
    stillProgressCount,
    inMemoryCount,
    toggleWatchlist,
    markStillProgress,
    markInMemory
  }
}
