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
  // [winnerDocumentId, loserDocumentId] per duel, posted when the run ends
  const duels = ref([])

  const initGame = choicesArray => {
    if (!choicesArray || choicesArray.length === 0) return

    choicesQueue.value = [...choicesArray]

    choiceFirst.value = choicesQueue.value.shift() || null
    choiceSecond.value = choicesQueue.value.shift() || null

    isAnimating.value = false
    selectedSide.value = null
    ultimateWinner.value = null
    selectedChoiceIds.value = []
    duels.value = []
  }

  const selectChoice = async side => {
    if (isAnimating.value || ultimateWinner.value) return

    const selectedChoice = side === 'left' ? choiceFirst.value : choiceSecond.value

    if (selectedChoice?.documentId && !selectedChoiceIds.value.includes(selectedChoice.documentId)) {
      selectedChoiceIds.value.push(selectedChoice.documentId)
    }

    const loserChoice = side === 'left' ? choiceSecond.value : choiceFirst.value

    if (selectedChoice?.documentId && loserChoice?.documentId) {
      duels.value.push([selectedChoice.documentId, loserChoice.documentId])
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
        const roomDocumentId = store.getters['creator/room']?.documentId

        if (roomDocumentId && duels.value.length) {
          store.dispatch('creator/recordChoiceDuels', { roomDocumentId, duels: duels.value })
        }

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
