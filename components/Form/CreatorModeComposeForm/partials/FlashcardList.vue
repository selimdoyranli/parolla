<template lang="pug">
.flashcard-list
  span.creator-mode-compose-form__fieldsTitle {{ $t('form.creatorModeCompose.flashcards.set') }}
  .creator-mode-compose-form__fields
    .compose-qa-list
      // Flashcard List
      template(v-if="flashcardList && flashcardList.length > 0")
        .flashcard-list-item(v-for="(item, index) in flashcardList" :key="item.id")
          FlashcardItem(
            :item="item"
            :index="index"
            :is-first="index === 0"
            :is-last="index === flashcardList.length - 1"
            :is-single="flashcardList.length === 1"
            @remove="$emit('remove', index)"
            @move-up="$emit('move-up', index)"
            @move-down="$emit('move-down', index)"
          )

      // Empty List
      template(v-else)
        Empty.flashcard-list-empty
          template(#image)
            AppIcon.flashcard-list-empty__icon(name="streamline-color:cards-flat" :width="128" :height="128")
          p.flashcard-list-empty__description {{ $t('form.creatorModeCompose.flashcards.empty.description') }}
          Button.compose-qa-list__addQaButton(type="info" icon="plus" native-type="button" round @click="$emit('add-item')")
            | {{ $t('form.creatorModeCompose.flashcards.empty.action') }}

      // Add flashcard button
      Button.compose-qa-list__addQaButton(
        v-if="flashcardList && flashcardList.length > 0"
        type="info"
        icon="plus"
        plain
        native-type="button"
        round
        :loading="isBusy"
        :disabled="isBusy"
        @click="$emit('add-item')"
      )
        | {{ $t('form.creatorModeCompose.flashcards.addMore.action') }}

    p.creator-mode-compose-form__termsDescription
      | {{ $t('form.creatorModeCompose.termsDescription') }}
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import { Empty, Button } from 'vant'
import FlashcardItem from './FlashcardItem.vue'

export default defineComponent({
  name: 'FlashcardList',
  components: {
    Empty,
    Button,
    FlashcardItem
  },
  props: {
    flashcardList: {
      type: Array,
      default: () => []
    },
    isBusy: {
      type: Boolean,
      default: false
    }
  }
})
</script>

<style lang="scss" src="./FlashcardList.scss"></style>
