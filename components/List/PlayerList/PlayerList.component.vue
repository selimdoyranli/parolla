<template lang="pug">
.player-list
  template(v-if="items?.length > 0")
    Cell.player-list-item(
      v-for="(item, index) in items"
      :key="index"
      :class="[answerStatusClass(item.isCorrect), { 'player-list-item--results': item.results }]"
    )
      template(#title)
        .player-list-item-user
          strong.player-list-item-user__username
            PlayerAvatar(with-username open-player-dialog-on-click :size="20" :user="item")

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
import { defineComponent } from '@nuxtjs/composition-api'
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
    }
  },
  setup() {
    const answerStatusClass = isCorrect => {
      if (isCorrect == null || isCorrect == undefined) {
        return null
      }

      return isCorrect ? 'player-list-item--success' : 'player-list-item--danger'
    }

    const { formatElapsedTime } = useElapsedTime()

    return {
      answerStatusClass,
      maxAttempts: WORDBLOCK_MAX_ATTEMPTS,
      formatElapsedTime
    }
  }
})
</script>

<style lang="scss" src="./PlayerList.component.scss"></style>
