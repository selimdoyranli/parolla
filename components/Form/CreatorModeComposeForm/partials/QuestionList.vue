<template lang="pug">
.question-list
  span.creator-mode-compose-form__fieldsTitle {{ $t('form.creatorModeCompose.qaSet') }}
  .creator-mode-compose-form__fields
    .compose-qa-list
      template(v-if="qaList && qaList.length > 0")
        QuestionItem(
          v-for="(item, index) in qaList"
          :key="item.id"
          :item="item"
          :index="index"
          :is-first="index === 0"
          :is-last="index === qaList.length - 1"
          :is-single="qaList.length === 1"
          :answer-type-options="answerTypeOptions"
          :get-media-src="getMediaSrc"
          :get-media-alt="getMediaAlt"
          :is-form-valid="isFormValid"
          @add-media="$emit('add-media', $event)"
          @delete-media="$emit('delete-media', $event)"
          @answer-type-change="$emit('answer-type-change', $event)"
          @trivia-select-correct="$emit('trivia-select-correct', $event)"
          @trivia-set-options="$emit('trivia-set-options', $event)"
          @get-character="(val, args) => $emit('get-character', val, args)"
          @move-up="$emit('move-up', $event)"
          @move-down="$emit('move-down', $event)"
          @remove="$emit('remove', $event)"
        )

      // Empty List
      template(v-else)
        Empty(:description="$t('form.creatorModeCompose.qa.empty.description')")
          Button.compose-qa-list__addQaButton(type="info" icon="plus" native-type="button" round @click="$emit('add-item')")
            | {{ $t('form.creatorModeCompose.qa.empty.action') }}

      // Add qa button
      Button.compose-qa-list__addQaButton(
        v-if="qaList && qaList.length > 0"
        type="info"
        icon="plus"
        plain
        native-type="button"
        round
        :loading="isBusy"
        :disabled="isBusy"
        @click="$emit('add-item')"
      ) {{ $t('form.creatorModeCompose.qa.addMoreQuestion') }}

      p.creator-mode-compose-form__termsDescription(v-if="qaList && qaList.length > 0")
        | {{ $t('form.creatorModeCompose.termsDescription') }}
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import { Empty, Button } from 'vant'

export default defineComponent({
  name: 'QuestionList',
  components: {
    Empty,
    Button
  },
  props: {
    qaList: {
      type: Array,
      required: true
    },
    isBusy: {
      type: Boolean,
      default: false
    },
    answerTypeOptions: {
      type: Array,
      required: true
    },
    getMediaSrc: {
      type: Function,
      required: true
    },
    getMediaAlt: {
      type: Function,
      required: true
    },
    isFormValid: {
      type: Boolean,
      default: true
    }
  }
})
</script>
