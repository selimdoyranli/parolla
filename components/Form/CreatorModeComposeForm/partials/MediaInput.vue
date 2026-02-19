<template lang="pug">
.media-input
  // Upload Area
  .uploader(v-if="inputType === 'file' && !media")
    Uploader#media-input-uploader(
      v-model="fileList"
      :multiple="multiple"
      :max-count="multiple ? maxCount : 1"
      :max-size="parollaConfig.upload.maxFileSize"
      :accept="parollaConfig.upload.allowedExtensions.map(ext => `.${ext}`).join(',')"
      :before-read="handleBeforeRead"
      :after-read="onFileRead"
      :style="{ opacity: 0 }"
      @oversize="handleOversize"
    )
    label.uploader-area(for="media-input-uploader")
      AppIcon.uploader-area__icon(name="tabler:upload")
      p.uploader-area__description {{ $t('dialog.mediaUpload.uploadArea.description') }}
      small
        | Max: {{ convertSize(parollaConfig.upload.maxFileSize, { unit: 'mb' }) }}

  // YouTube URL Input
  .youtube-uploader(v-if="inputType === 'youtube' && !media")
    Field.youtube-url-field(
      v-model="youtubeUrl"
      :label="$t('dialog.mediaUpload.youtubeUrl.label')"
      :placeholder="$t('dialog.mediaUpload.youtubeUrl.placeholder')"
      :rules="[{ validator: validateYoutubeUrl, message: $t('dialog.mediaUpload.youtubeUrl.error') }]"
      @blur="handleYoutubeUrlBlur"
    )

  // Preview Area
  .media-thumbnail(v-if="media")
    // Image Preview
    img.media-thumbnail__image(v-if="!isYoutube(media)" :src="getMediaSrc(media)" :alt="getMediaAlt(media)")

    // YouTube Preview
    .youtube-preview(v-else)
      iframe.youtube-preview__iframe(
        v-if="getYoutubeEmbedUrl(media.url)"
        :src="getYoutubeEmbedUrl(media.url)"
        frameborder="0"
        allowfullscreen
      )
      .youtube-preview__placeholder(v-else)
        AppIcon(name="tabler:brand-youtube" size="40")
        span.youtube-url {{ media.url }}

    Button.media-thumbnail__delete(type="danger" size="small" round @click="removeMedia")
      AppIcon(name="tabler:x" :width="14" :height="14")

    Cell.creator-mode-compose-form-media-note
      small.creator-mode-compose-form-media-note__description
        | {{ $t('form.creatorModeCompose.qa.question.mediaNote.description') }}
      Field.creator-mode-compose-form-media-note-field(
        name="mediaNote"
        :value="mediaNote"
        :placeholder="$t('form.creatorModeCompose.qa.question.mediaNote.placeholder')"
        maxlength="64"
        show-word-limit
        @input="$emit('update:mediaNote', $event)"
      )
</template>

<script>
import { defineComponent, ref, useContext, watch } from '@nuxtjs/composition-api'
import { Field, Button, Cell, Uploader, Notify } from 'vant'
import parollaConfig from '@/system/parolla.config'
import convertSize from 'convert-size'

export default defineComponent({
  name: 'MediaInput',
  components: {
    Field,
    Button,
    Cell,
    Uploader
  },
  props: {
    media: {
      type: Object,
      default: null
    },
    mediaNote: {
      type: String,
      default: ''
    },
    inputType: {
      type: String,
      required: true,
      validator: value => ['file', 'youtube'].includes(value)
    },
    multiple: {
      type: Boolean,
      default: false
    },
    maxCount: {
      type: Number,
      default: 256
    },
    getMediaSrc: {
      type: Function,
      required: true
    },
    getMediaAlt: {
      type: Function,
      required: true
    }
  },
  setup(props, { emit }) {
    const { i18n } = useContext()

    const fileList = ref([])
    const youtubeUrl = ref('')

    // Helper to get file extension
    const getFileExtension = filename => {
      return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase()
    }

    watch(
      () => props.media,
      newMedia => {
        if (!newMedia) {
          youtubeUrl.value = ''
          fileList.value = []
        } else if (newMedia.url && (newMedia.url.includes('youtube') || newMedia.url.includes('youtu.be'))) {
          youtubeUrl.value = newMedia.url
        }
      },
      { immediate: true }
    )

    const removeMedia = () => {
      emit('remove')
      youtubeUrl.value = ''
      fileList.value = []
    }

    const isYoutube = media => {
      return media && media.url && (media.url.includes('youtube') || media.url.includes('youtu.be'))
    }

    const extractYoutubeVideoId = url => {
      if (!url) return null
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

    const getYoutubeEmbedUrl = url => {
      const videoId = extractYoutubeVideoId(url)

      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }

    const validateYoutubeUrl = value => {
      if (!value) return false
      const videoId = extractYoutubeVideoId(value)

      return videoId !== null
    }

    const handleYoutubeUrlBlur = () => {
      if (validateYoutubeUrl(youtubeUrl.value)) {
        const videoId = extractYoutubeVideoId(youtubeUrl.value)
        emit('update:media', {
          url: youtubeUrl.value,
          videoId,
          isYoutube: true
        })
      }
    }

    const handleBeforeRead = file => {
      let files = Array.isArray(file) ? file : [file]
      const validFiles = []

      for (const f of files) {
        let error = null

        // Mime Type Check
        if (parollaConfig.upload.allowedMimeTypes) {
          if (!parollaConfig.upload.allowedMimeTypes.includes(f.type)) {
            error = i18n.t('error.mediaError.mimeTypeNotAllowed')
          }
        }

        // Extension Check
        if (!error && parollaConfig.upload.allowedExtensions) {
          const extension = getFileExtension(f.name)

          if (!parollaConfig.upload.allowedExtensions.includes(extension)) {
            error = i18n.t('error.mediaError.extensionNotAllowed')
          }
        }

        if (error) {
          Notify({
            message: `${f.name} - ${error}`,
            type: 'warning',
            duration: 3000
          })
        } else {
          validFiles.push(f)
        }
      }

      if (Array.isArray(file)) {
        return validFiles
      }

      return validFiles.length > 0
    }

    const handleOversize = file => {
      const files = Array.isArray(file) ? file : [file]

      files.forEach(f => {
        Notify({
          message: `${f.name} - ${i18n.t('error.mediaError.limitExceeded')}`,
          type: 'warning',
          duration: 3000
        })
      })
    }

    const onFileRead = file => {
      if (Array.isArray(file)) {
        emit('files-selected', file)
      } else {
        if (props.multiple) {
          emit('files-selected', [file])
        } else {
          const mediaData = {
            file: file.file,
            url: file.content
          }
          emit('update:media', mediaData, file.file)
        }
      }
    }

    return {
      parollaConfig,
      convertSize,
      fileList,
      youtubeUrl,
      removeMedia,
      isYoutube,
      getYoutubeEmbedUrl,
      validateYoutubeUrl,
      handleYoutubeUrlBlur,
      handleBeforeRead,
      handleOversize,
      onFileRead
    }
  }
})
</script>

<style lang="scss" src="./MediaInput.scss"></style>
