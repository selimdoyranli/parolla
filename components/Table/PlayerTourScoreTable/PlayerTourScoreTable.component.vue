<template lang="pug">
table.player-tour-score-table
  thead
    tr
      th Periyot
      th Skor
      th Sıra
  tbody
    tr.player-tour-score-table-item
      td.player-tour-score-table-item-title {{ $t('leaderboard.daily.short') }}
      td.player-tour-score-table-item-score {{ tourScore.daily.score }}
      td.player-tour-score-table-item-rank {{ tourScore.daily.rank }}

    tr.player-tour-score-table-item
      td.player-tour-score-table-item-title {{ $t('leaderboard.weekly.short') }}
      td.player-tour-score-table-item-score {{ tourScore.weekly.score }}
      td.player-tour-score-table-item-rank {{ tourScore.weekly.rank }}

    tr.player-tour-score-table-item
      td.player-tour-score-table-item-title {{ $t('leaderboard.monthly.short') }}
      td.player-tour-score-table-item-score {{ tourScore.monthly.score }}
      td.player-tour-score-table-item-rank {{ tourScore.monthly.rank }}

    tr.player-tour-score-table-item
      td.player-tour-score-table-item-title {{ $t('leaderboard.season.short', { seasonYear }) }}
      td.player-tour-score-table-item-score {{ tourScore.season.score }}
      td.player-tour-score-table-item-rank {{ tourScore.season.rank }}
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  props: {
    tourScore: {
      type: Object,
      required: true
    }
  },
  setup() {
    const { seasonYear } = useFormatter()

    return {
      seasonYear
    }
  }
})
</script>

<style lang="scss" src="./PlayerTourScoreTable.component.scss"></style>
