<template lang="pug">
.winner-choice-list
  span.winner-choice-list__title {{ $t('choices.winner.winnerChoices.title') }}

  .winner-choice-list__items
    ChoiceCard(v-for="item in items" :key="item.id" :choice="item")
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  props: {
    items: {
      type: Array,
      required: true
    }
  },
  setup() {}
})
</script>

<style lang="scss" src="./WinnerChoiceList.component.scss"></style>
