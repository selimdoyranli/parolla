<template lang="pug">
Form.community-compose-form(@submit="onSubmit")
  Steps.community-compose-form__steps(v-if="!isEdit" active-color="var(--color-brand-02)" :active="step")
    Step(v-for="key in stepKeys" :key="key") {{ $t(`community.wizard.steps.${key}`) }}

  template(v-if="isEdit || step === 0")
    Step1Foundations(:form="form" :media="media" :community="community" :name-error="nameError" :description-error="descriptionError")
      Step2Categories(:form="form" :tag-input="tagInput" @input-tag="onTagInput" @add-tag="addTag" @remove-tag="removeTag")
  template(v-if="isEdit || step === 1")
    Step3Settings(:form="form")
  template(v-if="!isEdit && step === 2")
    Step4Complete(:form="form" :media="media")

  .community-compose-form__actions
    template(v-if="isEdit")
      Button(color="var(--color-brand-02)" block round native-type="submit" :loading="isBusy" :disabled="!isValid")
        | {{ $t('community.edit.saveButton') }}
    template(v-else)
      Button(v-if="step > 0" plain round native-type="button" :disabled="isBusy" @click="prev") {{ $t('community.wizard.previousButton') }}
      Button(v-if="step < lastStep" color="var(--color-brand-02)" round native-type="button" :disabled="!canGoNext" @click="next")
        | {{ $t('community.wizard.nextButton') }}
      Button(
        v-else
        color="var(--color-brand-02)"
        round
        native-type="button"
        :loading-text="$t('community.wizard.creating')"
        :loading="isBusy"
        @click="submit"
      ) {{ $t('community.wizard.submitButton') }}
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import { Form, Steps, Step, Button } from 'vant'
import Step1Foundations from './partials/Step1Foundations.vue'
import Step2Categories from './partials/Step2Categories.vue'
import Step3Settings from './partials/Step3Settings.vue'
import Step4Complete from './partials/Step4Complete.vue'

export default defineComponent({
  name: 'CommunityComposeForm',
  components: { Form, Steps, Step, Button, Step1Foundations, Step2Categories, Step3Settings, Step4Complete },
  props: {
    mode: { type: String, default: 'create', validator: value => ['create', 'edit'].includes(value) },
    // required in edit mode
    community: { type: Object, default: null }
  },
  setup(props) {
    const isEdit = props.mode === 'edit'
    const stepKeys = ['foundations', 'settings', 'complete']
    const state = useCommunityForm(isEdit ? props.community : null)

    // Enter inside a field must not skip steps: only the last step / edit mode submits
    const onSubmit = () => {
      if (isEdit) state.submit()
    }

    return {
      ...state,
      isEdit,
      onSubmit,
      stepKeys,
      lastStep: stepKeys.length - 1
    }
  }
})
</script>

<style lang="scss" src="./CommunityComposeForm.component.scss"></style>
