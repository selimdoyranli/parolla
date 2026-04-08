<template lang="pug">
Dialog.dialog.create-quiz-selection-dialog(
  v-model="state.isOpen"
  :title="$t('dialog.createQuizSelection.title')"
  :cancel-button-text="cancelButtonText || $t('general.close')"
  :show-confirm-button="false"
  :show-cancel-button="true"
  :close-on-click-overlay="false"
  @closed="$emit('closed')"
  @opened="$emit('opened')"
)
  .quiz-type-list
    IntroButton.quiz-type-list-item(
      icon="emojione:question-mark"
      auth-control
      :to="localePath({ name: 'CreatorMode-CreatorModeCompose' })"
      :title="$t('dialog.createQuizSelection.quizType.qa.title')"
      :headLabel="{ title: $t('dialog.createQuizSelection.quizType.qa.label') }"
      :description="$t('dialog.createQuizSelection.quizType.qa.description')"
      :playButtonText="$t('dialog.createQuizSelection.quizType.qa.createQaQuiz')"
    )

    IntroButton.quiz-type-list-item(
      auth-control
      :to="localePath({ name: 'CreatorMode-CreatorModeCompose-Choices' })"
      :title="$t('dialog.createQuizSelection.quizType.thisOrThat.title')"
      :headLabel="{ title: $t('dialog.createQuizSelection.quizType.thisOrThat.label') }"
      :description="$t('dialog.createQuizSelection.quizType.thisOrThat.description')"
      :playButtonText="$t('dialog.createQuizSelection.quizType.thisOrThat.createThisOrThatQuiz')"
    )
      template(#icon)
        img.quiz-type-list-item__icon(src="/img/elements/versus.webp" alt="Versus" draggable="false" width="48" height="48")

    IntroButton.quiz-type-list-item(
      icon="tabler:cards"
      auth-control
      :to="localePath({ name: 'CreatorMode-CreatorModeCompose-Flashcards' })"
      :title="$t('dialog.createQuizSelection.quizType.flashcards.title')"
      :headLabel="{ title: $t('dialog.createQuizSelection.quizType.flashcards.label') }"
      :description="$t('dialog.createQuizSelection.quizType.flashcards.description')"
      :playButtonText="$t('dialog.createQuizSelection.quizType.flashcards.createFlashcardsQuiz')"
    )
</template>

<script>
import { defineComponent, reactive, watch } from '@nuxtjs/composition-api'
import { Dialog } from 'vant'

export default defineComponent({
  components: {
    Dialog: Dialog.Component
  },
  props: {
    isOpen: {
      type: Boolean,
      required: false,
      default: false
    },
    cancelButtonText: {
      type: String,
      required: false,
      default: null
    }
  },
  setup(props) {
    const state = reactive({
      isOpen: props.isOpen
    })

    watch(
      () => props.isOpen,
      value => {
        state.isOpen = value
      }
    )

    return { state }
  }
})
</script>

<style lang="scss" src="./CreateQuizSelectionDialog.component.scss"></style>
