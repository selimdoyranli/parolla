<template lang="pug">
Form.trivia-form(validate-first @keypress.enter.prevent @submit="onFormSubmit")
  p.trivia-form__description {{ $t('form.creatorModeCompose.qa.answer.answerType.trivia.description') }}

  template(v-for="(option, index) in form.options")
    Field.trivia-form__option(
      v-model="option.text"
      :placeholder="$t('form.creatorModeCompose.qa.answer.answerType.trivia.optionPlaceholder')"
      maxlength="64"
      rows="1"
      show-word-limit
      :class="{ 'trivia-form__option--correct': form.correctOption.index === index }"
      :rules="[{ required: true, message: $t('form.isRequired', { model: $t('general.option') }) }]"
    )
      template(#left-icon)
        span.trivia-form-correct-option-label(v-if="form.correctOption.index === index")
          | {{ $t('form.creatorModeCompose.qa.answer.answerType.trivia.correctOption') }}

        Button.trivia-form-option-select-correct-button(
          type="primary"
          plain
          round
          size="small"
          native-type="submit"
          :disabled="!getIsActiveSelectCorrectOptionButton(option)"
          @click="selectCorrectOption(option, index)"
        )
          AppIcon.trivia-form-option-remove-button__icon(name="tabler:check" :width="16" :height="16")
      template(#button)
        Button.trivia-form-option-remove-button(
          type="danger"
          v-show="isActiveRemoveOptionButton"
          plain
          round
          size="mini"
          native-type="button"
          @click="removeOption(index)"
        )
          AppIcon.trivia-form-option-remove-button__icon(name="tabler:x" :width="16" :height="16")

  Button.trivia-form-add-option-button(
    type="info"
    plain
    round
    size="small"
    native-type="button"
    :disabled="!isActiveAddOptionButton"
    @click="addOption"
  )
    AppIcon.trivia-form-add-option-button__icon(name="tabler:plus" :width="16" :height="16")
    span.trivia-form-add-option-button__text {{ $t('form.creatorModeCompose.qa.answer.answerType.trivia.addOption') }}
</template>

<script>
import { defineComponent, reactive, computed, watch } from '@nuxtjs/composition-api'
import { Form, Field, Button, Notify } from 'vant'

export default defineComponent({
  components: {
    Form,
    Field,
    Button
  },
  props: {
    options: {
      type: Array,
      required: false,
      default: () => []
    },
    correctOptionText: {
      type: String,
      required: false,
      default: ''
    }
  },
  setup(props, { emit }) {
    const form = reactive({
      options:
        props.options && props.options.length > 0
          ? props.options.map(option => ({
              text: (typeof option === 'string' ? option : option && option.text ? option.text : '') || ''
            }))
          : [
              {
                text: ''
              },
              {
                text: ''
              }
            ],
      correctOption: {
        index: null,
        text: ''
      }
    })

    // If correctOptionText is provided, find and set the correct option
    if (props.correctOptionText && props.correctOptionText.trim().length > 0) {
      const correctIndex = form.options.findIndex(option => {
        const optionText = typeof option === 'string' ? option : option && option.text ? option.text : ''

        return optionText === props.correctOptionText
      })

      if (correctIndex !== -1) {
        form.correctOption.index = correctIndex
        form.correctOption.text = props.correctOptionText
      }
    }

    const resetCorrectOption = () => {
      form.correctOption.index = null
      form.correctOption.text = ''
    }

    const addOption = () => {
      form.options.push({
        text: ''
      })

      // Reset correct option when new option is added
      resetCorrectOption()
    }

    const removeOption = index => {
      form.options.splice(index, 1)

      // Reset correct option when option is removed
      resetCorrectOption()
    }

    const selectCorrectOption = (option, index) => {
      // Check if any option has empty text
      const hasEmptyOption = form.options.some(_option => !_option.text || _option.text.trim().length === 0)

      if (hasEmptyOption) {
        Notify({
          message: 'Tüm seçeneklere cevap yaz',
          color: 'var(--color-text-04)',
          background: 'var(--color-danger-01)'
        })

        return
      }

      // If all options have text, set the correct option
      form.correctOption.index = index
      form.correctOption.text = option.text || ''
    }

    const isActiveAddOptionButton = computed(() => {
      return form.options.length < 4
    })

    const isActiveRemoveOptionButton = computed(() => {
      return form.options.length > 2
    })

    const getIsActiveSelectCorrectOptionButton = option => {
      return option.text && option.text.trim().length > 0
    }

    const onFormSubmit = () => {
      emit('on-select-correct-option', form.correctOption)
    }

    watch(
      form.options,
      () => {
        emit('on-set-options', form.options)
        // Reset correct option when any option text changes
        resetCorrectOption()
      },
      { deep: true }
    )

    return {
      form,
      addOption,
      removeOption,
      selectCorrectOption,
      resetCorrectOption,
      isActiveAddOptionButton,
      isActiveRemoveOptionButton,
      getIsActiveSelectCorrectOptionButton,
      onFormSubmit
    }
  }
})
</script>

<style lang="scss" src="./TriviaForm.component.scss"></style>
