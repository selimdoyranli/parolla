<template lang="pug">
.winner-choice-list
  .winner-choice-list__header
    span.winner-choice-list__icon
      AppIcon(name="tabler:trophy" :width="18" :height="18")
    span.winner-choice-list__title {{ $t('choices.winner.winnerChoices.title') }}

  .winner-choice-item(v-for="(item, index) in items" :key="item.id")
    .winner-choice-item__name
      span.winner-choice-item__rank {{ index + 1 }}.
      | {{ getName(item) }}
    .winner-choice-item__body
      .winner-choice-item__thumb
        img(v-if="item.media?.url" :src="item.media.url" alt loading="lazy" draggable="false")
        AppIcon(v-else-if="item.choiceType === choiceTypeEnum.YOUTUBE" name="tabler:brand-youtube" :width="28" :height="28")
        AppIcon(v-else name="tabler:letter-case" :width="28" :height="28")
      .winner-choice-item__stats
        .winner-choice-stat.winner-choice-stat--champion
          .winner-choice-stat__label {{ $t('choices.winner.winnerChoices.championRate') }}
            strong % {{ item.championRate || 0 }}
          .winner-choice-stat__bar
            span(:style="{ width: `${item.championRate || 0}%` }")
        .winner-choice-stat.winner-choice-stat--win
          .winner-choice-stat__label {{ $t('choices.winner.winnerChoices.winRate') }}
            strong % {{ item.winRate || 0 }}
          .winner-choice-stat__bar
            span(:style="{ width: `${item.winRate || 0}%` }")
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import { choiceTypeEnum } from '@/enums/quiz.enum'

export default defineComponent({
  props: {
    items: {
      type: Array,
      required: true
    }
  },
  setup() {
    const getName = item => (item.choiceType === choiceTypeEnum.TEXT ? item.text : item.mediaNote)

    return {
      choiceTypeEnum,
      getName
    }
  }
})
</script>

<style lang="scss" src="./WinnerChoiceList.component.scss"></style>
