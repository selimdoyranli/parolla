<template lang="pug">
.question-list
  span.creator-mode-compose-form__fieldsTitle(v-if="quizType === quizTypeEnum.CHOICES") {{ $t('form.creatorModeCompose.choicesSet') }}
  span.creator-mode-compose-form__fieldsTitle(v-else) {{ $t('form.creatorModeCompose.qaSet') }}
  .creator-mode-compose-form__fields
    .compose-qa-list
      // Choices Type List
      template(v-if="quizType === quizTypeEnum.CHOICES")
        template(v-if="choices && choices.length > 0")
          .question-list-item(v-for="(item, index) in choices" :key="item.id")
            ChoiceItem(
              :item="item"
              :index="index"
              :get-media-src="getMediaSrc"
              :get-media-alt="getMediaAlt"
              @remove="$emit('remove', index)"
              @add-media="$emit('add-media', $event)"
              @delete-media="$emit('delete-media', $event)"
              @update-item="updateChoiceItem($event, index)"
            )

        // Empty List
        template(v-else)
          Empty.question-list-choices-empty
            template(#image)
              AppIcon.question-list-choices-empty__icon(name="hugeicons:versus" :width="128" :height="128")
            p.question-list-choices-empty__description {{ $t('form.creatorModeCompose.choices.empty.description') }}
            Button.compose-qa-list__addQaButton(type="info" icon="plus" native-type="button" round @click="$emit('open-batch-dialog')")
              | {{ $t('form.creatorModeCompose.choices.empty.action') }}

        // Add choices button
        Button.compose-qa-list__addQaButton.me-2(
          v-if="choices && choices.length > 0"
          type="info"
          icon="plus"
          plain
          native-type="button"
          round
          :loading="isBusy"
          :disabled="isBusy"
          @click="$emit('add-item')"
        )
          | {{ $t('form.creatorModeCompose.choices.addMore.action') }}

        // Add multiple choices button
        Button(
          v-if="choices && choices.length > 0"
          color="light-dark(#666, #aaa)"
          icon="plus"
          plain
          native-type="button"
          size="small"
          round
          :loading="isBusy"
          :disabled="isBusy"
          @click="$emit('open-batch-dialog')"
        ) {{ $t('form.creatorModeCompose.choices.addMore.addMultiple') }}

      // QA Type List
      template(v-if="quizType === quizTypeEnum.QA")
        template(v-if="qaList && qaList.length > 0")
          .question-list-item(v-for="(item, index) in qaList" :key="item.id")
            QuestionItem(
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
              @update-item="updateQaItem($event, index)"
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
        )
          | {{ $t('form.creatorModeCompose.qa.addMoreQuestion') }}

      p.creator-mode-compose-form__termsDescription
        | {{ $t('form.creatorModeCompose.termsDescription') }}
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import { quizTypeEnum } from '@/enums/quiz.enum'
import { Empty, Button } from 'vant'
import ChoiceItem from './ChoiceItem.vue'
import QuestionItem from './QuestionItem.vue'

export default defineComponent({
  name: 'QuestionList',
  components: {
    Empty,
    Button,
    ChoiceItem,
    QuestionItem
  },
  props: {
    qaList: {
      type: Array,
      default: () => []
    },
    choices: {
      type: Array,
      default: () => []
    },
    quizType: {
      type: String,
      default: quizTypeEnum.QA
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
  },
  setup(props, { emit }) {
    const updateQaItem = (newItem, index) => {
      const newList = [...props.qaList]
      newList[index] = newItem
      emit('update:qaList', newList)
    }

    const updateChoiceItem = (newItem, index) => {
      const newList = [...props.choices]
      newList[index] = newItem
      emit('update:choices', newList)
    }

    return {
      quizTypeEnum,
      updateQaItem,
      updateChoiceItem
    }
  }
})
</script>

<style lang="scss" src="./QuestionList.scss"></style>
