<template lang="pug">
.leaderboard
  strong.leaderboard__title(v-if="title") {{ title }}

  template(v-if="scorers?.length > 0")
    .top-scorer-list
      // Always render 3 slots so the podium stays centered when only 1 or 2
      // scorers exist. Missing slots are invisible but reserve their space so
      // rank-1 stays in the middle, rank-2 on the left, rank-3 on the right.
      template(v-for="index in 3")
        .top-scorer-list-item(:key="scorers[index - 1].username" v-if="scorers[index - 1]" :data-rank="index")
          AppIcon.top-scorer-list-item-crown(v-if="index === 1" name="tabler:crown" :width="28" :height="28")
          PlayerAvatar(with-username open-player-dialog-on-click :size="64" :user="scorers[index - 1]")

          .top-scorer-list-item-score.top-scorer-list-item-score--results(v-if="scorers[index - 1].results")
            span.top-scorer-list-item-score__value.top-scorer-list-item-score__value--correct
              strong {{ scorers[index - 1].results.correctAnswers?.length }}
            span.divider &nbsp;/&nbsp;
            span.top-scorer-list-item-score__value.top-scorer-list-item-score__value--wrong
              strong {{ scorers[index - 1].results.wrongAnswers?.length }}
            span.divider &nbsp;/&nbsp;
            span.top-scorer-list-item-score__value.top-scorer-list-item-score__value--passed
              strong {{ scorers[index - 1].results.passedAnswers?.length }}

            .time
              AppIcon(name="tabler:clock" :width="16" :height="16")
              span.time__value
                span {{ scorers[index - 1].results.remainTime.minutes }}
                | :
                span {{ scorers[index - 1].results.remainTime.seconds }}
                | .
                small {{ scorers[index - 1].results.remainTime.milliseconds }}

          .top-scorer-list-item-score(v-if="!scorers[index - 1].results && scorers[index - 1].score")
            span.top-scorer-list-item-score__value
              strong {{ scorers[index - 1].score }}
              | puan

          .top-scorer-list-item-time(v-if="scorers[index - 1].time")
            AppIcon.top-scorer-list-item-time__icon(name="tabler:clock" :width="16" :height="16")
            span.top-scorer-list-item-time__value
              strong {{ scorers[index - 1].time.split(':')[0] }}
              | :
              strong {{ scorers[index - 1].time.split(':')[1] }}
              | .
              sub {{ scorers[index - 1].time.split(':')[2] }}

          .top-scorer-list-item-rank
            .top-scorer-list-item-rank__number {{ index }}

        .top-scorer-list-item.top-scorer-list-item--placeholder(v-else :key="`ph-${index}`" aria-hidden="true" :data-rank="index")

    PlayerList(v-if="scorers.length > 3" :items="scorers.slice(3)")

  template(v-else)
    .leaderboard__empty
      slot(name="empty")
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Leaderboard',
  props: {
    title: {
      type: String,
      required: false,
      default: null
    },
    scorers: {
      type: Array,
      required: true
    }
  }
})
</script>

<style lang="scss" src="./Leaderboard.component.scss"></style>
