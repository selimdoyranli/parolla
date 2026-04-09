import { ref, computed } from '@nuxtjs/composition-api'

export default () => {
  const flashcards = ref([])
  const currentIndex = ref(0)
  const isFlipped = ref(true)
  const originalFlashcards = ref([])
  const isShuffled = ref(false)

  const currentCard = computed(() => {
    return flashcards.value[currentIndex.value] || null
  })

  const totalCards = computed(() => flashcards.value.length)

  const isFirst = computed(() => currentIndex.value === 0)
  const isLast = computed(() => currentIndex.value === flashcards.value.length - 1)

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
    toggleShuffle
  }
}
