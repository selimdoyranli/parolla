<template lang="pug">
Dialog.dialog.report-dialog(
  v-model="state.isOpen"
  :title="$t('dialog.report.title')"
  :show-confirm-button="false"
  :show-cancel-button="!mediaUploading.isUploading"
  :cancel-button-text="$t('general.close')"
  :close-on-click-overlay="false"
  :close-on-popstate="!mediaUploading.isUploading"
  @closed="handleClose"
  @opened="$emit('opened')"
)
  .report-dialog-form
    Field.report-dialog-form__scope(
      v-model="form.scope"
      :label="$t('dialog.report.scope.label')"
      :placeholder="$t('dialog.report.scope.placeholder')"
      v-show="false"
      readonly
    )

    .report-dialog-form-reported-user(v-if="reportedUser")
      label.report-dialog-form-reported-user__label {{ $t('dialog.report.reportedUser.label') }}
      .report-dialog-form-reported-user__content
        PlayerAvatar.report-dialog-form-reported-user__player(
          with-username
          :user="{ id: reportedUser.id, username: reportedUser.username, diceBear: reportedUser.diceBear }"
        )

    .report-dialog-form-reported-message(v-if="reportedMessage")
      label.report-dialog-form-reported-message__label {{ $t('dialog.report.reportedMessage.label') }}
      .report-dialog-form-reported-message__content
        PlayerAvatar.report-dialog-form-reported-message__player(
          with-username
          :size="20"
          :user="{ id: reportedMessage.playerId, username: reportedMessage.playerName, diceBear: reportedMessage.diceBear }"
        )
        span.report-dialog-form-reported-message__text {{ reportedMessage.message }}
        small.report-dialog-form-reported-message__time {{ isoToHumanDate(reportedMessage.timestamp) }}

    Field.report-dialog-form__detail(
      v-model="form.detail"
      type="textarea"
      :label="$t('dialog.report.detail.label')"
      :placeholder="$t('dialog.report.detail.placeholder')"
      maxlength="500"
      show-word-limit
      rows="3"
      autosize
      autofocus
    )

    .report-dialog-form-media
      label.report-dialog-form-media__label {{ $t('dialog.report.media.label') }}
      .report-dialog-form-media__uploader
        Uploader(
          v-model="selectedFiles"
          :multiple="true"
          :max-count="4"
          :max-size="parollaConfig.upload.maxFileSize"
          :accept="parollaConfig.upload.allowedExtensions.map(ext => `.${ext}`).join(',')"
          :before-read="handleBeforeRead"
          :preview-size="80"
          @oversize="handleOversize"
        )
      small.report-dialog-form-media__hint
        | Max 4 {{ $t('dialog.report.media.hint') }}
        | ({{ convertSize(parollaConfig.upload.maxFileSize, { unit: 'mb' }) }})
        | {{ parollaConfig.upload.allowedExtensions.map(ext => `.${ext}`).join(', ') }}

    Field.report-dialog-form__additional(
      v-if="additional"
      v-model="form.additional"
      type="textarea"
      :label="$t('dialog.report.additional.label')"
      v-show="false"
      readonly
      rows="2"
      autosize
    )

  .report-dialog-actions
    Button.report-dialog-actions__submit(
      type="primary"
      block
      :loading-text="mediaUploadingText"
      :loading="submitting"
      :disabled="!form.detail"
      @click="handleSubmit"
    )
      | {{ $t('dialog.report.submit') }}
</template>

<script>
import { defineComponent, useStore, useContext, ref, reactive, computed, watch } from '@nuxtjs/composition-api'
import { Dialog, Field, Button, Uploader, Notify } from 'vant'
import { reportTypeEnum } from '@/enums/report-type.enum'
import parollaConfig from '@/system/parolla.config'
import convertSize from 'convert-size'

export default defineComponent({
  components: {
    Dialog: Dialog.Component,
    Field,
    Button,
    Uploader
  },
  props: {
    isOpen: {
      type: Boolean,
      required: false,
      default: false
    },
    scope: {
      type: String,
      required: false,
      default: reportTypeEnum.PROFILE
    },
    additional: {
      type: String,
      required: false,
      default: null
    }
  },
  setup(props, { emit }) {
    const store = useStore()
    const { i18n } = useContext()
    const { isoToHumanDate } = useFormatter()

    const state = reactive({
      isOpen: props.isOpen
    })

    const form = reactive({
      scope: props.scope,
      detail: '',
      additional: props.additional || ''
    })

    const selectedFiles = ref([])
    const submitting = ref(false)

    const mediaUploading = reactive({
      isUploading: false,
      totalCount: 0,
      uploadedCount: 0,
      currentFile: null
    })

    const mediaUploadingText = computed(() => {
      if (!mediaUploading.isUploading) return ''

      return `${i18n.t('dialog.report.media.uploading')} (${mediaUploading.uploadedCount}/${mediaUploading.totalCount})`
    })

    const reportedUser = computed(() => {
      if (props.scope !== reportTypeEnum.PROFILE || !props.additional) return null

      try {
        const parsed = JSON.parse(props.additional)

        return parsed.reportedUser || null
      } catch {
        return null
      }
    })

    const reportedMessage = computed(() => {
      const isMessageScope = props.scope === reportTypeEnum.CHAT || props.scope === reportTypeEnum.DRAW_CHAT

      if (!isMessageScope || !props.additional) return null

      try {
        const parsed = JSON.parse(props.additional)

        return parsed.reportedMessage || null
      } catch {
        return null
      }
    })

    watch(
      () => props.isOpen,
      value => {
        state.isOpen = value

        if (value) {
          form.scope = props.scope
          form.detail = ''
          form.additional = props.additional || ''
          selectedFiles.value = []
        }
      }
    )

    watch(
      () => props.additional,
      value => {
        form.additional = value || ''
      }
    )

    const getFileExtension = filename => {
      return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase()
    }

    const handleBeforeRead = file => {
      const files = Array.isArray(file) ? file : [file]
      const validFiles = []

      for (const f of files) {
        let error = null

        if (!parollaConfig.upload.allowedMimeTypes.includes(f.type)) {
          error = i18n.t('error.mediaError.mimeTypeNotAllowed')
        }

        if (!error) {
          const extension = getFileExtension(f.name)

          if (!parollaConfig.upload.allowedExtensions.includes(extension)) {
            error = i18n.t('error.mediaError.extensionNotAllowed')
          }
        }

        if (error) {
          Notify({ message: `${f.name} - ${error}`, type: 'warning', duration: 3000 })
        } else {
          validFiles.push(f)
        }
      }

      return Array.isArray(file) ? validFiles : validFiles.length > 0
    }

    const handleOversize = file => {
      const files = Array.isArray(file) ? file : [file]

      files.forEach(f => {
        Notify({
          message: `${f.file ? f.file.name : f.name} - ${i18n.t('error.mediaError.limitExceeded')}`,
          type: 'warning',
          duration: 3000
        })
      })
    }

    const sanitizeAdditional = value => {
      try {
        const parsed = JSON.parse(value)

        if (parsed.reportedUser) {
          const { diceBear, ...rest } = parsed.reportedUser

          parsed.reportedUser = rest
        }

        if (parsed.reportedMessage) {
          const { diceBear, ...rest } = parsed.reportedMessage

          parsed.reportedMessage = rest
        }

        return JSON.stringify(parsed)
      } catch {
        return value
      }
    }

    const resetMediaUploading = () => {
      mediaUploading.isUploading = false
      mediaUploading.totalCount = 0
      mediaUploading.uploadedCount = 0
      mediaUploading.currentFile = null
    }

    const handleSubmit = async () => {
      if (!form.detail) return

      submitting.value = true

      try {
        const { data, error } = await store.dispatch('app/report', {
          scope: form.scope,
          detail: form.detail,
          additional: form.additional ? sanitizeAdditional(form.additional) : null
        })

        if (error) {
          Notify({
            message: i18n.t('dialog.report.callback.error'),
            color: 'var(--color-text-04)',
            background: 'var(--color-danger-01)',
            duration: 3000
          })
        } else {
          // Upload media files if report created successfully and files exist
          if (data && selectedFiles.value.length > 0) {
            const reportId = data.data.id

            mediaUploading.isUploading = true
            mediaUploading.totalCount = selectedFiles.value.length
            mediaUploading.uploadedCount = 0

            try {
              for (const fileItem of selectedFiles.value) {
                mediaUploading.currentFile = fileItem.file

                const { error: uploadError } = await store.dispatch('app/uploadReportMedia', {
                  file: fileItem.file,
                  path: 'reports',
                  ref: 'api::report.report',
                  refId: reportId,
                  field: 'media'
                })

                if (uploadError) throw uploadError

                mediaUploading.uploadedCount++
              }
            } catch (uploadErr) {
              Notify({
                message: i18n.t('dialog.report.callback.error'),
                color: 'var(--color-text-04)',
                background: 'var(--color-danger-01)',
                duration: 3000
              })
              resetMediaUploading()
              submitting.value = false

              return
            }

            resetMediaUploading()
          }

          Notify({
            message: i18n.t('dialog.report.callback.success'),
            color: 'var(--color-text-04)',
            background: 'var(--color-success-01)',
            duration: 3000
          })

          state.isOpen = false
          emit('closed')
        }
      } catch (err) {
        Notify({
          message: i18n.t('dialog.report.callback.error'),
          color: 'var(--color-text-04)',
          background: 'var(--color-danger-01)',
          duration: 3000
        })
      } finally {
        resetMediaUploading()
        submitting.value = false
      }
    }

    const handleClose = () => {
      emit('closed')
    }

    return {
      parollaConfig,
      convertSize,
      state,
      form,
      selectedFiles,
      submitting,
      mediaUploading,
      mediaUploadingText,
      reportedUser,
      reportedMessage,
      isoToHumanDate,
      handleBeforeRead,
      handleOversize,
      handleSubmit,
      handleClose
    }
  }
})
</script>

<style lang="scss" src="./ReportDialog.component.scss"></style>
