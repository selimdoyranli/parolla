<template lang="pug">
.compose-qa-card
  // Question type switch
  Cell.creator-mode-compose-form__typeSwitchCell
    template(#title)
      span {{ $t('form.creatorModeCompose.qa.question.questionType.title') }}
    template(#right-icon)
      RadioGroup.type-radio-group(:value="item.questionType" direction="horizontal" @input="onQuestionTypeChange")
        Radio.type-radio(name="text")
          span.type-radio__text {{ $t('form.creatorModeCompose.qa.question.questionType.options.text') }}
          template(#icon="{ props }")
            AppIcon.type-radio__icon(name="tabler:pencil")
        Radio.type-radio(name="media")
          span.type-radio__text {{ $t('form.creatorModeCompose.qa.question.questionType.options.media') }}
          template(#icon="{ props }")
            AppIcon.type-radio__icon(name="tabler:photo")

  Cell.media-list(v-if="item.questionType === questionTypeEnum.MEDIA")
    template(#title)
      span {{ $t('form.creatorModeCompose.qa.question.photo') }}

    template(#label)
      MediaInput(
        input-type="file"
        :media="item.media"
        :media-note="item.mediaNote"
        :get-media-src="getMediaSrc"
        :get-media-alt="getMediaAlt"
        @update:media="onMediaUpdate"
        @update:mediaNote="onMediaNoteUpdate"
        @remove="onMediaRemove"
      )

      // Media missing warning for media type questions (only show when form has validation errors)
      .compose-qa-card__media-warning(v-if="!item.media && item.questionType === questionTypeEnum.MEDIA && !isFormValid")
        .van-field__error-message {{ $t('form.creatorModeCompose.qa.question.error.mediaRequired') }}

  Field.creator-mode-compose-form__questionField(
    v-if="item.questionType === questionTypeEnum.TEXT"
    v-model="item.question"
    name="question"
    :label="$t('form.creatorModeCompose.qa.question.label')"
    :placeholder="$t('form.creatorModeCompose.qa.question.placeholder')"
    maxlength="120"
    rows="2"
    autosize
    show-word-limit
    :rules="[{ required: true, message: $t('form.isRequired', { model: $t('form.creatorModeCompose.qa.question.label') }) }]"
  )

  // Answer type switch
  Cell.creator-mode-compose-form__typeSwitchCell
    template(#title)
      span {{ $t('form.creatorModeCompose.qa.answer.answerType.title') }}
    template(#right-icon)
      FilterDropdown(
        :options="answerTypeOptions"
        :selected="selectedAnswerTypeOption"
        :trigger-title="triggerTitle"
        :header-title="$t('form.creatorModeCompose.qa.answer.answerType.title')"
        @on-select-option="$emit('answer-type-change', { index, option: $event })"
      )

  span.creator-mode-compose-form-answer-label {{ $t('form.creatorModeCompose.qa.answer.label') }}

  // Trivia type answer
  Cell.creator-mode-compose-form-trivia-answer(v-if="item.answerType === answerTypeEnum.TRIVIA")
    TriviaForm(
      :options="item.triviaOptions"
      :correct-option-text="item.answer"
      @on-select-correct-option="$emit('trivia-select-correct', { option: $event, itemIndex: index })"
      @on-set-options="$emit('trivia-set-options', { options: $event, itemIndex: index })"
    )

  Field.creator-mode-compose-form__answerField(
    v-if="item.answerType === answerTypeEnum.TEXT_FIELD"
    v-model="item.answer"
    name="answer"
    :placeholder="$t('form.creatorModeCompose.qa.answer.label')"
    maxlength="120"
    show-word-limit
    rows="2"
    :formatter="formatAnswerField"
    :error-message="getAnswerErrorMessage(item)"
    :error="hasAnswerError(item)"
  )
    template(#input)
      input.van-field__control(
        :value="item.answer"
        :placeholder="$t('form.creatorModeCompose.qa.answer.placeholder')"
        maxlength="120"
        @input="e => $emit('get-character', e.target.value, { item, index })"
      )

  .compose-qa-card__actions
    label.compose-qa-card__index {{ index + 1 }}. {{ $t('general.question') }}

    template(v-if="!isSingle")
      Button.compose-qa-card__moveButton.compose-qa-card__moveButton--up(
        icon="arrow-up"
        round
        size="small"
        native-type="button"
        :disabled="isFirst"
        @click="$emit('move-up', index)"
      )
      Button.compose-qa-card__moveButton.compose-qa-card__moveButton--down(
        icon="arrow-down"
        round
        size="small"
        native-type="button"
        :disabled="isLast"
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
    ) {{ $t('form.creatorModeCompose.qa.question.removeQuestion') }}
</template>

<script>
import { defineComponent, computed, useContext } from '@nuxtjs/composition-api'
import { questionTypeEnum, answerTypeEnum } from '@/enums/quiz.enum'
import { Field, Cell, RadioGroup, Radio, Button, Dialog } from 'vant'
import MediaInput from './MediaInput.vue'

export default defineComponent({
  name: 'QuestionItem',
  components: {
    Field,
    Cell,
    RadioGroup,
    Radio,
    Button,
    MediaInput
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
    isFirst: Boolean,
    isLast: Boolean,
    isSingle: Boolean,
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
    const { i18n } = useContext()

    const onQuestionTypeChange = name => {
      let hasData = false

      if (props.item.questionType === questionTypeEnum.MEDIA) {
        if (props.item.media || props.item.mediaFile || (props.item.mediaNote && props.item.mediaNote.trim() !== '')) {
          hasData = true
        }
      } else if (props.item.questionType === questionTypeEnum.TEXT) {
        if (props.item.question && props.item.question.trim() !== '') {
          hasData = true
        }
      }

      if (hasData) {
        Dialog.confirm({
          title: i18n.t('form.creatorModeCompose.qa.question.changeType.title'),
          message: i18n.t('form.creatorModeCompose.qa.question.changeType.description'),
          confirmButtonText: i18n.t('form.creatorModeCompose.qa.question.changeType.confirm'),
          cancelButtonText: i18n.t('form.creatorModeCompose.qa.question.changeType.cancel')
        })
          .then(() => {
            performTypeChange(name)
          })
          .catch(() => {
            // Do nothing
          })
      } else {
        performTypeChange(name)
      }
    }

    const performTypeChange = name => {
      const updatedItem = { ...props.item, questionType: name }

      if (name === questionTypeEnum.TEXT) {
        updatedItem.media = null
        updatedItem.mediaFile = null
        updatedItem.mediaNote = ''
      } else if (name === questionTypeEnum.MEDIA) {
        updatedItem.question = ''
      }

      emit('update-item', updatedItem)
    }

    const onMediaUpdate = (mediaData, mediaFile) => {
      emit('update-item', {
        ...props.item,
        media: mediaData,
        mediaFile: mediaFile || null
      })
    }

    const onMediaNoteUpdate = note => {
      emit('update-item', { ...props.item, mediaNote: note })
    }

    const onMediaRemove = () => {
      emit('update-item', {
        ...props.item,
        media: null,
        mediaFile: null
      })
      emit('delete-media', { index: props.index })
    }

    const triggerTitle = computed(() => {
      if (props.item.answerType === answerTypeEnum.TEXT_FIELD) {
        return i18n.t('form.creatorModeCompose.qa.answer.answerType.options.textField')
      } else if (props.item.answerType === answerTypeEnum.TRIVIA) {
        return i18n.t('form.creatorModeCompose.qa.answer.answerType.options.trivia')
      }

      return ''
    })

    const selectedAnswerTypeOption = computed(() => {
      return {
        label: triggerTitle.value,
        value: props.item.answerType,
        icon: getAnswerTypeOptionsIcon(props.item.answerType)
      }
    })

    const getAnswerTypeOptionsIcon = type => {
      if (type === answerTypeEnum.TEXT_FIELD) {
        return 'tabler:pencil'
      } else if (type === answerTypeEnum.TRIVIA) {
        return 'tabler:list'
      }

      return 'tabler:pencil'
    }

    const formatAnswerField = value => {
      const formattedValue = value.startsWith(' ') ? '' : value

      return formattedValue
    }

    const hasAnswerError = item => {
      return item.isMatched === false || ((!item.answer || item.answer.trim() === '') && !props.isFormValid)
    }

    const getAnswerErrorMessage = item => {
      if (item.isMatched === false) {
        return i18n.t('form.creatorModeCompose.qa.answer.error.nonMatched')
      } else if ((!item.answer || item.answer.trim() === '') && !props.isFormValid) {
        return i18n.t('form.creatorModeCompose.qa.answer.error.required')
      }

      return null
    }

    return {
      questionTypeEnum,
      answerTypeEnum,
      triggerTitle,
      selectedAnswerTypeOption,
      formatAnswerField,
      hasAnswerError,
      getAnswerErrorMessage,
      onQuestionTypeChange,
      onMediaUpdate,
      onMediaNoteUpdate,
      onMediaRemove
    }
  }
})
</script>
