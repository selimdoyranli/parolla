<template lang="pug">
Dialog.dialog.community-delete-dialog(
  :value="isOpen"
  :title="$t('community.delete.title')"
  :show-confirm-button="false"
  :show-cancel-button="false"
  :close-on-click-overlay="!isBusy"
  @input="$emit('update:isOpen', $event)"
  @closed="confirmation = ''"
)
  .community-delete-dialog__content
    p.community-delete-dialog__warning {{ $t('community.delete.warning') }}
    Field(v-model="confirmation" :label="$t('community.delete.confirmInput')" :placeholder="community.name" :disabled="isBusy")
    .community-delete-dialog__actions
      Button(plain round native-type="button" :disabled="isBusy" @click="$emit('update:isOpen', false)")
        | {{ $t('community.delete.cancelButton') }}
      Button(type="danger" round native-type="button" :loading="isBusy" :disabled="confirmation !== community.name" @click="handleDelete")
        | {{ $t('community.delete.confirmButton') }}
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
