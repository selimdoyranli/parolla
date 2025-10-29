<template lang="pug">
.leaderboard
  strong.leaderboard__title(v-if="title") {{ title }}

  template(v-if="scorers?.length > 0")
    .top-scorer-list
      .top-scorer-list-item(v-for="(scorer, index) in scorers.slice(0, 3)" :key="scorer.username" :data-rank="index + 1")
        PlayerAvatar(with-username open-player-dialog-on-click :size="48" :user="scorer")

        .top-scorer-list-item-score.top-scorer-list-item-score--results(v-if="scorer.results")
          span.top-scorer-list-item-score__value.top-scorer-list-item-score__value--correct
            strong {{ scorer.results.correctAnswers?.length }}
          span.divider &nbsp;/&nbsp;
          span.top-scorer-list-item-score__value.top-scorer-list-item-score__value--wrong
            strong {{ scorer.results.wrongAnswers?.length }}
          span.divider &nbsp;/&nbsp;
          span.top-scorer-list-item-score__value.top-scorer-list-item-score__value--passed
            strong {{ scorer.results.passedAnswers?.length }}

          .time
            AppIcon(name="tabler:clock" :width="16" :height="16")
            span.time__value
              span {{ scorer.results.remainTime.minutes }}
              | :
              span {{ scorer.results.remainTime.seconds }}
              | .
              small {{ scorer.results.remainTime.milliseconds }}

        .top-scorer-list-item-score(v-if="!scorer.results && scorer.score")
          span.top-scorer-list-item-score__value
            strong {{ scorer.score }}
            | puan

        .top-scorer-list-item-time(v-if="scorer.time")
          AppIcon.top-scorer-list-item-time__icon(name="tabler:clock" :width="16" :height="16")
          span.top-scorer-list-item-time__value
            strong {{ scorer.time.split(':')[0] }}
            | :
            strong {{ scorer.time.split(':')[1] }}
            | .
            sub {{ scorer.time.split(':')[2] }}

        .top-scorer-list-item-rank
          .top-scorer-list-item-rank__number {{ index + 1 }}

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
