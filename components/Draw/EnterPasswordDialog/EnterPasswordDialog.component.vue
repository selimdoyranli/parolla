<template lang="pug">
Dialog.enter-password-dialog(
  v-model="visible"
  :show-confirm-button="false"
  :show-cancel-button="false"
  :close-on-click-overlay="false"
  @closed="$emit('close')"
)
  .enter-password-dialog__inner
    header.enter-password-dialog__head
      AppIcon.enter-password-dialog__icon(name="tabler:lock" :width="22" :height="22")
      h3.enter-password-dialog__title {{ $t('dialog.enterPassword.title') }}
      p.enter-password-dialog__hint {{ $t('dialog.enterPassword.hint') }}

    Field.enter-password-dialog__field(
      v-model="password"
      type="password"
      :placeholder="$t('dialog.enterPassword.placeholder')"
      :maxlength="32"
      :error="!!errorKey"
      @keyup.enter.native="onSubmit"
    )
    .enter-password-dialog__error(v-if="errorKey") {{ $t(errorKey) }}

    .enter-password-dialog__actions
      Button.enter-password-dialog__cancel(plain block round @click="onCancel") {{ $t('dialog.enterPassword.cancel') }}
      Button(type="primary" block round :disabled="!password.trim()" @click="onSubmit") {{ $t('dialog.enterPassword.confirm') }}
</template>

<script>
import { defineComponent, ref, watch } from '@nuxtjs/composition-api'
import { Dialog, Field, Button } from 'vant'

export default defineComponent({
  components: {
    Dialog: Dialog.Component,
    Field,
    Button
  },
  props: {
    // Parent-owned error key (e.g. 'dialog.enterPassword.wrongPassword').
    // Lets the parent re-open the dialog after a bad-password ACK and show
    // the error inline rather than swallowing it as a generic toast.
    errorKey: { type: String, default: null }
  },
  emits: ['close', 'submit'],
  setup(props, { emit }) {
    const visible = ref(true)
    const password = ref('')

    // Clear the password whenever a new error lands so the user starts
    // fresh on each retry (no stale value left in the masked field).
    watch(
      () => props.errorKey,
      v => {
        if (v) password.value = ''
      }
    )

    const onSubmit = () => {
      const v = password.value.trim()

      if (!v) return
      emit('submit', v)
    }

    const onCancel = () => {
      visible.value = false
    }

    return { visible, password, onSubmit, onCancel }
  }
})
</script>

<style src="./EnterPasswordDialog.component.scss" lang="scss" scoped />
