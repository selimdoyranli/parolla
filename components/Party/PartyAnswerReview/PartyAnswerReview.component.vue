<template lang="pug">
//- final screen (qa): creator stats' scoreboard, one row per player in score order; open a row for their answers
section.party-card.party-answer-review
  header.party-card__head
    .party-card__head-icon
      AppIcon(name="tabler:list-check" :width="18" :height="18")
    .party-card__head-text
      span.party-card__eyebrow {{ $t('party.final.answers') }}
      h3.party-card__title {{ $t('party.final.answersSub') }}

  ScoreboardList.party-answer-review__list(:items="items" :questions="questions")
</template>

<script>
import { defineComponent, computed, useStore } from '@nuxtjs/composition-api'
import { formatCorrectAnswer } from '@/helpers/partyAnswer'
import { usePartyUser } from '@/composables/usePartyUser'

export default defineComponent({
  props: {
    // party_final review: [{ index, question, letter, correctAnswer, answerType, answers: [{ playerId, answer, correct, points }] }]
    review: { type: Array, required: true },
    // final leaderboard rows, ranked (null when the board is hidden): the list's order and scores
    leaderboard: { type: Array, default: null }
  },
  setup(props) {
    const store = useStore()
    const { toUser } = usePartyUser()

    // ScoreboardList matches answers to questions by position
    const questions = computed(() =>
      props.review.map((q, i) => ({ letter: q.letter || String(i + 1), answer: formatCorrectAnswer(q.correctAnswer, q.answerType) }))
    )

    // score order from the board; without it (hidden) the room's answering members
    const players = computed(() => {
      if (props.leaderboard) return props.leaderboard

      const presenterId = store.getters['party/game']?.presenterId

      return store.getters['party/players'].filter(p => p.id !== presenterId).map(p => ({ ...p, playerId: p.id }))
    })

    // ScoreboardList's row shape; no answer counts as wrong (party has no pass)
    const items = computed(() =>
      players.value.map(p => {
        const gamersAnswers = props.review.map((q, index) => {
          const a = q.answers.find(x => x.playerId === p.playerId)

          return { index, field: a ? a.answer : '', isCorrect: Boolean(a?.correct), isWrong: !a?.correct, ms: a ? a.ms : null }
        })

        return {
          user: toUser(p),
          score: props.leaderboard ? p.score : undefined,
          results: {
            correctAnswers: gamersAnswers.filter(a => a.isCorrect),
            wrongAnswers: gamersAnswers.filter(a => a.isWrong),
            gamersAnswers
          }
        }
      })
    )

    return { questions, items }
  }
})
</script>

<style lang="scss" src="./PartyAnswerReview.component.scss" scoped></style>
