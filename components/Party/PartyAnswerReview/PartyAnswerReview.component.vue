<template lang="pug">
//- final screen (qa): every question folded to one line; open one to see what each player wrote
section.party-card.party-answer-review
  header.party-card__head
    .party-card__head-icon
      AppIcon(name="tabler:list-check" :width="18" :height="18")
    .party-card__head-text
      span.party-card__eyebrow {{ $t('party.final.answers') }}
      h3.party-card__title {{ $t('party.final.answersSub') }}

  Collapse.party-answer-review__list(v-model="openItems" :border="false")
    CollapseItem(v-for="item in items" :key="item.index" :name="item.index" :border="false")
      template(#title)
        .party-answer-review__q
          span.party-answer-review__no(:class="item.mine && `party-answer-review__no--${item.mine}`") {{ item.letter || item.index + 1 }}
          span.party-answer-review__text {{ item.text }}
      template(#value)
        span.party-answer-review__count
          AppIcon(name="tabler:check" :width="14" :height="14")
          | {{ item.correctCount }}/{{ item.rows.length }}

      p.party-answer-review__correct
        span {{ $t('party.final.correctAnswer') }}
        b {{ item.correctAnswer }}
      ul.party-answer-review__rows
        li.party-answer-review__row(
          v-for="row in item.rows"
          :key="row.playerId"
          :class="[`party-answer-review__row--${row.state}`, { 'party-answer-review__row--me': row.playerId === myId }]"
        )
          PlayerAvatar(:user="toUser(row)" :size="22" :open-player-dialog-on-click="!isGuest(row)")
          span.party-answer-review__name.party-user-name(:class="{ 'is-link': !isGuest(row) }" @click="openPlayer(row)")
            | {{ row.name }}
            span.gm-username-extra(v-if="isGm(row)") &nbsp;(GM)
          span.party-answer-review__answer {{ row.answer || $t('party.final.noAnswer') }}
          b.party-answer-review__points(v-if="row.points") +{{ row.points }}
          AppIcon.party-answer-review__mark(:name="markIcon[row.state]" :width="16" :height="16")
</template>

<script>
import { defineComponent, ref, computed, useStore, useContext } from '@nuxtjs/composition-api'
import { Collapse, CollapseItem } from 'vant'
import { answerTypeEnum } from '@/enums/quiz.enum'
import { usePartyUser } from '@/composables/usePartyUser'

const STATE_ORDER = { correct: 0, wrong: 1, none: 2 }

export default defineComponent({
  components: { Collapse, CollapseItem },
  props: {
    // party_final review: [{ index, question, mediaNote, letter, correctAnswer, answerType, answers: [{ playerId, name, answer, correct, points }] }]
    review: { type: Array, required: true },
    // final leaderboard rows (may be null when the board is hidden): avatars + who played
    leaderboard: { type: Array, default: null }
  },
  setup(props) {
    const store = useStore()
    const { i18n } = useContext()
    const { toUser, isGuest, isGm, openPlayer } = usePartyUser()
    const myId = computed(() => store.state.party.myId)
    const openItems = ref([])
    const markIcon = { correct: 'tabler:circle-check-filled', wrong: 'tabler:circle-x-filled', none: 'tabler:minus' }

    // who played: the board when shown, else the room's answering members (never the presenter)
    const players = computed(() => {
      if (props.leaderboard) return props.leaderboard

      const presenterId = store.getters['party/game']?.presenterId

      return store.getters['party/players'].filter(p => p.id !== presenterId).map(p => ({ ...p, playerId: p.id }))
    })
    const playerOf = id => players.value.find(p => p.playerId === id) || store.getters['party/players'].find(p => p.id === id)

    // same as the round result: text answers keep their comma alternatives in one string, trivia may contain commas
    const formatAnswer = q =>
      q.answerType === answerTypeEnum.TRIVIA
        ? String(q.correctAnswer || '')
        : String(q.correctAnswer || '')
            .split(',')
            .map(a => a.trim())
            .filter(Boolean)
            .join(' / ')

    const items = computed(() =>
      props.review.map(q => {
        const answered = q.answers.map(a => ({ ...playerOf(a.playerId), ...a, name: a.name || playerOf(a.playerId)?.name || '?' }))
        const silent = players.value
          .filter(p => !q.answers.some(a => a.playerId === p.playerId))
          .map(p => ({ ...p, answer: null, points: 0 }))
        const rows = [...answered, ...silent]
          .map(r => ({ ...r, state: r.answer === null ? 'none' : r.correct ? 'correct' : 'wrong' }))
          .sort((a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state] || b.points - a.points)
        const mine = rows.find(r => r.playerId === myId.value)

        return {
          index: q.index,
          letter: q.letter,
          text: q.question || q.mediaNote || i18n.t('party.final.question', { n: q.index + 1 }),
          correctAnswer: formatAnswer(q),
          correctCount: rows.filter(r => r.state === 'correct').length,
          mine: mine ? mine.state : null,
          rows
        }
      })
    )

    return { myId, openItems, markIcon, items, toUser, isGuest, isGm, openPlayer }
  }
})
</script>

<style lang="scss" src="./PartyAnswerReview.component.scss" scoped></style>
