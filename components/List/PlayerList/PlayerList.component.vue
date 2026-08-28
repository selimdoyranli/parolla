<template lang="pug">
.player-list
  template(v-if="rows?.length > 0")
    Cell.player-list-item(v-for="(item, index) in rows" :key="index" :class="rowClass(item)")
      template(#title)
        .player-list-item-user(:data-rank="item.rank")
          strong.player-list-item-user__username
            PlayerAvatar(with-username open-player-dialog-on-click :size="20" :user="item")

          // The pinned row says why it is out of order: it is the reader's own standing
          .player-list-item-user__label(v-if="item.isCurrentPlayer")
            AppIcon.player-list-item-user__label-icon(name="tabler:target" :width="12" :height="12")
            span.player-list-item-user__label-text {{ $t('leaderboard.yourRank.label') }}
            span.player-list-item-user__label-text.player-list-item-user__label-text--short {{ $t('leaderboard.yourRank.short') }}

        .player-list-item-time(v-if="item.time")
          AppIcon.player-list-item-time__icon(name="tabler:clock" :width="16" :height="16")
          span.player-list-item-time__value
            strong {{ item.time.split(':')[0] }}
            | :
            strong {{ item.time.split(':')[1] }}
            | .
            sub {{ item.time.split(':')[2] }}

        .player-list-item-time.player-list-item-time--wordblock(v-if="item.results?.status === 'won'")
          AppIcon.player-list-item-time__icon(name="tabler:clock" :width="16" :height="16")
          span.player-list-item-time__value {{ formatElapsedTime(item.results.elapsedTimeAsMs) }}

        // Wordblock: attempts out of the maximum, or the letters found if it was never solved
        .player-list-item-score.player-list-item-score--wordblock(v-if="item.results?.status")
          template(v-if="item.results.status === 'won'")
            span.player-list-item-score__value.player-list-item-score__value--correct
              strong {{ item.results.attempts }}
            span.divider &nbsp;/&nbsp;
            span.player-list-item-score__value {{ maxAttempts }}
          template(v-else)
            span.player-list-item-score__value.player-list-item-score__value--wrong
              AppIcon(name="tabler:x" :width="14" :height="14")
              strong &nbsp;{{ item.results.greenLetters }}

        .player-list-item-time.player-list-item-time--results(v-if="item.results?.remainTime")
          AppIcon.player-list-item-time__icon(name="tabler:clock" :width="16" :height="16")
          span.player-list-item-time__value
            strong {{ item.results.remainTime.minutes }}
            | :
            strong {{ item.results.remainTime.seconds }}
            | .
            sub {{ item.results.remainTime.milliseconds }}

        .player-list-item-score(v-if="!item.results && item.score")
          span.player-list-item-score__value
            strong {{ item.score }}
            label &nbsp;puan

        .player-list-item-score(v-if="item.globalScore != null || item.globalScore != undefined")
          span.player-list-item-score__value
            strong {{ item.globalScore }}
            label &nbsp;puan

        .player-list-item-score.player-list-item-score--results(v-if="item.results?.correctAnswers")
          span.player-list-item-score__value.player-list-item-score__value--correct
            strong {{ item.results.correctAnswers?.length }}
          span.divider /&nbsp;
          span.player-list-item-score__value.player-list-item-score__value--wrong
            strong {{ item.results.wrongAnswers?.length }}
          span.divider /&nbsp;
          span.player-list-item-score__value.player-list-item-score__value--passed
            strong {{ item.results.passedAnswers?.length }}

  template(v-else)
    .player-list__empty
      slot(name="empty")
</template>

<script>
import { defineComponent, computed } from '@nuxtjs/composition-api'
import { Cell } from 'vant'
import { WORDBLOCK_MAX_ATTEMPTS } from '@/system/constant'

export default defineComponent({
  name: 'PlayerList',
  components: {
    Cell
  },
  props: {
    items: {
      type: Array,
      required: false,
      default: null
    },
    // The reader's own standing, pinned above the list. The board only carries the first
    // N players, so without it anyone outside that window cannot see where they placed.
    currentPlayer: {
      type: Object,
      required: false,
      default: null
    }
  },
  setup(props) {
    const rows = computed(() => {
      if (!props.currentPlayer) {
        return props.items
      }

      return [{ ...props.currentPlayer, isCurrentPlayer: true }, ...(props.items || [])]
    })

    // A player inside the listed window appears twice: pinned on top and in place. Marking
    // the in-place row keeps the repeat from reading as a glitch.
    const isSelfInline = item => Boolean(props.currentPlayer) && !item.isCurrentPlayer && item.id === props.currentPlayer.id

    const answerStatusClass = isCorrect => {
      if (isCorrect == null || isCorrect == undefined) {
        return null
      }

      return isCorrect ? 'player-list-item--success' : 'player-list-item--danger'
    }

    const rowClass = item => [
      answerStatusClass(item.isCorrect),
      {
        'player-list-item--results': item.results,
        'player-list-item--self': item.isCurrentPlayer,
        'player-list-item--self-inline': isSelfInline(item)
      }
    ]

    const { formatElapsedTime } = useElapsedTime()

    return {
      rows,
      rowClass,
      answerStatusClass,
      maxAttempts: WORDBLOCK_MAX_ATTEMPTS,
      formatElapsedTime
    }
  }
})
</script>

<style lang="scss" src="./PlayerList.component.scss"></style>
