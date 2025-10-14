<template lang="pug">
table.player-tour-score-table
  thead
    tr
      th Periyot
      th Skor
      th Sıra
  tbody
    tr.player-tour-score-table-item
      td.player-tour-score-table-item-title Günlük
      td.player-tour-score-table-item-score {{ tourScore.daily.score }}
      td.player-tour-score-table-item-rank {{ tourScore.daily.rank }}

    tr.player-tour-score-table-item
      td.player-tour-score-table-item-title Haftalık
      td.player-tour-score-table-item-score {{ tourScore.weekly.score }}
      td.player-tour-score-table-item-rank {{ tourScore.weekly.rank }}

    tr.player-tour-score-table-item
      td.player-tour-score-table-item-title Aylık
      td.player-tour-score-table-item-score {{ tourScore.monthly.score }}
      td.player-tour-score-table-item-rank {{ tourScore.monthly.rank }}

    tr.player-tour-score-table-item
      td.player-tour-score-table-item-title Tüm zamanlar
      td.player-tour-score-table-item-score {{ tourScore.allTime.score }}
      td.player-tour-score-table-item-rank {{ tourScore.allTime.rank }}
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  props: {
    tourScore: {
      type: Object,
      required: true
    }
  }
})
</script>

<style lang="scss" src="./PlayerTourScoreTable.component.scss"></style>
