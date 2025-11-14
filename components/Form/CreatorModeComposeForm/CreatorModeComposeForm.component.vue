<template lang="pug">
Form.creator-mode-compose-form(@keypress.enter.prevent @failed="handleFailed")
  span.creator-mode-compose-form__title(align="center")
    template(v-if="room") {{ $t('form.creatorModeEdit.title') }}
    template(v-else) {{ $t('form.creatorModeCompose.title') }}

  template
    span.creator-mode-compose-form__fieldsTitle {{ $t('form.creatorModeCompose.roomInformations') }}
    .creator-mode-compose-form__fields
      Field.creator-mode-compose-form__roomTitle(
        v-model="form.roomTitle"
        name="roomTitle"
        :label="$t('form.creatorModeCompose.room.roomTitle.label')"
        :placeholder="$t('form.creatorModeCompose.room.roomTitle.placeholder')"
        maxlength="64"
        show-word-limit
        :rules="[{ required: true, message: $t('form.isRequired', { model: $t('form.creatorModeCompose.room.roomTitle.label') }) }]"
      )

      Cell.creator-mode-compose-form__.creator-mode-compose-form__isListed
        template(#title)
          span {{ $t('form.creatorModeCompose.room.isListed.label') }}

        template(#right-icon)
          VanSwitch(v-model="form.isListed" :size="24")

      template(v-if="$auth.loggedIn && $auth.user")
        Cell.creator-mode-compose-form__isAnon
          template(#title)
            span {{ $t('form.creatorModeCompose.room.isAnon.label') }} &nbsp;
            small(v-if="user")
              template(v-if="form.isAnon") ({{ $t('general.anon') }})
              template(v-else) ({{ user.username }})

          template(#right-icon)
            VanSwitch(v-model="form.isAnon" :size="24")

      Field.creator-mode-compose-form__roomTag(
        v-model="form.tag"
        name="roomTag"
        :label="$t('form.creatorModeCompose.room.tag.label')"
        :placeholder="$t('form.creatorModeCompose.room.tag.placeholder')"
        maxlength="64"
        show-word-limit
        @input="handleInputTag"
        @keydown.enter.prevent="addTag"
      )
        template(#button)
          Button(
            type="info"
            native-type="button"
            round
            size="small"
            :disabled="form.tag.length <= 0 || form.tags.length >= 5"
            @click="addTag"
          )
            | +

      Cell.creator-mode-compose-form-tags(v-if="form.tags && form.tags.length > 0")
        .creator-mode-compose-form-tags__tags
          template(v-for="tag in form.tags")
            Tag.creator-mode-compose-form-tags__tag(type="primary" closeable @close="removeTag(tag)") {{ tag }}

    span.creator-mode-compose-form__fieldsTitle {{ $t('form.creatorModeCompose.qaSet') }}
    .creator-mode-compose-form__fields
      .compose-qa-list
        template(v-if="form.qaList && form.qaList.length > 0")
          // List
          .compose-qa-card(v-for="(item, index) in form.qaList")
            Cell.creator-mode-compose-form__questionType
              template(#title)
                span {{ $t('form.creatorModeCompose.qa.question.questionType.title') }}
              template(#right-icon)
                RadioGroup.question-type-radio-group(v-model="form.qaList[index].questionType" direction="horizontal")
                  Radio.question-type-radio(name="text")
                    span.question-type-radio__text {{ $t('form.creatorModeCompose.qa.question.questionType.options.text') }}
                    template(#icon="{ props }")
                      AppIcon.question-type-radio__icon(name="tabler:pencil")
                  Radio.question-type-radio(name="media")
                    span.question-type-radio__text {{ $t('form.creatorModeCompose.qa.question.questionType.options.media') }}
                    template(#icon="{ props }")
                      AppIcon.question-type-radio__icon(name="tabler:photo")

            Cell.media-list(v-if="item.questionType === questionTypeEnum.MEDIA")
              template(#title)
                span {{ $t('form.creatorModeCompose.qa.question.photoOrVideo') }}

              template(v-if="(!item.media || item.media === null) && (!item.youtube || item.youtube === null)" #right-icon)
                Button.compose-qa-card-add-media-button(
                  type="secondary"
                  plain
                  native-type="button"
                  round
                  size="small"
                  @click="handleAddMedia(index)"
                )
                  AppIcon.compose-qa-card-add-media-button__icon(name="tabler:upload")
                  span.compose-qa-card-add-media-button__text {{ $t('form.creatorModeCompose.qa.question.addMedia') }}

              template(#label)
                .media-thumbnail(v-if="item.media || item.youtube")
                  template(v-if="item.youtube")
                    iframe.media-thumbnail__youtube(:src="item.youtube.embedUrl" frameborder="0" allowfullscreen)
                    Button.media-thumbnail__delete(type="danger" size="small" round @click="handleDeleteMedia(index)")
                      AppIcon(name="tabler:x" :width="14" :height="14")

                  template(v-else-if="item.media")
                    img.media-thumbnail__image(:src="getMediaSrc(item.media)" :alt="getMediaAlt(item.media)")
                    Button.media-thumbnail__delete(type="danger" size="small" round @click="handleDeleteMedia(index)")
                      AppIcon(name="tabler:x" :width="14" :height="14")

                  Cell.creator-mode-compose-form-media-note
                    small.creator-mode-compose-form-media-note__description {{ $t('form.creatorModeCompose.qa.question.mediaNote.description') }}
                    Field.creator-mode-compose-form-media-note-field(
                      v-model="item.mediaNote"
                      name="mediaNote"
                      :placeholder="$t('form.creatorModeCompose.qa.question.mediaNote.placeholder')"
                      maxlength="64"
                      show-word-limit
                    )

            Field.creator-mode-compose-form__questionField(
              v-if="item.questionType === questionTypeEnum.TEXT"
              v-model="item.question"
              name="question"
              :label="$t('form.creatorModeCompose.qa.question.label')"
              :placeholder="$t('form.creatorModeCompose.qa.question.placeholder')"
              maxlength="120"
              rows="2"
              autosize
              show-word-limit
              :rules="[{ required: true, message: $t('form.isRequired', { model: $t('form.creatorModeCompose.qa.question.label') }) }]"
            )
            Field.creator-mode-compose-form__answerField(
              v-model="item.answer"
              name="answer"
              :label="$t('form.creatorModeCompose.qa.answer.label')"
              :placeholder="$t('form.creatorModeCompose.qa.answer.label')"
              maxlength="120"
              show-word-limit
              rows="2"
              :formatter="formatAnswerField"
              :error-message="item.isMatched === false ? $t('form.creatorModeCompose.qa.answer.error.nonMatched') : null"
              :error="item.isMatched === false"
            )
              template(#input)
                input.van-field__control(
                  :value="item.answer"
                  :placeholder="$t('form.creatorModeCompose.qa.answer.placeholder')"
                  maxlength="120"
                  @input="e => getCharacter(e.target.value, { item, index })"
                )

            .compose-qa-card__actions
              label.compose-qa-card__index {{ index + 1 }}. {{ $t('general.question') }}

              template(v-if="form.qaList && form.qaList.length > 1")
                Button.compose-qa-card__moveButton.compose-qa-card__moveButton--up(
                  icon="arrow-up"
                  round
                  size="small"
                  native-type="button"
                  :disabled="disableMoveUp(index)"
                  @click="moveUp(index)"
                )
                Button.compose-qa-card__moveButton.compose-qa-card__moveButton--down(
                  icon="arrow-down"
                  round
                  size="small"
                  native-type="button"
                  :disabled="disableMoveDown(index)"
                  @click="moveDown(index)"
                )

              Button.compose-qa-card__removeButton(
                type="danger"
                icon="cross"
                plain
                native-type="button"
                round
                size="small"
                @click="removeItem(index)"
              ) {{ $t('form.creatorModeCompose.qa.question.removeQuestion') }}

        // Empty List
        template(v-else)
          Empty(:description="$t('form.creatorModeCompose.qa.empty.description')")
            // Add qa button
            Button.compose-qa-list__addQaButton(type="info" icon="plus" native-type="button" round @click="addItem")
              | {{ $t('form.creatorModeCompose.qa.empty.action') }}

        // Add qa button
        Button.compose-qa-list__addQaButton(
          v-if="form.qaList && form.qaList.length > 0"
          type="info"
          icon="plus"
          plain
          native-type="button"
          round
          :loading="form.isBusy"
          :disabled="form.isBusy"
          @click="addItem"
        ) {{ $t('form.creatorModeCompose.qa.addMoreQuestion') }}

        p.creator-mode-compose-form__termsDescription(v-if="form.qaList && form.qaList.length > 0")
          | {{ $t('form.creatorModeCompose.termsDescription') }}

    // Save list button
    Button.compose-qa-list__submitButton(
      v-if="form.qaList && form.qaList.length > 0"
      type="primary"
      icon="success"
      plain
      native-type="button"
      round
      :loading="form.isBusy"
      :disabled="form.isBusy"
      @click="handleSubmit"
    )
      template(v-if="room") {{ $t('form.creatorModeEdit.submit') }}
      template(v-else) {{ $t('form.creatorModeCompose.submit') }}

  CreatorModeCreatedRoomDialog(
    :isOpen="dialog.room.isOpen"
    :title="room ? $t('dialog.createdRoom.quizUpdated') : $t('dialog.createdRoom.title')"
    :confirmButtonText="$t('dialog.createdRoom.joinRoom')"
    :room="createdRoom"
    @onConfirm="handleConfirmCreatedRoomDialog"
    @onCancel="handleCancelCreatedRoomDialog"
    @closed="handleCloseCreatedRoomDialog"
  )

  MediaUploadDialog(:isOpen="dialog.mediaUpload.isOpen" @closed="handleCloseMediaUploadDialog")

  // Ad
  AppAd.my-base.pt-base(:data-ad-slot="6048083070")
</template>

<script>
import { defineComponent, useRouter, useContext, useStore, ref, reactive, computed, onMounted, onUnmounted } from '@nuxtjs/composition-api'
import { ROOM_TAG_REGEX } from '@/system/constant'
import { questionTypeEnum, answerTypeEnum } from '@/enums/quiz.enum'
import { roomTransformer } from '@/transformers'
import { Form, Field, Cell, Switch, Button, Empty, Notify, Dialog, Tag, Tabs, Tab, NoticeBar, RadioGroup, Radio, Toast } from 'vant'

export default defineComponent({
  components: {
    Form,
    Field,
    Cell,
    VanSwitch: Switch,
    Button,
    Empty,
    Dialog,
    Tag,
    Tabs,
    Tab,
    NoticeBar,
    RadioGroup,
    Radio
  },
  props: {
    room: {
      type: Object,
      required: false,
      default: null
    }
  },
  setup(props) {
    const baseClassName = 'creator-mode-compose-form'

    const router = useRouter()
    const { localePath, i18n } = useContext()
    const store = useStore()

    const { getDeviceInfo } = useDeviceInfo()

    const user = computed(() => store.getters['auth/user'])

    const form = reactive({
      isBusy: false,
      isClear: false,
      roomTitle: props.room?.title || '',
      isListed: props.room?.isListed || false,
      isAnon: props.room?.isAnon || false,
      tag: '',
      tags: props.room?.tags.map(tag => tag.title) || [],
      qaList: props.room?.questions || [],
      mediaList: []
    })

    const createdRoom = reactive({
      title: '',
      roomId: '',
      isListed: form.isListed
    })

    const dialog = reactive({
      room: {
        isOpen: false
      },
      mediaUpload: {
        isOpen: false,
        currentQaIndex: null
      }
    })

    const handleInputTag = value => {
      // Keep letters (any language) and numbers, remove spaces and special characters
      const cleaned = value.replace(ROOM_TAG_REGEX, '')
      form.tag = cleaned
    }

    const addTag = () => {
      // Trim whitespace from beginning and end
      const trimmedTag = form.tag.trim()

      // Check if tag is not empty after trimming, not already in list, and list is not full
      if (trimmedTag.length > 0 && form.tags.length < 5 && !form.tags.map(t => t.toLowerCase()).includes(trimmedTag.toLowerCase())) {
        form.tags.push(trimmedTag)
        form.tag = ''
      }
    }

    const removeTag = tag => {
      form.tags = form.tags.filter(t => t.toLowerCase() !== tag.toLowerCase())
    }

    const addItem = () => {
      form.qaList.push({
        character: '',
        questionType: questionTypeEnum.TEXT,
        question: '',
        answerType: answerTypeEnum.TEXT_FIELD,
        answer: '',
        isMatched: null,
        media: null,
        youtube: null
      })
    }

    const removeItem = index => {
      form.qaList.splice(index, 1)
      // Update mediaList for removed question
      updateMediaListForRemovedQuestion(index)
    }

    const moveUp = index => {
      const item = form.qaList.splice(index, 1)[0]
      form.qaList.splice(index - 1, 0, item)

      // Update mediaList for swapped questions
      updateMediaListForSwappedQuestions(index - 1, index)
    }

    const moveDown = index => {
      const item = form.qaList.splice(index, 1)[0]
      form.qaList.splice(index + 1, 0, item)

      // Update mediaList for swapped questions
      updateMediaListForSwappedQuestions(index, index + 1)
    }

    const disableMoveUp = index => index === 0
    const disableMoveDown = index => index === form.qaList.length - 1

    const updateMediaListForRemovedQuestion = removedIndex => {
      // Remove media item at the specified index
      form.mediaList = form.mediaList.filter(media => media.questionIndex !== removedIndex)
      // Update questionIndex for remaining media items that were after the removed index
      form.mediaList.forEach(media => {
        if (media.questionIndex > removedIndex) {
          media.questionIndex--
        }
      })
    }

    const updateMediaListForSwappedQuestions = (index1, index2) => {
      // Swap questionIndex values for media items at the specified indices
      form.mediaList.forEach(media => {
        if (media.questionIndex === index1) {
          media.questionIndex = index2
        } else if (media.questionIndex === index2) {
          media.questionIndex = index1
        }
      })
    }

    const formatAnswerField = value => {
      const formattedValue = value.startsWith(' ') ? '' : value

      return formattedValue
    }

    const getCharacter = (value, { item, index }) => {
      if (value && value.length > 0) {
        form.qaList[index].answer = value

        const answers = value.split(',')
        const firstAnswer = answers[0]
        const firstAnswerChar = firstAnswer.substring(0, 1)

        const isMatched = answers.every(answer => {
          const char = answer.substring(0, 1)

          if (
            char.toLocaleLowerCase(i18n.locale).trim().replace(/\s+/g, '') ===
            firstAnswerChar.toLocaleLowerCase(i18n.locale).trim().replace(/\s+/g, '')
          ) {
            return true
          } else {
            return false
          }
        })

        if (isMatched) {
          form.qaList[index].character = firstAnswerChar.toLocaleUpperCase(i18n.locale)
        }
      } else {
        form.qaList[index].character = ''
      }

      // Set word limit
      document.querySelectorAll(`.${baseClassName}__answerField`)[index].querySelector('.van-field__word-num').innerHTML = value.length

      setTimeout(() => {
        validateAnswer(value, { item, index })
      }, 100)
    }

    const validateAnswer = (value, { item, index }) => {
      if (item.character && item.character.length > 0 && value && value.length > 0) {
        const answers = value.split(',')

        const isMatched = answers.every(answer => {
          if (answer.toLocaleLowerCase(i18n.locale).trim().replace(/\s+/g, '').startsWith(item.character.toLocaleLowerCase(i18n.locale))) {
            return true
          } else {
            return false
          }
        })

        if (isMatched) {
          form.qaList[index].isMatched = true
        } else {
          form.qaList[index].isMatched = false
        }
      } else {
        form.qaList[index].isMatched = false
      }
    }

    const handleAddMedia = qaIndex => {
      dialog.mediaUpload.currentQaIndex = qaIndex
      dialog.mediaUpload.isOpen = true
    }

    const handleCloseMediaUploadDialog = fileList => {
      if (fileList && fileList.length > 0 && dialog.mediaUpload.currentQaIndex !== null) {
        const selectedMedia = fileList[0]

        if (selectedMedia) {
          // Handle YouTube video
          if (selectedMedia.videoId) {
            const youtubeData = {
              videoId: selectedMedia.videoId,
              url: selectedMedia.url,
              embedUrl: selectedMedia.embedUrl
            }

            form.qaList[dialog.mediaUpload.currentQaIndex].youtube = reactive({ ...youtubeData })
          } else {
            // Handle file upload
            const mediaData = {
              file: selectedMedia.file || selectedMedia,
              url:
                selectedMedia.url ||
                (selectedMedia.file && typeof URL !== 'undefined' ? URL.createObjectURL(selectedMedia.file || selectedMedia) : null)
            }

            form.qaList[dialog.mediaUpload.currentQaIndex].media = mediaData

            if (mediaData.file && !selectedMedia.youtube) {
              // Add to mediaList
              form.mediaList.push({ ...mediaData, questionIndex: dialog.mediaUpload.currentQaIndex })
            }
          }
        }
      }

      dialog.mediaUpload.isOpen = false
      dialog.mediaUpload.currentQaIndex = null
    }

    const handleDeleteMedia = qaIndex => {
      // Clear both media and youtube
      form.qaList[qaIndex].media = null
      form.qaList[qaIndex].youtube = null
      // Remove from mediaList as well
      form.mediaList = form.mediaList.filter(media => media.questionIndex !== qaIndex)
    }

    const getMediaSrc = media => {
      if (!media) return ''

      // If we have a direct URL, use it
      if (media.url) return media.url

      // If we have a file object, create object URL safely
      if (media.file && typeof URL !== 'undefined' && URL.createObjectURL) {
        try {
          return URL.createObjectURL(media.file)
        } catch (error) {
          console.warn('Failed to create object URL for media:', error)

          return ''
        }
      }

      return ''
    }

    const getMediaAlt = media => {
      if (!media) return 'Media'

      if (media.file && media.file.name) return media.file.name

      return 'Media'
    }

    const handleFailed = errorInfo => {
      if (errorInfo && errorInfo.values.length > 0) {
        form.isClear = false
      } else {
        form.isClear = true
      }
    }

    const getErrorNotify = error => {
      Notify({
        message: error ? `${error.error.message}` : `${i18n.t('form.creatorModeCompose.error.couldNotCreate')}.`,
        color: 'var(--color-text-04)',
        background: 'var(--color-danger-01)',
        duration: 3000
      })
    }

    const showCreatingRoomToast = () => {
      Toast.loading({
        className: 'toast-creating-quiz',
        message: props.room ? i18n.t('form.creatorModeCompose.updatingQuiz') : i18n.t('form.creatorModeCompose.creatingQuiz'),
        duration: 0,
        forbidClick: true,
        overlay: true,
        closeOnClickOverlay: false
      })
    }

    const clearCreatingRoomToast = () => {
      Toast.clear()
    }

    const handleSubmit = async () => {
      form.isBusy = true
      showCreatingRoomToast()

      const nonMatchedItems = form.qaList.filter(item => {
        return item.isMatched === false
      })

      if (nonMatchedItems.length > 0) {
        form.isClear = false
      } else {
        form.isClear = true
      }

      const resetMediaList = () => {
        form.mediaList = []
      }

      if (form.isClear) {
        const deviceInfo = await getDeviceInfo()

        /**
         * If the quiz has media, set the visibility to false, set to true after media is uploaded successfully
         */
        const getQuizVisibility = () => {
          if (form.qaList.some(item => item.media)) {
            return false
          } else {
            return true
          }
        }

        const { data, error } = props.room
          ? await store.dispatch('creator/editRoom', {
              documentId: props.room.documentId,
              form: { ...form, isVisible: getQuizVisibility() },
              deviceInfo
            })
          : await store.dispatch('creator/postRoom', { form: { ...form, isVisible: getQuizVisibility() }, deviceInfo })

        if (data) {
          const room = roomTransformer(data.data)

          createdRoom.title = room.title
          createdRoom.roomId = room.roomId
          createdRoom.isListed = form.isListed

          const mediaListItems = form.mediaList.map(media => media.file).filter(file => file != null)

          if (mediaListItems.length > 0) {
            const { data: uploadedMediaListData, error: uploadedMediaListError } = await store.dispatch('creator/uploadQuizMedia', {
              files: mediaListItems,
              path: `quiz/${room.id}`,
              ref: 'api::room.room',
              refId: room.id,
              field: 'mediaList'
            })

            if (uploadedMediaListData) {
              uploadedMediaListData.forEach((uploadedMedia, index) => {
                // Use the original questionIndex to set media to the correct qaList item
                const originalQuestionIndex = form.mediaList[index].questionIndex
                form.qaList[originalQuestionIndex].media = uploadedMedia
              })

              await store.dispatch('creator/editRoom', { documentId: room.documentId, form: { ...form, isVisible: true }, deviceInfo })
              await resetMediaList()
            }

            if (uploadedMediaListError) {
              const questionIndex = form.qaList.findIndex(item => {
                return item?.media?.file?.name === uploadedMediaListError.details?.file?.originalFilename
              })

              getErrorNotify({
                error: {
                  ...uploadedMediaListError,
                  message: `Medya yüklenirken hata oldu \n ${
                    questionIndex !== -1
                      ? `${questionIndex + 1}. ${i18n.t('general.question')}: ${uploadedMediaListError.message}`
                      : uploadedMediaListError.message
                  }`
                }
              })

              setTimeout(() => {
                dialog.room.isOpen = false
              }, 1)
            }
          }

          dialog.room.isOpen = true
        }

        if (error) {
          getErrorNotify({ error })
        }
      } else {
        getErrorNotify()
      }

      form.isBusy = false
      clearCreatingRoomToast()
    }

    const handleBeforeUnload = e => {
      const hasContent = form.roomTitle.length > 0 || form.qaList.length > 0 || form.tags.length > 0

      if (hasContent) {
        e.preventDefault()
        e.returnValue = ''

        return ''
      }
    }

    onMounted(() => {
      window.addEventListener('beforeunload', handleBeforeUnload)
    })

    onUnmounted(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    })

    const handleConfirmCreatedRoomDialog = () => {
      router.push(
        localePath({
          name: 'CreatorMode-CreatorModeRoom-slug',
          params: { slug: createdRoom.roomId }
        })
      )
    }

    const handleCancelCreatedRoomDialog = () => {
      router.push(localePath({ name: 'CreatorMode-CreatorModeEdit-slug', params: { slug: createdRoom.roomId } }))
    }

    const handleCloseCreatedRoomDialog = () => {
      dialog.room.isOpen = false
    }

    return {
      questionTypeEnum,
      answerTypeEnum,
      user,
      form,
      handleInputTag,
      addTag,
      removeTag,
      addItem,
      removeItem,
      moveUp,
      moveDown,
      disableMoveUp,
      disableMoveDown,
      formatAnswerField,
      getCharacter,
      validateAnswer,
      handleAddMedia,
      handleCloseMediaUploadDialog,
      handleDeleteMedia,
      getMediaSrc,
      getMediaAlt,
      handleFailed,
      handleSubmit,
      createdRoom,
      dialog,
      handleConfirmCreatedRoomDialog,
      handleCancelCreatedRoomDialog,
      handleCloseCreatedRoomDialog
    }
  }
})
</script>

<style lang="scss" src="./CreatorModeComposeForm.component.scss"></style>
