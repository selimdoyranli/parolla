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

        .player-list-item-score.player-list-item-score--results(v-if="item.results")
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

    return {
      answerStatusClass
    }
  }
})
</script>

<style lang="scss" src="./PlayerList.component.scss"></style>
