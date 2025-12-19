<template lang="pug">
Form.creator-mode-compose-form(validate-first @keypress.enter.prevent @failed="onFormFailed" @submit="onFormSubmit")
  span.creator-mode-compose-form__title(align="center")
    template(v-if="room")
      | {{ $t('form.creatorModeEdit.title') }}
      Tag.creator-mode-compose-form__draftTag(v-if="form.isDraft" type="warning") {{ $t('general.draft') }}
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

      Cell.creator-mode-compose-form__gameTimeLimit
        template(#title)
          span {{ $t('form.creatorModeCompose.room.gameTimeLimit.label') }}

        template(#right-icon)
          .game-time-limit-steppers
            .game-time-limit-stepper
              Stepper(v-model="gameTimeLimitMinutes" :min="1" :max="60" :step="1" :integer="true")
              span.game-time-limit-label {{ $t('form.creatorModeCompose.room.gameTimeLimit.minutes') }}

    span.creator-mode-compose-form__fieldsTitle {{ $t('form.creatorModeCompose.qaSet') }}
    .creator-mode-compose-form__fields
      .compose-qa-list
        template(v-if="form.qaList && form.qaList.length > 0")
          // List
          .compose-qa-card(v-for="(item, index) in form.qaList" :key="item.id")
            // Question type switch
            Cell.creator-mode-compose-form__typeSwitchCell
              template(#title)
                span {{ $t('form.creatorModeCompose.qa.question.questionType.title') }}
              template(#right-icon)
                RadioGroup.type-radio-group(v-model="form.qaList[index].questionType" direction="horizontal")
                  Radio.type-radio(name="text")
                    span.type-radio__text {{ $t('form.creatorModeCompose.qa.question.questionType.options.text') }}
                    template(#icon="{ props }")
                      AppIcon.type-radio__icon(name="tabler:pencil")
                  Radio.type-radio(name="media")
                    span.type-radio__text {{ $t('form.creatorModeCompose.qa.question.questionType.options.media') }}
                    template(#icon="{ props }")
                      AppIcon.type-radio__icon(name="tabler:photo")

            Cell.media-list(v-if="item.questionType === questionTypeEnum.MEDIA")
              template(#title)
                span {{ $t('form.creatorModeCompose.qa.question.photo') }}

              template(v-if="!item.media || item.media === null" #right-icon)
                Button.compose-qa-card-add-media-button(
                  type="secondary"
                  plain
                  native-type="button"
                  round
                  size="small"
                  @click="handleAddMedia(index)"
                )
                  AppIcon.compose-qa-card-add-media-button__icon(name="tabler:plus")
                  span.compose-qa-card-add-media-button__text {{ $t('form.creatorModeCompose.qa.question.addPhoto') }}

              template(#label)
                .media-thumbnail(v-if="item.media")
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

            // Answer type switch
            Cell.creator-mode-compose-form__typeSwitchCell
              template(#title)
                span {{ $t('form.creatorModeCompose.qa.answer.answerType.title') }}
              template(#right-icon)
                FilterDropdown(
                  :options="answerTypeOptions"
                  :selected="selectedAnswerTypeOption(index)"
                  :trigger-title="getAnswerTypeOptionsTriggerTitle(index)"
                  :header-title="$t('form.creatorModeCompose.qa.answer.answerType.title')"
                  @on-select-option="handleAnswerTypeChange({ index, option: $event })"
                )

            span.creator-mode-compose-form-answer-label {{ $t('form.creatorModeCompose.qa.answer.label') }}

            // Trivia type answer
            Cell.creator-mode-compose-form-trivia-answer(v-if="item.answerType === answerTypeEnum.TRIVIA")
              TriviaForm(
                :options="item.triviaOptions"
                :correct-option-text="item.answer"
                @on-select-correct-option="triviaHandleSelectCorrectOption({ option: $event, itemIndex: index })"
                @on-set-options="triviaHandleSetOptions({ options: $event, itemIndex: index })"
              )

            Field.creator-mode-compose-form__answerField(
              v-if="item.answerType === answerTypeEnum.TEXT_FIELD"
              v-model="item.answer"
              name="answer"
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
                  v-show="false"
                  round
                  size="small"
                  native-type="button"
                  :disabled="disableMoveUp(index)"
                  @click="moveUp(index)"
                )
                Button.compose-qa-card__moveButton.compose-qa-card__moveButton--down(
                  icon="arrow-down"
                  v-show="false"
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

    .d-flex.align-items-center.mt-base
      // Save draft button
      Button.creator-mode-compose-form__saveDraftButton(
        v-if="isVisibleSaveDraftButton"
        plain
        native-type="button"
        round
        size="small"
        @click="saveAsDraft"
      )
        | {{ $t('form.creatorModeCompose.saveDraft.action') }}

      // Submit button
      Button.compose-qa-list__submitButton(
        v-if="form.qaList && form.qaList.length > 0"
        type="primary"
        icon="success"
        native-type="submit"
        round
        :loading="form.isBusy"
        :disabled="form.isBusy"
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

  MediaUploadDialog(
    :title="$t('form.creatorModeCompose.qa.question.addPhoto')"
    :isOpen="dialog.mediaUpload.isOpen"
    :activeMediaTypes="['file']"
    @closed="handleCloseMediaUploadDialog"
  )

  // Ad
  AppAd.my-base.pt-base(:data-ad-slot="6048083070")
</template>

<script>
import {
  defineComponent,
  useRouter,
  useContext,
  useStore,
  reactive,
  computed,
  onMounted,
  onUnmounted,
  ref,
  nextTick
} from '@nuxtjs/composition-api'
import { ROOM_TAG_REGEX, GAME_TIME_LIMIT } from '@/system/constant'
import { questionTypeEnum, answerTypeEnum } from '@/enums/quiz.enum'
import { roomTransformer } from '@/transformers'
import {
  Form,
  Field,
  Cell,
  Switch,
  Button,
  Empty,
  Notify,
  Dialog,
  Tag,
  Tabs,
  Tab,
  NoticeBar,
  RadioGroup,
  Radio,
  Stepper,
  Toast
} from 'vant'

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
    Radio,
    Stepper
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

    const gameTimeLimitMinutes = computed({
      get: () => Math.floor(form.gameTimeLimit / (60 * 1000)),
      set: value => {
        // Convert minutes to milliseconds (minimum 1 minute = 60000ms)
        form.gameTimeLimit = value * 60 * 1000
      }
    })

    const form = reactive({
      isDraft: props.room?.isVisible ? false : true,
      isBusy: false,
      isClear: true,
      roomTitle: props.room?.title || '',
      isListed: props.room?.isListed || false,
      isAnon: props.room?.isAnon || false,
      tag: '',
      tags: props.room?.tags.map(tag => tag.title) || [],
      qaList: props.room?.questions.map((q, idx) => ({ ...q, id: q.id || Date.now() + idx })) || [],
      mediaList: [],
      gameTimeLimit: props.room?.gameTimeLimit || GAME_TIME_LIMIT
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

    const handleAnswerTypeChange = ({ index, option }) => {
      // Reset answer, character, isMatched, and triviaOptions when answerType changes
      form.qaList[index].answer = ''
      form.qaList[index].character = ''
      form.qaList[index].isMatched = null
      form.qaList[index].triviaOptions = []
      form.qaList[index].answerType = option.value
    }

    const addItem = () => {
      // Get the last question's questionType if exists
      const lastQuestionType = form.qaList.length > 0 ? form.qaList[form.qaList.length - 1].questionType : questionTypeEnum.TEXT

      // Get the last question's answerType if exists
      const lastAnswerType = form.qaList.length > 0 ? form.qaList[form.qaList.length - 1].answerType : answerTypeEnum.TEXT_FIELD

      form.qaList.push({
        id: Date.now() + Math.random(),
        character: '',
        questionType: lastQuestionType,
        question: '',
        answerType: lastAnswerType,
        triviaOptions: [],
        answer: '',
        isMatched: null,
        media: null
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

      // Set word limit - use nextTick to ensure DOM is updated
      nextTick(() => {
        const answerFields = document.querySelectorAll(`.${baseClassName}__answerField`)

        if (answerFields[index]) {
          const wordNumElement = answerFields[index].querySelector('.van-field__word-num')

          if (wordNumElement) {
            wordNumElement.innerHTML = value.length
          }
        }
      })

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

    const triviaHandleSelectCorrectOption = ({ option, itemIndex }) => {
      form.qaList[itemIndex].character = option.text.trim().substring(0, 1).toLocaleLowerCase(i18n.locale).trim().replace(/\s+/g, '')
      form.qaList[itemIndex].answer = option.text
    }

    const selectedAnswerTypeOption = index => {
      return {
        label: getAnswerTypeOptionsTriggerTitle(index),
        value: form.qaList[index].answerType,
        icon: getAnswerTypeOptionsIcon(index)
      }
    }

    const getAnswerTypeOptionsTriggerTitle = index => {
      if (form.qaList[index].answerType === answerTypeEnum.TEXT_FIELD) {
        return i18n.t('form.creatorModeCompose.qa.answer.answerType.options.textField')
      } else if (form.qaList[index].answerType === answerTypeEnum.TRIVIA) {
        return i18n.t('form.creatorModeCompose.qa.answer.answerType.options.trivia')
      }
    }

    const getAnswerTypeOptionsIcon = index => {
      if (form.qaList[index].answerType === answerTypeEnum.TEXT_FIELD) {
        return 'tabler:pencil'
      } else if (form.qaList[index].answerType === answerTypeEnum.TRIVIA) {
        return 'tabler:list'
      }

      return 'tabler:pencil' // fallback
    }

    const answerTypeOptions = computed(() => {
      return [
        {
          label: i18n.t('form.creatorModeCompose.qa.answer.answerType.options.textField'),
          value: answerTypeEnum.TEXT_FIELD,
          icon: 'tabler:pencil'
        },
        {
          label: i18n.t('form.creatorModeCompose.qa.answer.answerType.options.trivia'),
          value: answerTypeEnum.TRIVIA,
          icon: 'tabler:list'
        }
      ]
    })

    const triviaHandleSetOptions = ({ options, itemIndex }) => {
      form.qaList[itemIndex].triviaOptions = options.map(option => option.text.trim())
      form.qaList[itemIndex].answer = ''
    }

    const handleAddMedia = qaIndex => {
      dialog.mediaUpload.currentQaIndex = qaIndex
      dialog.mediaUpload.isOpen = true
    }

    const handleCloseMediaUploadDialog = fileList => {
      if (fileList && fileList.length > 0 && dialog.mediaUpload.currentQaIndex !== null) {
        const selectedMedia = fileList[0]

        if (selectedMedia) {
          // Handle file upload
          const mediaData = {
            file: selectedMedia.file || selectedMedia,
            url:
              selectedMedia.url ||
              (selectedMedia.file && typeof URL !== 'undefined' ? URL.createObjectURL(selectedMedia.file || selectedMedia) : null)
          }

          form.qaList[dialog.mediaUpload.currentQaIndex].media = mediaData

          if (mediaData.file) {
            // Add to mediaList
            form.mediaList.push({ ...mediaData, questionIndex: dialog.mediaUpload.currentQaIndex })
          }
        }
      }

      dialog.mediaUpload.isOpen = false
      dialog.mediaUpload.currentQaIndex = null
    }

    const handleDeleteMedia = qaIndex => {
      // Clear media
      form.qaList[qaIndex].media = null
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

    const onFormFailed = async errorInfo => {
      if (errorInfo && errorInfo.errors.length > 0) {
        form.isClear = false

        // Scroll to first error field
        const firstError = errorInfo.errors[0]

        if (firstError && firstError.name) {
          const errorField = document.querySelector(`[name="${firstError.name}"]`)

          if (errorField) {
            const layoutMain = document.querySelector('.layout__main')

            if (layoutMain) {
              const fieldRect = errorField.getBoundingClientRect()
              const containerRect = layoutMain.getBoundingClientRect()
              const scrollTop = layoutMain.scrollTop + fieldRect.top - containerRect.top - 20 // 20px offset

              layoutMain.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
              })
            }
          }
        }
      } else {
        form.isClear = true
      }
    }

    const onFormSubmit = async () => {
      await handleSubmit({ isDraft: false })
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

    const handleSubmit = async ({ isDraft = false }) => {
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
          if (isDraft) {
            return false
          } else {
            if (form.mediaList.length > 0) {
              return false
            } else {
              return true
            }
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

          if (room.isVisible) {
            form.isDraft = false
            document.querySelector('.creator-mode-compose-form__saveDraftButton')?.classList.add('d-none')
          }

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

              await store.dispatch('creator/editRoom', {
                documentId: room.documentId,
                form: { ...form, isVisible: isDraft ? false : true },
                deviceInfo
              })
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

    const saveAsDraft = async () => {
      await handleSubmit({ isDraft: true })
    }

    const isVisibleSaveDraftButton = computed(() => {
      return form.qaList && form.qaList.length > 0 && (!props.room || (props.room && !props.room.isVisible))
    })

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
      gameTimeLimitMinutes,
      handleInputTag,
      addTag,
      removeTag,
      handleAnswerTypeChange,
      addItem,
      removeItem,
      moveUp,
      moveDown,
      disableMoveUp,
      disableMoveDown,
      formatAnswerField,
      getCharacter,
      validateAnswer,
      triviaHandleSelectCorrectOption,
      selectedAnswerTypeOption,
      getAnswerTypeOptionsTriggerTitle,
      getAnswerTypeOptionsIcon,
      answerTypeOptions,
      triviaHandleSetOptions,
      handleAddMedia,
      handleCloseMediaUploadDialog,
      handleDeleteMedia,
      getMediaSrc,
      getMediaAlt,
      onFormFailed,
      onFormSubmit,
      handleSubmit,
      saveAsDraft,
      isVisibleSaveDraftButton,
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
