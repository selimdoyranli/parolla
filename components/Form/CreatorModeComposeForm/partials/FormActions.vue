<template lang="pug">
.d-flex.align-items-center.mt-base
  // Save draft button
  Button.creator-mode-compose-form__saveDraftButton(
    v-if="isVisibleSaveDraftButton"
    plain
    native-type="button"
    round
    size="small"
    @click="$emit('save-draft')"
  )
    | {{ $t('form.creatorModeCompose.saveDraft.action') }}

  // Submit button
  Button.compose-qa-list__submitButton(
    v-if="qaListLength > 0"
    type="primary"
    icon="success"
    native-type="submit"
    round
    :loading="isBusy"
    :disabled="isBusy"
  )
    template(v-if="isRoomExists") {{ $t('form.creatorModeEdit.submit') }}
    template(v-else) {{ $t('form.creatorModeCompose.submit') }}
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import { Button } from 'vant'

export default defineComponent({
  name: 'FormActions',
  components: {
    Button
  },
  props: {
    isVisibleSaveDraftButton: {
      type: Boolean,
      default: false
    },
    qaListLength: {
      type: Number,
      default: 0
    },
    isBusy: {
      type: Boolean,
      default: false
    },
    isRoomExists: {
      type: Boolean,
      default: false
    }
  }
})
</script>
