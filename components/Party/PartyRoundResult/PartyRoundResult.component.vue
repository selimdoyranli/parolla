<template lang="pug">
.party-round-result(:class="{ 'party-round-result--inline': inline }")
  .party-round-result__inner
    .party-round-result__main
      //- choices: the room's verdict on this duel (mineWon null = didn't vote / presenter)
      .party-round-result__card(v-if="isChoices" :class="{ 'party-round-result__card--correct': roundEnd.mineWon }")
        .party-round-result__verdict
          span.party-round-result__icon
            AppIcon(:name="roundEnd.mineWon ? 'tabler:check' : 'tabler:trophy'" :width="20" :height="20")
          div
            h3.party-round-result__title {{ choicesTitle }}
            p.party-round-result__answer
              b {{ winnerLabel }}
        p.party-round-result__chip
          AppIcon(:name="isTie && !isFirstRound ? 'tabler:crown' : 'tabler:trophy'" :width="12" :height="12")
          | {{ isTie ? $t(isFirstRound ? 'party.choices.tieFirst' : 'party.choices.tie') : $t('party.choices.byVotes') }}
          span {{ $tc('party.choices.votes', roundEnd.left + roundEnd.right) }}

      //- own card; the presenter (me: null) only gets the answer
      .party-round-result__card(v-else :class="cardClass")
        span.party-round-result__points(v-if="me && me.correct") {{ $t('party.game.points', { n: me.points }) }}
        .party-round-result__verdict
          span.party-round-result__icon(v-if="me")
            AppIcon(:name="me.correct ? 'tabler:check' : 'tabler:x'" :width="20" :height="20")
          h3.party-round-result__title {{ title }}
        p.party-round-result__answer
          | {{ $t('party.game.answer') }}:
          |
          b {{ correctAnswer }}
        p.party-round-result__answer(v-if="me && !me.correct && me.answer")
          | {{ $t('party.game.yourAnswer') }}:
          |
          b {{ me.answer }}

      //- no leaderboard shown (end / never): own running total only
      .party-round-result__mine(v-if="me && !leaderboard")
        span {{ $t('party.game.score') }}
        b {{ me.score }}
        span.party-round-result__mine-sub {{ $t('party.game.correctCount', { n: me.correctCount }) }}

      .party-round-result__next(v-if="nextLeftSec !== null")
        .party-round-result__next-row
          span
            AppIcon(name="tabler:stopwatch" :width="14" :height="14")
            | {{ isLastRound ? $t('party.game.toResults') : isChoices ? $t('party.choices.nextRound') : $t('party.game.nextQuestion') }}
          b {{ nextLeftSec }}s
        .party-round-result__bar
          i(:style="{ width: `${nextFraction * 100}%` }")

      template(v-else-if="!isFinal")
        Button.party-round-result__next-button(v-if="isHost" icon="arrow" round block @click="next") {{ $t('party.game.next') }}
        p.party-round-result__wait(v-else) {{ $t('party.game.waitingNext') }}

    section.party-card.party-round-result__board(v-if="leaderboard")
      header.party-round-result__board-head
        span.party-card__eyebrow {{ $t('party.game.leaderboard') }}
        span.party-card__eyebrow {{ $t('party.game.top', { n: leaderboard.length }) }}
      ol.party-round-result__rows
        li.party-round-result__row(
          v-for="(row, index) in leaderboard"
          :key="row.playerId"
          :class="{ 'party-round-result__row--me': row.playerId === myId }"
        )
          span.party-round-result__rank {{ index + 1 }}
          PlayerAvatar(:user="toUser(row)" :size="24")
          span.party-round-result__name {{ row.name }}
          span.party-pill.party-pill--brand(v-if="row.playerId === myId") {{ $t('party.lobby.you') }}
          span.party-round-result__delta(v-if="row.rankDelta" :class="row.rankDelta > 0 ? 'is-up' : 'is-down'")
            | {{ row.rankDelta > 0 ? '▲' : '▼' }}{{ Math.abs(row.rankDelta) }}
          b.party-round-result__score {{ row.score }}
          .party-round-result__bar.party-round-result__bar--row
            i(:style="{ width: `${topScore ? (row.score / topScore) * 100 : 0}%` }")
</template>

<script>
import { defineComponent, ref, computed, watch, inject, onUnmounted, useStore, useContext } from '@nuxtjs/composition-api'
import { Button } from 'vant'
import { wsTypeEnum } from '@/enums/wsType.enum'
import { answerTypeEnum, choiceTypeEnum } from '@/enums/quiz.enum'

const AUTO_NEXT_MS = 5000

// QA round result over the scene: own verdict + points, leaderboard (when the room shows it), next-round countdown.
// Choices (inline, inside ChoicesGameScene): the duel verdict + the same next-round countdown
export default defineComponent({
  components: { Button },
  props: {
    inline: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const store = useStore()
    const { i18n } = useContext()
    const send = inject('partySend')

    const roundEnd = computed(() => store.state.party.roundEnd)
    const me = computed(() => roundEnd.value.me)
    const leaderboard = computed(() => roundEnd.value.leaderboard)
    const myId = computed(() => store.state.party.myId)
    const isHost = computed(() => store.getters['party/isHost'])
    const game = computed(() => store.getters['party/game'])
    const isLastRound = computed(() => Boolean(game.value) && game.value.index + 1 >= game.value.total)
    const isFinal = computed(() => Boolean(game.value) && game.value.phase === 'final')
    const topScore = computed(() => Math.max(0, ...(leaderboard.value || []).map(r => r.score)))

    // text answers keep their comma alternatives in one string; trivia answers may contain commas themselves
    const correctAnswer = computed(() => {
      const raw = String(roundEnd.value.correctAnswer || '')
      // round_end carries answerType: `round` is null after a reconnect during the result
      const isTrivia = (roundEnd.value.answerType || store.state.party.round?.question?.answerType) === answerTypeEnum.TRIVIA

      return isTrivia
        ? raw
        : raw
            .split(',')
            .map(a => a.trim())
            .filter(Boolean)
            .join(' / ')
    })

    const title = computed(() => {
      if (!me.value) return i18n.t('party.game.correctAnswer')

      return me.value.correct ? i18n.t('party.game.correct') : i18n.t('party.game.wrong')
    })

    const isChoices = computed(() => Boolean(roundEnd.value.winnerSide))
    // tie or no votes: the server keeps the champion (left)
    const isTie = computed(() => roundEnd.value.left === roundEnd.value.right)
    // round 1 had no champion yet: a tie keeps the first option
    const isFirstRound = computed(() => game.value?.index === 0)
    const choicesTitle = computed(() => {
      const won = roundEnd.value.mineWon

      if (won === null || won === undefined) return i18n.t('party.choices.roundWinner')

      return won ? i18n.t('party.choices.won') : i18n.t('party.choices.lost')
    })
    const winnerLabel = computed(() => {
      const w = roundEnd.value.winner

      if (w?.choiceType === choiceTypeEnum.TEXT && w.text) return w.text

      return w?.mediaNote || i18n.t('party.choices.option', { n: roundEnd.value.winnerSide === 'left' ? 1 : 2 })
    })

    const cardClass = computed(() => {
      if (!me.value) return null

      return me.value.correct ? 'party-round-result__card--correct' : 'party-round-result__card--wrong'
    })

    // nextInMs is relative to when the frame arrived
    const now = ref(Date.now())
    const nextAt = ref(null)
    const ticker = setInterval(() => (now.value = Date.now()), 200)

    watch(
      roundEnd,
      value => {
        nextAt.value = value && value.nextInMs !== null && value.nextInMs !== undefined ? Date.now() + value.nextInMs : null
      },
      { immediate: true }
    )

    // the host may switch auto advance during the result: only the room state says so, and the server then waits the full 5 s
    watch(
      () => store.getters['party/settings'].autoAdvance,
      auto => {
        if (game.value?.phase === 'result') nextAt.value = auto ? Date.now() + AUTO_NEXT_MS : null
      }
    )

    const nextLeftMs = computed(() => (nextAt.value === null ? null : Math.max(0, nextAt.value - now.value)))
    const nextLeftSec = computed(() => (nextLeftMs.value === null ? null : Math.ceil(nextLeftMs.value / 1000)))
    const nextFraction = computed(() => (nextLeftMs.value === null ? 0 : Math.min(1, nextLeftMs.value / AUTO_NEXT_MS)))

    onUnmounted(() => clearInterval(ticker))

    const next = () => send(wsTypeEnum.PARTY_NEXT)

    const toUser = row => ({
      id: row.playerId,
      username: row.name,
      diceBear: row.diceBear,
      profilePhoto: row.profilePhoto,
      avatarSource: row.avatarSource
    })

    return {
      roundEnd,
      isChoices,
      isTie,
      isFirstRound,
      choicesTitle,
      winnerLabel,
      me,
      leaderboard,
      myId,
      isHost,
      isLastRound,
      isFinal,
      topScore,
      correctAnswer,
      title,
      cardClass,
      nextLeftSec,
      nextFraction,
      next,
      toUser
    }
  }
})
</script>

<style lang="scss" src="./PartyRoundResult.component.scss" scoped></style>
