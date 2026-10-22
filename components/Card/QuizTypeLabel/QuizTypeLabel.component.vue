<template lang="pug">
span.quiz-type-label(:class="`quiz-type-label--${pill.key}`")
  img.quiz-type-label__versus(v-if="pill.key === 'choices'" src="/img/elements/versus.webp" alt draggable="false" width="18" height="18")
  AppIcon.quiz-type-label__icon(v-else :name="pill.icon" :width="16" :height="16")
  span.quiz-type-label__text {{ pill.label }}
</template>

<script>
import { defineComponent, useContext, computed } from '@nuxtjs/composition-api'
import { quizTypeEnum, questionTypeEnum, answerTypeEnum } from '@/enums/quiz.enum'

// quiz-type pill (choices / flashcards / photo / trivia / plain quiz), shared by QuizCard and the play intro
export default defineComponent({
  props: {
    room: {
      type: Object,
      required: false,
      default: null
    },
    // render a kind directly (e.g. filter options) instead of deriving it from a room
    kind: {
      type: String,
      required: false,
      default: null
    }
  },
  setup(props) {
    const { i18n } = useContext()

    const roomKind = room => {
      if (!room) return 'qa'

      if (room.quizType === quizTypeEnum.CHOICES) return 'choices'

      if (room.quizType === quizTypeEnum.FLASHCARDS) return 'flashcards'

      if (room.questionTypeDominance === questionTypeEnum.MEDIA) return 'media'

      if (room.answerTypeDominance === answerTypeEnum.TRIVIA) return 'trivia'

      return 'qa'
    }

    const pill = computed(() => {
      const key = props.kind || roomKind(props.room)

      return {
        key,
        ...{
          qa: { icon: 'tabler:message-question', label: i18n.t('general.quiz') },
          media: { icon: 'streamline-flex-color:gallery-flat', label: i18n.t('general.photoQuiz') },
          choices: { icon: null, label: i18n.t('general.thisOrThatQuiz') },
          trivia: { icon: 'streamline-flex-color:table-flat', label: i18n.t('general.triviaQuiz') },
          flashcards: { icon: 'streamline-color:cards-flat', label: i18n.t('general.flashcardsQuiz') }
        }[key]
      }
    })

    return { pill }
  }
})
</script>

<style lang="scss" src="./QuizTypeLabel.component.scss"></style>
