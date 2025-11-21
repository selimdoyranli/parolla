<template lang="pug">
Dialog.dialog.media-upload-dialog(
  v-model="state.isOpen"
  :title="title || $t('dialog.mediaUpload.title')"
  :cancel-button-text="cancelButtonText || $t('general.ok')"
  :show-confirm-button="false"
  :show-cancel-button="true"
  :close-on-click-overlay="false"
  @closed="handleClose"
  @opened="$emit('opened')"
)
  Tabs(v-model="activeTab")
    Tab(v-if="activeMediaTypes.includes('file')" name="file" :title="$t('dialog.mediaUpload.tabs.file')")
      .uploader
        Uploader#media-uploader(
          v-model="fileList"
          :style="{ opacity: fileList.length != 0 ? 1 : 0 }"
          :preview-options="{ closeable: true }"
          :accept="uploaderOptions?.accept || parollaConfig.upload.allowedExtensions.map(ext => `.${ext}`).join(',')"
          :multiple="uploaderOptions?.multiple || false"
          :max-count="uploaderOptions?.maxCount || 1"
          :max-size="uploaderOptions?.maxSize || parollaConfig.upload.maxFileSize"
          :before-read="handleBeforeRead"
          @oversize="handleOversize"
        )
        label.uploader-area(for="media-uploader" v-show="fileList.length === 0")
          AppIcon.uploader-area__icon(name="tabler:upload")
          p.uploader-area__description {{ $t('dialog.mediaUpload.uploadArea.description') }}
          small(v-if="uploaderOptions?.maxSize || parollaConfig.upload.maxFileSize")
            | Max: {{ convertSize(uploaderOptions?.maxSize || parollaConfig.upload.maxFileSize, { unit: 'mb' }) }}

    Tab(v-if="activeMediaTypes.includes('youtube')" name="youtube" :title="$t('dialog.mediaUpload.tabs.youtube')")
      .youtube-uploader
        Field.youtube-url-field(
          v-model="youtubeUrl"
          :label="$t('dialog.mediaUpload.youtubeUrl.label')"
          :placeholder="$t('dialog.mediaUpload.youtubeUrl.placeholder')"
          :rules="[{ validator: validateYoutubeUrl, message: $t('dialog.mediaUpload.youtubeUrl.error') }]"
          @blur="handleYoutubeUrlBlur"
        )
        .youtube-preview(v-if="youtubeVideoId && isValidYoutubeUrl")
          iframe.youtube-preview__iframe(:src="getYoutubeEmbedUrl(youtubeVideoId)" frameborder="0" allowfullscreen)
</template>

<script>
import { defineComponent, useContext, ref, reactive, watch } from '@nuxtjs/composition-api'
import parollaConfig from '@/system/parolla.config'
import { Dialog, Uploader, Tabs, Tab, Field, Notify } from 'vant'
import convertSize from 'convert-size'

export default defineComponent({
  components: {
    Dialog: Dialog.Component,
    Uploader,
    Tabs,
    Tab,
    Field
  },
  props: {
    isOpen: {
      type: Boolean,
      required: false,
      default: false
    },
    title: {
      type: String,
      required: false,
      default: null
    },
    cancelButtonText: {
      type: String,
      required: false,
      default: null
    },
    uploaderOptions: {
      type: Object,
      required: false,
      default: null
    },
    activeMediaTypes: {
      type: Array,
      required: false,
      default: () => ['file', 'youtube']
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

        // Reset states when dialog opens
        if (value) {
          fileList.value = []
          youtubeUrl.value = ''
          youtubeVideoId.value = ''
          isValidYoutubeUrl.value = false
          activeTab.value = 'file'
        }
      }
    )

    const fileList = ref([])
    const activeTab = ref('file')
    const youtubeUrl = ref('')
    const youtubeVideoId = ref('')
    const isValidYoutubeUrl = ref(false)

    const extractYoutubeVideoId = url => {
      const patterns = [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&\n?#]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^&\n?#]+)/
      ]

      for (const pattern of patterns) {
        const match = url.match(pattern)

        if (match && match[1]) {
          return match[1]
        }
      }

      return null
    }

    const validateYoutubeUrl = value => {
      if (!value) return false

      const videoId = extractYoutubeVideoId(value)

      return videoId !== null
    }

    const getYoutubeEmbedUrl = videoId => {
      return `https://www.youtube.com/embed/${videoId}`
    }

    const handleYoutubeUrlBlur = () => {
      const videoId = extractYoutubeVideoId(youtubeUrl.value)

      if (videoId) {
        youtubeVideoId.value = videoId
        isValidYoutubeUrl.value = true
      } else {
        youtubeVideoId.value = ''
        isValidYoutubeUrl.value = false
      }
    }

    const handleClose = () => {
      // If YouTube tab is active and valid URL exists, emit YouTube data
      if (activeTab.value === 'youtube' && isValidYoutubeUrl.value && youtubeVideoId.value) {
        const youtubeData = [
          {
            videoId: youtubeVideoId.value,
            url: youtubeUrl.value,
            embedUrl: getYoutubeEmbedUrl(youtubeVideoId.value)
          }
        ]
        emit('closed', youtubeData)
      } else if (activeTab.value === 'file') {
        // Original file upload behavior
        emit('closed', fileList.value)
      } else {
        // No valid media selected
        emit('closed', [])
      }
    }

    const handleBeforeRead = file => {
      if (parollaConfig.upload.allowedMimeTypes) {
        if (!parollaConfig.upload.allowedMimeTypes.includes(file.type)) {
          Notify({
            message: i18n.t('error.mediaError.mimeTypeNotAllowed'),
            color: 'var(--color-text-04)',
            background: 'var(--color-danger-01)',
            duration: 3000
          })

          return false
        }
      }

      if (parollaConfig.upload.allowedExtensions) {
        if (!parollaConfig.upload.allowedExtensions.includes(file.name.split('.').pop())) {
          Notify({
            message: i18n.t('error.mediaError.extensionNotAllowed'),
            color: 'var(--color-text-04)',
            background: 'var(--color-danger-01)',
            duration: 3000
          })

          return false
        }
      }

      return true
    }

    const handleOversize = error => {
      Notify({
        message: i18n.t('error.mediaError.limitExceeded'),
        color: 'var(--color-text-04)',
        background: 'var(--color-danger-01)',
        duration: 3000
      })

      emit('on-oversize', error)
    }

    return {
      parollaConfig,
      convertSize,
      state,
      fileList,
      activeTab,
      youtubeUrl,
      youtubeVideoId,
      isValidYoutubeUrl,
      validateYoutubeUrl,
      getYoutubeEmbedUrl,
      handleYoutubeUrlBlur,
      handleClose,
      handleBeforeRead,
      handleOversize
    }
  }
})
</script>

<style lang="scss" src="./MediaUploadDialog.component.scss"></style>
