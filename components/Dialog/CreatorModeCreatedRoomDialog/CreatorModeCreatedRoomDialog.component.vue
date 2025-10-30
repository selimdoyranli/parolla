<template lang="pug">
Dialog.dialog.creator-mode-created-room-dialog(
  v-model="state.isOpen"
  :title="$t('dialog.createdRoom.title')"
  :confirm-button-text="confirmButtonText || $t('general.ok')"
  :cancel-button-text="cancelButtonText || $t('general.close')"
  :show-confirm-button="true"
  :show-cancel-button="true"
  :close-on-click-overlay="false"
  @closed="$emit('closed')"
  @opened="$emit('opened')"
  @cancel="$emit('onCancel')"
  @confirm="$emit('onConfirm')"
)
  h4.creator-mode-created-room-dialog__roomTitle {{ room.title }}

  template(v-if="room.isListed")
    p(v-html="$t('dialog.createdRoom.isListedMessage', { isListed: $t('dialog.createdRoom.public') })")
  template(v-else)
    p(v-html="$t('dialog.createdRoom.isListedMessage', { isListed: $t('dialog.createdRoom.private') })")

  Field.creator-mode-created-room-dialog__roomIdField(
    :value="`${APP_URL}${localePath({ name: 'CreatorMode-CreatorModeRoom-slug', params: { slug: room.id } })}`"
    disabled
  )
    template(#left-icon)
      AppIcon(name="tabler:link" color="var(--color-icon-01)")
    template(#button)
      Button(type="info" size="small" native-type="button" round @click="copyRoomUrl") {{ $t('clipboard.copy') }}

  // Ad
  AppAd.my-base.pt-base(:data-ad-slot="9964323575")
</template>

<script>
import { defineComponent, useContext, reactive, watch } from '@nuxtjs/composition-api'
import { APP_URL } from '@/system/constant'
import { Dialog, Field, Button, Toast } from 'vant'

export default defineComponent({
  components: {
    Dialog: Dialog.Component,
    Field,
    Button
  },
  props: {
    isOpen: {
      type: Boolean,
      required: false,
      default: false
    },
    confirmButtonText: {
      type: String,
      required: false,
      default: null
    },
    cancelButtonText: {
      type: String,
      required: false,
      default: null
    },
    room: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const { localePath, i18n } = useContext()

    const state = reactive({
      isOpen: props.isOpen
    })

    watch(
      () => props.isOpen,
      value => {
        state.isOpen = value
      }
    )

    const copyRoomUrl = async () => {
      const url = `${APP_URL}${localePath({ name: 'CreatorMode-CreatorModeRoom-slug', params: { slug: props.room.id } })}`
      window.postMessage({ type: 'sharer', data: url })

      try {
        await navigator.clipboard.writeText(url)
        await Toast({
          message: i18n.t('dialog.createdRoom.copyUrl.callback.success'),
          position: 'bottom'
        })
        await navigator.share({
          title: 'parolla',
          text: url
        })
      } catch {
        await navigator.clipboard.writeText(url)
        await Toast({
          message: i18n.t('dialog.createdRoom.copyUrl.callback.success'),
          position: 'bottom'
        })
      }
    }

    return {
      APP_URL,
      state,
      copyRoomUrl
    }
  }
})
</script>

<style lang="scss" src="./CreatorModeCreatedRoomDialog.component.scss"></style>
