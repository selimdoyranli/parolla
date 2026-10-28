<template lang="pug">
Dialog.dialog.credits-dialog(
  v-model="state.isOpen"
  :title="$t('dialog.credits.title')"
  :cancel-button-text="cancelButtonText || $t('general.close')"
  :show-confirm-button="false"
  :show-cancel-button="true"
  :close-on-click-overlay="false"
  @closed="$emit('closed')"
  @opened="$emit('opened')"
)
  p.credits-dialog__kozmos(v-html="$t('dialog.credits.description')")
  DonateContent
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

<style lang="scss" src="./CreditsDialog.component.scss"></style>
