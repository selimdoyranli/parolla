import { ref, computed } from '@nuxtjs/composition-api'

export default () => {
  const flashcards = ref([])
  const currentIndex = ref(0)
  const isFlipped = ref(true)

  const currentCard = computed(() => {
    return flashcards.value[currentIndex.value] || null
  })

  const totalCards = computed(() => flashcards.value.length)

  const isFirst = computed(() => currentIndex.value === 0)
  const isLast = computed(() => currentIndex.value === flashcards.value.length - 1)

  const initGame = flashcardsArray => {
    if (!flashcardsArray || flashcardsArray.length === 0) return

    flashcards.value = [...flashcardsArray].sort((a, b) => a.order - b.order)
    currentIndex.value = 0
    isFlipped.value = true
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

  return {
    flashcards,
    currentIndex,
    isFlipped,
    currentCard,
    totalCards,
    isFirst,
    isLast,
    initGame,
    flipCard,
    nextCard,
    prevCard
  }
}
