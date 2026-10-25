<template lang="pug">
div
  //- step 1: pick an action (one for now)
  Dialog.dialog.gm-moderation-dialog(
    :value="isOpen"
    show-cancel-button
    :show-confirm-button="false"
    :title="$t('gmModeration.title')"
    :cancel-button-text="$t('general.cancel')"
    width="min(92vw, 400px)"
    @input="$emit('update:isOpen', $event)"
  )
    CellGroup.gm-moderation-dialog__options(inset)
      Cell(is-link center :title="actionLabel" @click="openForm")
        template(#icon)
          AppIcon.gm-moderation-dialog__optionIcon(name="tabler:eye-off" :width="20" :height="20")

  //- step 2: note + optional ban, then send
  Dialog.dialog.gm-moderation-dialog(
    v-model="form.isOpen"
    show-cancel-button
    :show-confirm-button="false"
    :title="actionLabel"
    :cancel-button-text="$t('general.cancel')"
    :close-on-click-overlay="!form.isBusy"
    width="min(92vw, 400px)"
  )
    .gm-moderation-dialog__content
      Field.gm-moderation-dialog__note(
        v-model="form.note"
        type="textarea"
        :placeholder="$t('gmModeration.notePlaceholder')"
        rows="3"
        autosize
        maxlength="1000"
        show-word-limit
        :disabled="form.isBusy"
      )
      Cell.gm-moderation-dialog__ban(center :title="$t('gmModeration.banOwner')")
        template(#right-icon)
          VanSwitch(v-model="form.blockOwner" size="22px" :disabled="form.isBusy")
      Button.gm-moderation-dialog__send(type="danger" block round native-type="button" :loading="form.isBusy" @click="send")
        | {{ $t('gmModeration.send') }}
</template>

<script>
import { defineComponent, computed, reactive, useStore, useContext } from '@nuxtjs/composition-api'
import { Dialog, CellGroup, Cell, Field, Switch, Button } from 'vant'
import { showToast } from '@/helpers/toast'

export default defineComponent({
  name: 'GmModerationDialog',
  components: { Dialog: Dialog.Component, CellGroup, Cell, Field, VanSwitch: Switch, Button },
  props: {
    isOpen: { type: Boolean, default: false },
    // 'room': unlist from the public list, 'community': hide from the site
    target: { type: String, required: true, validator: value => ['room', 'community'].includes(value) },
    // room needs documentId + locale, community documentId
    item: { type: Object, required: true }
  },
  emits: ['update:isOpen', 'done'],
  setup(props, { emit }) {
    const store = useStore()
    const { i18n } = useContext()
    const form = reactive({ isOpen: false, note: '', blockOwner: false, isBusy: false })

    const actionLabel = computed(() => i18n.t(props.target === 'room' ? 'gmModeration.unlistRoom' : 'gmModeration.hideCommunity'))

    const openForm = () => {
      emit('update:isOpen', false)
      Object.assign(form, { isOpen: true, note: '', blockOwner: false })
    }

    const send = async () => {
      if (form.isBusy) return

      form.isBusy = true

      const payload = { documentId: props.item.documentId, note: form.note.trim(), blockOwner: form.blockOwner }
      const { error } =
        props.target === 'room'
          ? await store.dispatch('gm/unlistRoom', { ...payload, locale: props.item.locale })
          : await store.dispatch('community/gmHideCommunity', payload)

      form.isBusy = false

      if (error) {
        showToast.fail(error.message || i18n.t('error.anErrorOccurred'))

        return
      }

      form.isOpen = false
      showToast.success(i18n.t(props.target === 'room' ? 'gmModeration.unlistedDone' : 'gmModeration.hiddenDone'))
      emit('done')
    }

    return { form, actionLabel, openForm, send }
  }
})
</script>

<style lang="scss" src="./GmModerationDialog.component.scss"></style>
