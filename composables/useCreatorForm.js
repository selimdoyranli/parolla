import { reactive, computed, ref, nextTick, useContext, useStore, onMounted, onUnmounted } from '@nuxtjs/composition-api'
import { ROOM_TAG_REGEX, GAME_TIME_LIMIT } from '@/system/constant'
import { questionTypeEnum, answerTypeEnum } from '@/enums/quiz.enum'
import { roomTransformer } from '@/transformers'
import { Notify } from 'vant'
import useDeviceInfo from './useDeviceInfo'

export default function useCreatorForm(props) {
  const { i18n } = useContext()
  const store = useStore()
  const { getDeviceInfo } = useDeviceInfo()

  const user = computed(() => store.getters['auth/user'])

  const form = reactive({
    isDraft: props.room?.isVisible ? false : true,
    isBusy: false,
    isClear: true,
    roomTitle: props.room?.title || '',
    isListed: props.room?.isListed || false,
    isAnon: props.room?.isAnon || false,
    tag: '',
    tags: props.room?.tags.map(tag => tag.title) || [],
    qaList:
      props.room?.questions.map((q, idx) => ({
        ...q,
        id: q.id || Date.now() + idx,
        order: idx,
        // Ensure media object structure is consistent if it exists
        media: q.media || null,
        mediaFile: null // New field for storing file object to upload
      })) || [],
    gameTimeLimit: props.room?.gameTimeLimit || GAME_TIME_LIMIT
  })

  const createdRoom = reactive({
    title: '',
    roomId: '',
    questions: [],
    isListed: form.isListed
  })

  const dialog = reactive({
    room: {
      isOpen: false
    },
    mediaUpload: {
      isOpen: false,
      currentQaIndex: null
    },
    creatingRoom: {
      isOpen: false,
      totalMediaCount: 0,
      uploadedMediaCount: 0,
      currentUploadingMedia: null
    }
  })

  const gameTimeLimitMinutes = computed({
    get: () => Math.floor(form.gameTimeLimit / (60 * 1000)),
    set: value => {
      form.gameTimeLimit = value * 60 * 1000
    }
  })

  const answerTypeOptions = computed(() => [
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
  ])

  // --- Methods ---

  const handleInputTag = value => {
    const cleaned = value.replace(ROOM_TAG_REGEX, '')
    form.tag = cleaned
  }

  const addTag = () => {
    const trimmedTag = form.tag.trim()

    if (trimmedTag.length > 0 && form.tags.length < 5 && !form.tags.map(t => t.toLowerCase()).includes(trimmedTag.toLowerCase())) {
      form.tags.push(trimmedTag)
      form.tag = ''
    }
  }

  const removeTag = tag => {
    form.tags = form.tags.filter(t => t.toLowerCase() !== tag.toLowerCase())
  }

  const addItem = () => {
    const lastQuestionType = form.qaList.length > 0 ? form.qaList[form.qaList.length - 1].questionType : questionTypeEnum.TEXT
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
      media: null,
      mediaFile: null,
      order: form.qaList.length
    })
  }

  const removeItem = index => {
    form.qaList.splice(index, 1)
  }

  const moveUp = index => {
    if (index === 0) return
    const item = form.qaList.splice(index, 1)[0]
    form.qaList.splice(index - 1, 0, item)
    updateOrder()
  }

  const moveDown = index => {
    if (index === form.qaList.length - 1) return
    const item = form.qaList.splice(index, 1)[0]
    form.qaList.splice(index + 1, 0, item)
    updateOrder()
  }

  const updateOrder = () => {
    form.qaList.forEach((item, idx) => {
      item.order = idx
    })
  }

  const handleAnswerTypeChange = ({ index, option }) => {
    form.qaList[index].answer = ''
    form.qaList[index].character = ''
    form.qaList[index].isMatched = null
    form.qaList[index].triviaOptions = []
    form.qaList[index].answerType = option.value
  }

  const getCharacter = (value, { item, index }) => {
    if (value && value.length > 0) {
      form.qaList[index].answer = value
      const answers = value.split(',')
      const firstAnswer = answers[0]
      const firstAnswerChar = firstAnswer.substring(0, 1)

      const isMatched = answers.every(answer => {
        const char = answer.substring(0, 1)

        return (
          char.toLocaleLowerCase(i18n.locale).trim().replace(/\s+/g, '') ===
          firstAnswerChar.toLocaleLowerCase(i18n.locale).trim().replace(/\s+/g, '')
        )
      })

      if (isMatched) {
        form.qaList[index].character = firstAnswerChar.toLocaleUpperCase(i18n.locale)
      }
    } else {
      form.qaList[index].character = ''
    }

    nextTick(() => {
      // Need to pass a unique ID or ref to access the specific element if we want to manipulate DOM directly
      // But better to let Vue handle this if possible.
      // Keeping original logic for now but might need adjustment in component
      // The original logic used querySelectorAll which is brittle.
      // We will skip the DOM manipulation part here and rely on v-model updates.
      // If word count update is visual only and needed, we should handle it in the component.
    })

    setTimeout(() => {
      validateAnswer(value, { item, index })
    }, 100)
  }

  const validateAnswer = (value, { item, index }) => {
    if (item.character && item.character.length > 0 && value && value.length > 0) {
      const answers = value.split(',')
      const isMatched = answers.every(answer => {
        return answer.toLocaleLowerCase(i18n.locale).trim().replace(/\s+/g, '').startsWith(item.character.toLocaleLowerCase(i18n.locale))
      })
      form.qaList[index].isMatched = isMatched
    } else {
      form.qaList[index].isMatched = false
    }
  }

  const triviaHandleSelectCorrectOption = ({ option, itemIndex }) => {
    form.qaList[itemIndex].character = option.text.trim().substring(0, 1).toLocaleLowerCase(i18n.locale).trim().replace(/\s+/g, '')
    form.qaList[itemIndex].answer = option.text
  }

  const triviaHandleSetOptions = ({ options, itemIndex }) => {
    form.qaList[itemIndex].triviaOptions = options.map(option => option.text.trim())
    form.qaList[itemIndex].answer = ''
  }

  // Media Handling
  const handleAddMedia = qaIndex => {
    dialog.mediaUpload.currentQaIndex = qaIndex
    dialog.mediaUpload.isOpen = true
  }

  const handleCloseMediaUploadDialog = fileList => {
    if (fileList && fileList.length > 0 && dialog.mediaUpload.currentQaIndex !== null) {
      const selectedMedia = fileList[0]

      if (selectedMedia) {
        const mediaData = {
          file: selectedMedia.file || selectedMedia, // This is the File object
          url:
            selectedMedia.url ||
            (selectedMedia.file && typeof URL !== 'undefined' ? URL.createObjectURL(selectedMedia.file || selectedMedia) : null)
        }

        // Update the QA item with media info
        form.qaList[dialog.mediaUpload.currentQaIndex].media = mediaData

        // Store the file directly for upload later
        if (mediaData.file) {
          form.qaList[dialog.mediaUpload.currentQaIndex].mediaFile = mediaData.file
        }
      }
    }
    dialog.mediaUpload.isOpen = false
    dialog.mediaUpload.currentQaIndex = null
  }

  const handleDeleteMedia = qaIndex => {
    form.qaList[qaIndex].media = null
    form.qaList[qaIndex].mediaFile = null
  }

  const getMediaSrc = media => {
    if (!media) return ''

    if (media.url) return media.url

    if (media.file && typeof URL !== 'undefined' && URL.createObjectURL) {
      try {
        return URL.createObjectURL(media.file)
      } catch (error) {
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

  // Helper Methods
  const scrollToErrorMessage = (primarySelector, fallbackSelector = null) => {
    nextTick(() => {
      let targetElement = document.querySelector(primarySelector)

      // If primary selector not found and fallback provided, try fallback
      if (!targetElement && fallbackSelector) {
        targetElement = document.querySelector(fallbackSelector)
      }

      if (targetElement) {
        const layoutMain = document.querySelector('.layout__main')

        if (layoutMain) {
          const fieldRect = targetElement.getBoundingClientRect()
          const containerRect = layoutMain.getBoundingClientRect()
          const scrollTop = layoutMain.scrollTop + fieldRect.top - containerRect.top - 150 // 150px offset

          layoutMain.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
          })
        }
      }
    })
  }

  // Form Submission
  const onFormFailed = async errorInfo => {
    if (errorInfo && errorInfo.errors.length > 0) {
      form.isClear = false

      // Scroll to first error field or error message
      const firstError = errorInfo.errors[0]

      if (firstError && firstError.name) {
        scrollToErrorMessage('.van-field__error-message', `[name="${firstError.name}"]`)
      }
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

  const openCreatingRoomModal = (totalMediaCount = 0) => {
    dialog.creatingRoom.isOpen = true
    dialog.creatingRoom.totalMediaCount = totalMediaCount
    dialog.creatingRoom.uploadedMediaCount = 0
    dialog.creatingRoom.currentUploadingMedia = null
  }

  const closeCreatingRoomModal = () => {
    dialog.creatingRoom.isOpen = false
    dialog.creatingRoom.totalMediaCount = 0
    dialog.creatingRoom.uploadedMediaCount = 0
    dialog.creatingRoom.currentUploadingMedia = null
  }

  const updateCreatingRoomProgress = ({ uploadedCount, currentMedia }) => {
    if (uploadedCount !== undefined) {
      dialog.creatingRoom.uploadedMediaCount = uploadedCount
    }

    if (currentMedia !== undefined) {
      dialog.creatingRoom.currentUploadingMedia = currentMedia
    }
  }

  const handleSubmit = async ({ isDraft = false }) => {
    form.isBusy = true

    const itemsWithMedia = form.qaList.filter(item => item.mediaFile)
    const selectedMediaCount = itemsWithMedia.length

    openCreatingRoomModal(selectedMediaCount)

    const nonMatchedItems = form.qaList.filter(item => item.isMatched === false)
    const mediaMissingItems = form.qaList.filter(
      item => item.questionType === questionTypeEnum.MEDIA && (!item.media || item.media === null)
    )
    const answerMissingItems = form.qaList.filter(item => !item.answer || item.answer.trim() === '')

    if (nonMatchedItems.length > 0 || mediaMissingItems.length > 0 || answerMissingItems.length > 0) {
      form.isClear = false

      // Scroll to first error when validation fails
      scrollToErrorMessage('.van-field__error-message')
    } else {
      form.isClear = true
    }

    if (!form.isClear) {
      getErrorNotify()
      form.isBusy = false
      closeCreatingRoomModal()

      return
    }

    const deviceInfo = await getDeviceInfo()

    // Visibility logic
    const getQuizVisibility = () => {
      if (isDraft) return false

      return selectedMediaCount <= 0
    }

    const payload = {
      ...form,
      isVisible: getQuizVisibility()
    }

    // Call API
    const { data, error } = props.room
      ? await store.dispatch('creator/editRoom', {
          documentId: props.room.documentId,
          form: payload,
          deviceInfo
        })
      : await store.dispatch('creator/postRoom', { form: payload, deviceInfo })

    if (data) {
      const room = roomTransformer(data.data)

      // Sync IDs back to form list
      if (room.questions && Array.isArray(room.questions)) {
        room.questions.forEach((item, index) => {
          if (form.qaList[index]) {
            form.qaList[index].id = item.id

            if (item.documentId) {
              form.qaList[index].documentId = item.documentId
            }
          }
        })
      }

      if (room.isVisible) {
        form.isDraft = false
      }

      createdRoom.title = room.title
      createdRoom.roomId = room.roomId
      createdRoom.questions = room.questions
      createdRoom.isListed = form.isListed

      // Upload Media
      let uploadedMediaCount = 0

      // We iterate through our form.qaList to find items with mediaFile
      // We need to match them to the createdRoom.questions to get the refId (qaItem.id)
      // Since order is preserved, we can match by index.
      // Upload sequentially to show progress for each media

      try {
        for (let index = 0; index < form.qaList.length; index++) {
          const qaItem = form.qaList[index]

          if (qaItem.mediaFile) {
            const createdQaItem = createdRoom.questions[index]

            if (createdQaItem) {
              // Update current uploading media for modal display
              updateCreatingRoomProgress({
                currentMedia: {
                  file: qaItem.mediaFile,
                  url: qaItem.media?.url || null
                }
              })

              const { data: uploadedData, error: uploadedError } = await store.dispatch('creator/uploadQuizMedia', {
                file: qaItem.mediaFile,
                path: `quiz/${room.id}`,
                ref: 'api::room-qa-item.room-qa-item',
                refId: createdQaItem.id,
                field: 'media'
              })

              if (uploadedData) {
                uploadedMediaCount++
                form.qaList[index].media = uploadedData[0]
                form.qaList[index].mediaFile = null // Clear file after upload

                // Update progress count
                updateCreatingRoomProgress({
                  uploadedCount: uploadedMediaCount
                })
              }

              if (uploadedError) {
                throw uploadedError
              }
            }
          }
        }

        // If all media uploaded and we are not draft, make visible
        if (selectedMediaCount > 0 && !isDraft) {
          await store.dispatch('creator/setRoomVisibility', {
            documentId: room.documentId,
            isVisible: true
          })
        }

        closeCreatingRoomModal()
        dialog.room.isOpen = true
        form.isBusy = false
      } catch (uploadError) {
        closeCreatingRoomModal()
        getErrorNotify({
          error: {
            message: `Media upload error: ${uploadError.message}`
          }
        })
        dialog.room.isOpen = false
      }
    }

    if (error) {
      getErrorNotify({ error })
      form.isBusy = false
      closeCreatingRoomModal()
    }

    if (selectedMediaCount === 0 && !error) {
      // dialog.room.isOpen = true // Already set above in success path?
      // Logic in original was a bit nested.
    }
  }

  const saveAsDraft = async () => {
    await handleSubmit({ isDraft: true })
  }

  const isVisibleSaveDraftButton = computed(() => {
    return form.qaList && form.qaList.length > 0 && (!props.room || (props.room && !props.room.isVisible))
  })

  // Navigation block
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

  return {
    user,
    form,
    createdRoom,
    dialog,
    gameTimeLimitMinutes,
    answerTypeOptions,
    handleInputTag,
    addTag,
    removeTag,
    addItem,
    removeItem,
    moveUp,
    moveDown,
    handleAnswerTypeChange,
    getCharacter,
    validateAnswer,
    triviaHandleSelectCorrectOption,
    triviaHandleSetOptions,
    handleAddMedia,
    handleCloseMediaUploadDialog,
    handleDeleteMedia,
    getMediaSrc,
    getMediaAlt,
    onFormFailed,
    handleSubmit,
    saveAsDraft,
    isVisibleSaveDraftButton
  }
}
