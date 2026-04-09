import { ref, computed, nextTick } from '@nuxtjs/composition-api'

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
  const cardAnimation = ref(null)
  const isAnimating = ref(false)

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
    isWatchlistActive.value = false
    stillProgress.value = []
    inMemory.value = []
    isWatchlistComplete.value = false
  }

  const flipCard = () => {
    isFlipped.value = !isFlipped.value
  }

  const animateCard = (exitAnim, enterAnim, changeCard) => {
    if (isAnimating.value) return

    isAnimating.value = true
    cardAnimation.value = exitAnim

    setTimeout(async () => {
      // Exit animation done — card invisible (opacity:0 via forwards).
      // Exit class is STILL on, so transition:none override is active.
      // Change flip state and card while transition:none is in effect.
      isFlipped.value = true
      changeCard()

      // Let Vue flush DOM with new card in flipped state
      await nextTick()

      // Now swap exit → enter animation
      cardAnimation.value = enterAnim

      setTimeout(() => {
        cardAnimation.value = null
        isAnimating.value = false
      }, 250)
    }, 250)
  }

  const nextCard = () => {
    if (currentIndex.value >= flashcards.value.length - 1 || isAnimating.value) return

    animateCard('exit-left', 'enter-right', () => {
      currentIndex.value++
    })
  }

  const prevCard = () => {
    if (currentIndex.value <= 0 || isAnimating.value) return

    animateCard('exit-right', 'enter-left', () => {
      currentIndex.value--
    })
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
    if (!currentCard.value || isAnimating.value) return

    isAnimating.value = true
    cardAnimation.value = 'dismiss-left'

    setTimeout(() => {
      const cardId = currentCard.value.id || currentCard.value.documentId
      const alreadyExists = stillProgress.value.some(c => (c.id || c.documentId) === cardId)

      if (!alreadyExists) {
        stillProgress.value.push({ ...currentCard.value })
      }

      inMemory.value = inMemory.value.filter(c => (c.id || c.documentId) !== cardId)
      advanceToNextAvailable()
      cardAnimation.value = 'enter-fade'

      setTimeout(() => {
        cardAnimation.value = null
        isAnimating.value = false
      }, 250)
    }, 300)
  }

  const markInMemory = () => {
    if (!currentCard.value || isAnimating.value) return

    isAnimating.value = true
    cardAnimation.value = 'dismiss-right'

    setTimeout(() => {
      const cardId = currentCard.value.id || currentCard.value.documentId
      const alreadyExists = inMemory.value.some(c => (c.id || c.documentId) === cardId)

      if (!alreadyExists) {
        inMemory.value.push({ ...currentCard.value })
      }

      stillProgress.value = stillProgress.value.filter(c => (c.id || c.documentId) !== cardId)
      advanceToNextAvailable()
      cardAnimation.value = 'enter-fade'

      setTimeout(() => {
        cardAnimation.value = null
        isAnimating.value = false
      }, 250)
    }, 300)
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
    markInMemory,
    cardAnimation,
    isAnimating
  }
}
