<template lang="pug">
Dialog.dialog.profile-photo-editor-dialog(
  :value="isOpenProfilePhotoEditorDialog"
  :title="$t('dialog.profilePhotoEditor.title')"
  :cancel-button-text="$t('general.cancel')"
  :confirm-button-text="$t('general.apply')"
  :show-confirm-button="hasFile"
  :show-cancel-button="true"
  :close-on-click-overlay="false"
  @closed="onClosed"
  @confirm="handleConfirm"
  @cancel="handleCancel"
)
  .profile-photo-editor-content
    template(v-if="!hasFile")
      .file-picker
        input(
          ref="fileInputRef"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          style="display: none"
          @change="handleFileChange"
        )
        Button(type="primary" icon="photograph" plain round native-type="button" @click="triggerFilePicker")
          | {{ $t('dialog.profilePhotoEditor.selectFile') }}
        .file-picker__hint {{ $t('dialog.profilePhotoEditor.hint') }}

    template(v-else)
      .cropper-wrapper
        Cropper.cropper(ref="cropperRef" :src="objectUrl" image-restriction="stencil" :stencil-props="{ aspectRatio: 1 }")
      .cropper-actions
        Button(size="small" plain round native-type="button" @click="resetFile") {{ $t('dialog.profilePhotoEditor.change') }}
</template>

<script>
import { defineComponent, ref, computed, useStore, useContext } from '@nuxtjs/composition-api'
import { Dialog, Button, Notify } from 'vant'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import parollaConfig from '@/system/parolla.config'

const OUTPUT_SIZE = 512

export default defineComponent({
  components: {
    Dialog: Dialog.Component,
    Button,
    Cropper
  },
  emits: ['on-confirm', 'on-cancel'],
  setup(_, { emit }) {
    const store = useStore()
    const { i18n } = useContext()

    const fileInputRef = ref(null)
    const cropperRef = ref(null)
    const selectedFile = ref(null)
    const objectUrl = ref(null)

    const isOpenProfilePhotoEditorDialog = computed(() => store.getters['profile/isOpenProfilePhotoEditorDialog'])
    const hasFile = computed(() => !!objectUrl.value)

    const notifyError = message => {
      Notify({
        message,
        color: 'var(--color-text-04)',
        background: 'var(--color-danger-01)',
        duration: 3000
      })
    }

    const triggerFilePicker = () => {
      fileInputRef.value?.click()
    }

    const handleFileChange = event => {
      const file = event.target.files?.[0]

      if (!file) return

      const { maxFileSize, allowedMimeTypes } = parollaConfig.upload

      if (!allowedMimeTypes.includes(file.type)) {
        notifyError(i18n.t('dialog.profilePhotoEditor.error.mimeTypeNotAllowed'))
        event.target.value = ''

        return
      }

      if (file.size > maxFileSize) {
        notifyError(i18n.t('dialog.profilePhotoEditor.error.sizeLimitExceeded'))
        event.target.value = ''

        return
      }

      if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)

      selectedFile.value = file
      objectUrl.value = URL.createObjectURL(file)
    }

    const resetFile = () => {
      if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
      objectUrl.value = null
      selectedFile.value = null

      if (fileInputRef.value) fileInputRef.value.value = ''
    }

    const closeDialog = () => {
      store.commit('profile/SET_PROFILE_PHOTO_EDITOR_DIALOG_IS_OPEN', false)
    }

    const handleConfirm = () => {
      if (!cropperRef.value) return
      const { canvas } = cropperRef.value.getResult()

      if (!canvas) return

      const out = document.createElement('canvas')
      out.width = OUTPUT_SIZE
      out.height = OUTPUT_SIZE
      out.getContext('2d').drawImage(canvas, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

      out.toBlob(
        blob => {
          if (!blob) {
            notifyError(i18n.t('dialog.profilePhotoEditor.error.cropFailed'))

            return
          }
          emit('on-confirm', blob)
          closeDialog()
        },
        'image/jpeg',
        0.9
      )
    }

    const handleCancel = () => {
      emit('on-cancel')
      closeDialog()
    }

    const onClosed = () => {
      resetFile()
    }

    return {
      fileInputRef,
      cropperRef,
      objectUrl,
      hasFile,
      isOpenProfilePhotoEditorDialog,
      triggerFilePicker,
      handleFileChange,
      resetFile,
      handleConfirm,
      handleCancel,
      onClosed
    }
  }
})
</script>

<style lang="scss" src="./ProfilePhotoEditorDialog.component.scss"></style>
