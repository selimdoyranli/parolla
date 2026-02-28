import { useContext, useStore, ref, watch } from '@nuxtjs/composition-api'

export default () => {
  const { $auth } = useContext()
  const store = useStore()

  const choicesQueue = ref([])
  const choiceFirst = ref(null)
  const choiceSecond = ref(null)

  const isAnimating = ref(false)
  const selectedSide = ref(null)
  const ultimateWinner = ref(null)
  const selectedChoiceIds = ref([])

  const initGame = choicesArray => {
    if (!choicesArray || choicesArray.length === 0) return

    choicesQueue.value = [...choicesArray]

    choiceFirst.value = choicesQueue.value.shift() || null
    choiceSecond.value = choicesQueue.value.shift() || null

    isAnimating.value = false
    selectedSide.value = null
    ultimateWinner.value = null
    selectedChoiceIds.value = []
  }

  const selectChoice = async side => {
    if (isAnimating.value || ultimateWinner.value) return

    const selectedChoice = side === 'left' ? choiceFirst.value : choiceSecond.value

    if (selectedChoice?.documentId && !selectedChoiceIds.value.includes(selectedChoice.documentId)) {
      selectedChoiceIds.value.push(selectedChoice.documentId)
    }

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
      }
    }, 1000)
  }

  watch(
    () => ultimateWinner.value,
    async () => {
      if (ultimateWinner.value) {
        if ($auth.loggedIn && $auth.user) {
          await store.dispatch('creator/upvoteChoice', { choiceDocumentId: ultimateWinner.value.documentId })
        }
      }
    }
  )

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
