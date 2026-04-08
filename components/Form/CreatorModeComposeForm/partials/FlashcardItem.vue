<template lang="pug">
.compose-qa-card.flashcard-item
  Field.creator-mode-compose-form__questionField(
    v-model="item.cardFrontText"
    name="cardFrontText"
    type="textarea"
    :label="$t('form.creatorModeCompose.flashcards.front.label')"
    :placeholder="$t('form.creatorModeCompose.flashcards.front.placeholder')"
    maxlength="256"
    rows="2"
    autosize
    show-word-limit
    :rules="[{ required: true, message: $t('form.isRequired', { model: $t('form.creatorModeCompose.flashcards.front.label') }) }]"
  )

  Field.creator-mode-compose-form__questionField(
    v-model="item.cardBackText"
    name="cardBackText"
    type="textarea"
    :label="$t('form.creatorModeCompose.flashcards.back.label')"
    :placeholder="$t('form.creatorModeCompose.flashcards.back.placeholder')"
    maxlength="256"
    rows="2"
    autosize
    show-word-limit
    :rules="[{ required: true, message: $t('form.isRequired', { model: $t('form.creatorModeCompose.flashcards.back.label') }) }]"
  )

  .compose-qa-card__actions
    label.compose-qa-card__index {{ index + 1 }}. {{ $t('form.creatorModeCompose.flashcards.card') }}

    .compose-qa-card__orderButtons
      Button.compose-qa-card__orderButton(
        v-if="index > 0"
        icon="arrow-up"
        plain
        native-type="button"
        round
        size="small"
        @click="$emit('move-up', index)"
      )
      Button.compose-qa-card__orderButton(
        v-if="!isLast"
        icon="arrow-down"
        plain
        native-type="button"
        round
        size="small"
        @click="$emit('move-down', index)"
      )

    Button.compose-qa-card__removeButton(
      type="danger"
      icon="cross"
      plain
      native-type="button"
      round
      size="small"
      @click="$emit('remove', index)"
    ) {{ $t('form.creatorModeCompose.flashcards.removeCard') }}
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import { Field, Button } from 'vant'

export default defineComponent({
  name: 'FlashcardItem',
  components: {
    Field,
    Button
  },
  props: {
    item: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      required: true
    },
    isLast: {
      type: Boolean,
      default: false
    }
  }
})
</script>

<style lang="scss" src="./FlashcardItem.scss"></style>
