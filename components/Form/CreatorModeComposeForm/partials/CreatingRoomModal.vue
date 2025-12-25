<template lang="pug">
Dialog.creating-room-modal(
  v-model="state.isOpen"
  :show-confirm-button="false"
  :show-cancel-button="false"
  :close-on-click-overlay="false"
  :closeable="false"
)
  .creating-room-modal__content
    //- Main loading section
    .creating-room-modal__loader
      Loading.creating-room-modal__spinner(type="spinner" size="32")
      p.creating-room-modal__message {{ message }}

    //- Media upload progress section
    .creating-room-modal__media-progress(v-if="totalMediaCount > 0")
      .creating-room-modal__progress-info
        span.creating-room-modal__progress-label {{ $t('form.creatorModeCompose.uploadingMedia') }}
        span.creating-room-modal__progress-count {{ uploadedMediaCount }}/{{ totalMediaCount }}

      //- Current uploading media thumbnail
      .creating-room-modal__current-media(v-if="currentUploadingMedia")
        .creating-room-modal__thumbnail-wrapper
          img.creating-room-modal__thumbnail(
            v-if="currentMediaUrl"
            :src="currentMediaUrl"
            :alt="$t('form.creatorModeCompose.uploadingMedia')"
          )
          .creating-room-modal__thumbnail-overlay
            Loading.creating-room-modal__thumbnail-spinner(type="spinner" color="#fff" size="20")
</template>

<script>
import { defineComponent, reactive, computed, watch, useContext } from '@nuxtjs/composition-api'
import { Dialog, Loading } from 'vant'

export default defineComponent({
  name: 'CreatingRoomModal',
  components: {
    Dialog: Dialog.Component,
    Loading
  },
  props: {
    isOpen: {
      type: Boolean,
      required: false,
      default: false
    },
    isUpdating: {
      type: Boolean,
      required: false,
      default: false
    },
    totalMediaCount: {
      type: Number,
      required: false,
      default: 0
    },
    uploadedMediaCount: {
      type: Number,
      required: false,
      default: 0
    },
    currentUploadingMedia: {
      type: Object,
      required: false,
      default: null
    }
  },
  setup(props, { emit }) {
    const { i18n } = useContext()

    const state = reactive({
      isOpen: props.isOpen
    })

    watch(
      () => props.isOpen,
      value => {
        state.isOpen = value
      }
    )

    watch(
      () => state.isOpen,
      value => {
        if (!value) {
          emit('closed')
        }
      }
    )

    const message = computed(() => {
      return props.isUpdating ? i18n.t('form.creatorModeCompose.updatingQuiz') : i18n.t('form.creatorModeCompose.creatingQuiz')
    })

    const currentMediaUrl = computed(() => {
      if (!props.currentUploadingMedia) return null

      // If it's a File object, create object URL
      if (props.currentUploadingMedia.file && typeof URL !== 'undefined') {
        try {
          return URL.createObjectURL(props.currentUploadingMedia.file)
        } catch {
          return null
        }
      }

      // If it has a url property
      if (props.currentUploadingMedia.url) {
        return props.currentUploadingMedia.url
      }

      return null
    })

    return {
      state,
      message,
      currentMediaUrl
    }
  }
})
</script>

<style lang="scss" src="./CreatingRoomModal.scss"></style>
