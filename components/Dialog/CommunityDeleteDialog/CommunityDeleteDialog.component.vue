<template lang="pug">
Dialog.dialog.community-delete-dialog(
  :value="isOpen"
  show-cancel-button
  :title="$t('community.delete.title')"
  :show-confirm-button="false"
  :cancel-button-text="$t('general.cancel')"
  :close-on-click-overlay="!isBusy"
  width="min(92vw, 440px)"
  @input="$emit('update:isOpen', $event)"
  @closed="confirmation = ''"
)
  .community-delete-dialog__content
    p.community-delete-dialog__warning {{ $t('community.delete.warning') }}
    label.community-delete-dialog__label(for="community-delete-confirmation") {{ $t('community.delete.confirmInput') }}
    Field#community-delete-confirmation.community-delete-dialog__input(
      v-model="confirmation"
      :placeholder="community.name"
      autocomplete="off"
      :disabled="isBusy"
    )
    Button.community-delete-dialog__deleteButton(
      type="danger"
      icon="delete-o"
      block
      round
      native-type="button"
      :loading="isBusy"
      :disabled="confirmation !== community.name"
      @click="handleDelete"
    ) {{ $t('community.delete.confirmButton') }}
</template>

<script>
import { defineComponent, ref, useStore, useRouter, useContext } from '@nuxtjs/composition-api'
import { Dialog, Field, Button, Notify } from 'vant'

export default defineComponent({
  name: 'CommunityDeleteDialog',
  components: { Dialog: Dialog.Component, Field, Button },
  props: {
    isOpen: { type: Boolean, default: false },
    community: { type: Object, required: true }
  },
  setup(props) {
    const store = useStore()
    const router = useRouter()
    const { i18n, localePath } = useContext()
    const confirmation = ref('')
    const isBusy = ref(false)

    const handleDelete = async () => {
      if (isBusy.value || confirmation.value !== props.community.name) return

      isBusy.value = true

      const { error } = await store.dispatch('community/deleteCommunity', { documentId: props.community.documentId })

      isBusy.value = false

      if (error) {
        Notify({ message: error.message || i18n.t('community.error.generic'), type: 'danger' })

        return
      }

      Notify({ message: i18n.t('community.success.deleted'), type: 'success' })
      router.push(localePath({ name: 'Community-CommunityList' }))
    }

    return { confirmation, isBusy, handleDelete }
  }
})
</script>

<style lang="scss" src="./CommunityDeleteDialog.component.scss"></style>
