<template lang="pug">
Dialog.dialog.add-choices-dialog(
  v-model="state.isOpen"
  :title="$t('dialog.addChoices.title')"
  :show-confirm-button="true"
  :show-cancel-button="true"
  :confirm-button-text="$t('general.ok')"
  :cancel-button-text="$t('general.cancel')"
  :before-close="handleBeforeClose"
  @confirm="handleConfirm"
  @closed="handleClosed"
)
  Tabs.add-choices-dialog__tabs(v-model="state.activeTab")
    // Photo Tab
    Tab(name="photo" :title="$t('dialog.addChoices.tab.photo')")
      .add-choices-dialog__tab-content
        Cell(center :title="$t('dialog.addChoices.useFilenameAsMediaNote')")
          template(#right-icon)
            SwitchInput(v-model="state.useFilenameAsMediaNote" size="24px")

        MediaInput(
          :key="state.mediaInputKey"
          inputType="file"
          :multiple="true"
          :max-count="256"
          :media="null"
          :get-media-src="getMediaSrc"
          :get-media-alt="getMediaAlt"
          @files-selected="handleFilesSelected"
        )

    // Youtube Tab
    Tab(name="youtube" :title="$t('dialog.addChoices.tab.youtube')")
      .add-choices-dialog__tab-content
        textarea.add-choices-dialog__textarea(v-model="state.youtubeText" :placeholder="$t('dialog.addChoices.placeholder.youtube')")
        .add-choices-dialog__error-text(v-if="state.youtubeError") {{ state.youtubeError }}

    // Text Tab
    Tab(name="text" :title="$t('dialog.addChoices.tab.text')")
      .add-choices-dialog__tab-content
        textarea.add-choices-dialog__textarea(v-model="state.textText" :placeholder="$t('dialog.addChoices.placeholder.text')")
        .add-choices-dialog__error-text(v-if="state.textError") {{ state.textError }}
</template>

<script>
import { defineComponent, reactive, watch, useContext } from '@nuxtjs/composition-api'
import { Dialog, Tabs, Tab, Button, Notify, Switch, Cell } from 'vant'
import parollaConfig from '@/system/parolla.config'
import { choiceTypeEnum } from '@/enums/quiz.enum'
import MediaInput from '../../Form/CreatorModeComposeForm/partials/MediaInput.vue'

export default defineComponent({
  name: 'AddChoicesDialog',
  components: {
    Dialog: Dialog.Component,
    Tabs,
    Tab,
    Button,
    MediaInput,
    SwitchInput: Switch,
    Cell
  },
  props: {
    isOpen: {
      type: Boolean,
      default: false
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

    const state = reactive({
      isOpen: props.isOpen,
      activeTab: 'photo',
      mediaInputKey: 0,

      youtubeText: '',
      textText: '',
      youtubeError: '',
      textError: '',
      useFilenameAsMediaNote: true
    })

    watch(
      () => props.isOpen,
      val => {
        state.isOpen = val

        if (val) {
          state.mediaInputKey += 1
          // Reset state on open
          state.activeTab = 'photo'

          state.youtubeText = ''
          state.textText = ''
          state.youtubeError = ''
          state.textError = ''
          state.useFilenameAsMediaNote = true
        }
      }
    )

    const handleBeforeClose = (action, done) => {
      if (action === 'confirm') {
        done(false) // Handle close manually in handleConfirm
      } else {
        done()
      }
    }

    const handleClosed = () => {
      emit('close')
    }

    // --- Photo Logic ---
    const getFileExtension = filename => {
      return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase()
    }

    const handleFilesSelected = files => {
      // files is array of Vant file objects { file, content, ... }
      if (Array.isArray(files)) {
        const items = []

        files.forEach(fileItem => {
          if (!fileItem.file || fileItem.status === 'failed') return

          const file = fileItem.file

          // Validate Size
          if (parollaConfig.upload.maxFileSize && file.size > parollaConfig.upload.maxFileSize) return

          // Validate Mime
          if (parollaConfig.upload.allowedMimeTypes && !parollaConfig.upload.allowedMimeTypes.includes(file.type)) return

          // Validate Extension
          if (parollaConfig.upload.allowedExtensions) {
            const ext = getFileExtension(file.name)

            if (!parollaConfig.upload.allowedExtensions.includes(ext)) return
          }

          items.push({
            type: choiceTypeEnum.MEDIA,
            mediaFile: file,
            media: { url: fileItem.content }, // Preview purpose
            mediaNote: state.useFilenameAsMediaNote ? file.name.replace(/\.[^/.]+$/, '').substring(0, 64) : ''
          })
        })

        if (items.length > 0) {
          emit('confirm', items)
          emit('close')
        }
      }
    }

    // --- Youtube Logic ---
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

        if (match && match[1]) return match[1]
      }

      return null
    }

    // --- Confirm Logic ---
    const handleConfirm = () => {
      const items = []

      if (state.activeTab === 'photo') {
        // Photo items are added immediately via handleFilesSelected.
        // If user clicks confirm without selecting files, we can just close or do nothing.
        emit('close')

        return
      } else if (state.activeTab === 'youtube') {
        const lines = state.youtubeText
          .split('\n')
          .map(l => l.trim())
          .filter(l => l)

        if (lines.length > 256) {
          state.youtubeError = i18n.t('error.tooManyLines', { max: 256 })

          return
        }

        const validItems = []
        let hasError = false

        lines.forEach(line => {
          const videoId = extractYoutubeVideoId(line)

          if (videoId) {
            validItems.push({
              type: choiceTypeEnum.YOUTUBE,
              media: {
                url: line,
                videoId: videoId
              }
            })
          } else {
            hasError = true
          }
        })

        if (hasError) {
          state.youtubeError = i18n.t('error.invalidYoutubeLinks')

          return
        }

        items.push(...validItems)
      } else if (state.activeTab === 'text') {
        const lines = state.textText
          .split('\n')
          .map(l => l.trim())
          .filter(l => l)

        if (lines.length > 256) {
          state.textError = i18n.t('error.tooManyLines', { max: 256 })

          return
        }

        const validItems = []
        let hasError = false

        lines.forEach(line => {
          if (line.length <= 64) {
            validItems.push({
              type: choiceTypeEnum.TEXT,
              content: line
            })
          } else {
            hasError = true
          }
        })

        if (hasError) {
          state.textError = i18n.t('error.textTooLong')

          return
        }

        items.push(...validItems)
      }

      emit('confirm', items)
      emit('close')
    }

    return {
      state,
      parollaConfig,
      handleBeforeClose,
      handleClosed,
      handleFilesSelected,
      handleConfirm
    }
  }
})
</script>

<style lang="scss" src="./AddChoicesDialog.component.scss"></style>
