import { ref } from '@nuxtjs/composition-api'

export default () => {
  const choicesQueue = ref([])
  const choiceFirst = ref(null)
  const choiceSecond = ref(null)

  const isAnimating = ref(false)
  const selectedSide = ref(null)
  const ultimateWinner = ref(null)

  const initGame = choicesArray => {
    if (!choicesArray || choicesArray.length === 0) return

    choicesQueue.value = [...choicesArray]

    choiceFirst.value = choicesQueue.value.shift() || null
    choiceSecond.value = choicesQueue.value.shift() || null

    isAnimating.value = false
    selectedSide.value = null
    ultimateWinner.value = null
  }

  const selectChoice = side => {
    if (isAnimating.value || ultimateWinner.value) return

    const selectedChoice = side === 'left' ? choiceFirst.value : choiceSecond.value
    console.log(`[GameScene] Upvoted choice (${side}):`, selectedChoice)

    selectedSide.value = side
    isAnimating.value = true

    setTimeout(() => {
      const nextChoice = choicesQueue.value.shift() || null

      if (side === 'left') {
        choiceSecond.value = nextChoice
      } else {
        choiceFirst.value = nextChoice
      }

      isAnimating.value = false
      selectedSide.value = null

      if (!choiceFirst.value || !choiceSecond.value) {
        ultimateWinner.value = choiceFirst.value || choiceSecond.value
        console.log('[GameScene] Ultimate winner choice:', ultimateWinner.value)
      }
    }, 1000)
  }

  return {
    choicesQueue,
    choiceFirst,
    choiceSecond,
    isAnimating,
    selectedSide,
    ultimateWinner,
    initGame,
    selectChoice
  }
}
