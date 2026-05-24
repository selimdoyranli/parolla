import { reactive, computed, ref, nextTick, useContext, useStore, onMounted, onUnmounted, useRoute } from '@nuxtjs/composition-api'
import { ROOM_TAG_REGEX, GAME_TIME_LIMIT } from '@/system/constant'
import { quizTypeEnum, questionTypeEnum, answerTypeEnum, choiceTypeEnum } from '@/enums/quiz.enum'
import { roomTransformer } from '@/transformers'
import { Notify } from 'vant'
import useDeviceInfo from './useDeviceInfo'

export default function useCreatorForm(props, { roomBasicInfoRef } = {}) {
  const { i18n, getRouteBaseName } = useContext()
  const store = useStore()
  const route = useRoute()
  const { getDeviceInfo } = useDeviceInfo()

  const user = computed(() => store.getters['auth/user'])

  const initialQuizType = (() => {
    if (route.value.query.mode === quizTypeEnum.CHOICES || getRouteBaseName(route.value) === 'CreatorMode-CreatorModeCompose-Choices') {
      return quizTypeEnum.CHOICES
    }

    if (
      route.value.query.mode === quizTypeEnum.FLASHCARDS ||
      getRouteBaseName(route.value) === 'CreatorMode-CreatorModeCompose-Flashcards'
    ) {
      return quizTypeEnum.FLASHCARDS
    }

    return props.room?.quizType || quizTypeEnum.QA
  })()

  const form = reactive({
    quizType: initialQuizType,
    isDraft: props.room?.isVisible ? false : true,
    isBusy: false,
    isClear: true,
    roomTitle: props.room?.title || '',
    isListed: props.room?.isListed || false,
    isAnon: props.room?.isAnon || false,
    tag: '',
    tags: props.room?.tags.map(tag => tag.title) || [],
    qaList:
      initialQuizType === quizTypeEnum.QA
        ? props.room?.questions.map((q, idx) => ({
            ...q,
            id: q.id || Date.now() + idx,
            order: idx,
            media: q.media || null,
            mediaFile: null
          })) || []
        : [],
    choices: initialQuizType === quizTypeEnum.CHOICES && props.room?.choices ? transformChoices(props.room.choices) : [],
    flashcardList:
      initialQuizType === quizTypeEnum.FLASHCARDS && props.room?.flashcards
        ? props.room.flashcards.map((fc, idx) => ({
            ...fc,
            id: fc.id || Date.now() + idx,
            order: idx
          }))
        : [],
    gameTimeLimit: props.room?.gameTimeLimit || GAME_TIME_LIMIT,
    description: props.room?.description || '',
    coverPhoto: props.room?.coverPhoto || null,
    coverPhotoFile: null,
    coverPhotoRemoved: false
  })

  // Helper to transform flat list of choices
  function transformChoices(choices) {
    return choices.map(choice => {
      let type = choice.choiceType
      let mediaObj = choice.media

      if (type === choiceTypeEnum.YOUTUBE) {
        type = choiceTypeEnum.YOUTUBE
        mediaObj = { url: choice.youtubeUrl, isYoutube: true }
      }

      return {
        ...choice,
        type: type,
        content: choice.text,
        media: mediaObj,
        mediaFile: null
      }
    })
  }

  const createdRoom = reactive({
    title: '',
    roomId: '',
    questions: [],
    choices: [],
    isListed: form.isListed
  })

  const dialog = reactive({
    room: {
      isOpen: false
    },
    mediaUpload: {
      isOpen: false,
      currentQaIndex: null,
      currentOption: null // 'optionA' or 'optionB' for choices
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

  const handleCoverPhotoChoose = () => {
    form.coverPhotoRemoved = false
  }

  const handleCoverPhotoDirty = () => {
    // Marker only — the blob is generated at submit time via the template ref.
  }

  const handleCoverPhotoRemove = () => {
    form.coverPhotoRemoved = true
    form.coverPhotoFile = null
  }

  const addItem = () => {
    if (form.quizType === quizTypeEnum.CHOICES) {
      const lastType = form.choices.length > 0 ? form.choices[form.choices.length - 1].type : choiceTypeEnum.MEDIA

      form.choices.push({
        id: Date.now() + Math.random(),
        order: form.choices.length,
        type: lastType,
        content: '',
        media: null,
        mediaFile: null
      })
    }

    if (form.quizType === quizTypeEnum.QA) {
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

    if (form.quizType === quizTypeEnum.FLASHCARDS) {
      form.flashcardList.push({
        id: Date.now() + Math.random(),
        cardFrontText: '',
        cardBackText: '',
        order: form.flashcardList.length
      })
    }
  }

  const removeItem = index => {
    if (form.quizType === quizTypeEnum.CHOICES) {
      form.choices.splice(index, 1)
    }

    if (form.quizType === quizTypeEnum.QA) {
      form.qaList.splice(index, 1)
    }

    if (form.quizType === quizTypeEnum.FLASHCARDS) {
      form.flashcardList.splice(index, 1)
      form.flashcardList.forEach((item, idx) => {
        item.order = idx
      })
    }
  }

  const moveUp = index => {
    if (index === 0) return

    if (form.quizType === quizTypeEnum.QA) {
      const item = form.qaList.splice(index, 1)[0]
      form.qaList.splice(index - 1, 0, item)
      updateOrder()
    }

    if (form.quizType === quizTypeEnum.FLASHCARDS) {
      const item = form.flashcardList.splice(index, 1)[0]
      form.flashcardList.splice(index - 1, 0, item)
      form.flashcardList.forEach((item, idx) => {
        item.order = idx
      })
    }
  }

  const moveDown = index => {
    if (form.quizType === quizTypeEnum.QA) {
      if (index === form.qaList.length - 1) return
      const item = form.qaList.splice(index, 1)[0]
      form.qaList.splice(index + 1, 0, item)
      updateOrder()
    }

    if (form.quizType === quizTypeEnum.FLASHCARDS) {
      if (index === form.flashcardList.length - 1) return
      const item = form.flashcardList.splice(index, 1)[0]
      form.flashcardList.splice(index + 1, 0, item)
      form.flashcardList.forEach((item, idx) => {
        item.order = idx
      })
    }
  }

  const updateOrder = () => {
    if (form.quizType === quizTypeEnum.QA) {
      form.qaList.forEach((item, idx) => {
        item.order = idx
      })
    }
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
  const handleAddMedia = ({ index }) => {
    dialog.mediaUpload.currentQaIndex = index
    dialog.mediaUpload.isOpen = true
  }

  const handleCloseMediaUploadDialog = fileList => {
    if (fileList && fileList.length > 0 && dialog.mediaUpload.currentQaIndex !== null) {
      const selectedMedia = fileList[0]

      if (selectedMedia) {
        const mediaData = {
          file: selectedMedia.file || selectedMedia,
          url:
            selectedMedia.url ||
            (selectedMedia.file && typeof URL !== 'undefined' ? URL.createObjectURL(selectedMedia.file || selectedMedia) : null)
        }

        if (form.quizType === quizTypeEnum.CHOICES) {
          form.choices[dialog.mediaUpload.currentQaIndex].media = mediaData

          if (mediaData.file) {
            form.choices[dialog.mediaUpload.currentQaIndex].mediaFile = mediaData.file
          }
        }

        if (form.quizType === quizTypeEnum.QA) {
          form.qaList[dialog.mediaUpload.currentQaIndex].media = mediaData

          if (mediaData.file) {
            form.qaList[dialog.mediaUpload.currentQaIndex].mediaFile = mediaData.file
          }
        }
      }
    }
    dialog.mediaUpload.isOpen = false
    dialog.mediaUpload.currentQaIndex = null
  }

  const handleDeleteMedia = ({ index }) => {
    if (form.quizType === quizTypeEnum.CHOICES) {
      form.choices[index].media = null
      form.choices[index].mediaFile = null
    }

    if (form.quizType === quizTypeEnum.QA) {
      form.qaList[index].media = null
      form.qaList[index].mediaFile = null
    }
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

      if (!targetElement && fallbackSelector) {
        targetElement = document.querySelector(fallbackSelector)
      }

      if (targetElement) {
        const layoutMain = document.querySelector('.layout__main')

        if (layoutMain) {
          const fieldRect = targetElement.getBoundingClientRect()
          const containerRect = layoutMain.getBoundingClientRect()
          const scrollTop = layoutMain.scrollTop + fieldRect.top - containerRect.top - 150
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

    // Stage cover photo blob if the croppa in <RoomBasicInfo> has a
    // non-initial, dirty image. Uses methods exposed by the child via
    // template ref.
    const childRef = roomBasicInfoRef?.value

    if (childRef && typeof childRef.coverPhotoIsCommittable === 'function' && childRef.coverPhotoIsCommittable()) {
      form.coverPhotoFile = await childRef.generateCoverPhotoBlob()
    }

    let itemsWithMedia = []

    // Both modes now use same structure for mediaFile on root item
    if (form.quizType === quizTypeEnum.CHOICES) {
      itemsWithMedia = form.choices.filter(item => item.mediaFile)
    }

    if (form.quizType === quizTypeEnum.QA) {
      itemsWithMedia = form.qaList.filter(item => item.mediaFile)
    }

    const hasCoverPhotoUpload = Boolean(form.coverPhotoFile)
    const hasCoverPhotoDelete = Boolean(props.room && form.coverPhotoRemoved && form.coverPhoto && !form.coverPhotoFile)
    const selectedMediaCount = itemsWithMedia.length + (hasCoverPhotoUpload ? 1 : 0)

    openCreatingRoomModal(selectedMediaCount)

    // Validation
    let isValid = true

    if (form.quizType === quizTypeEnum.CHOICES) {
      if (form.choices.length < 8 || form.choices.length > 256) {
        getErrorNotify({
          error: {
            message: i18n.t('error.choicesLength', { min: 8, max: 256 })
          }
        })
        form.isBusy = false
        closeCreatingRoomModal()

        return
      }

      const invalidItems = form.choices.filter(item => {
        if (item.type === choiceTypeEnum.TEXT && !item.content) return true

        if (item.type === choiceTypeEnum.MEDIA && !item.media) return true

        return false
      })

      if (invalidItems.length > 0) isValid = false
    }

    if (form.quizType === quizTypeEnum.QA) {
      const nonMatchedItems = form.qaList.filter(item => item.isMatched === false)
      const mediaMissingItems = form.qaList.filter(
        item => item.questionType === questionTypeEnum.MEDIA && (!item.media || item.media === null)
      )
      const answerMissingItems = form.qaList.filter(item => !item.answer || item.answer.trim() === '')

      if (nonMatchedItems.length > 0 || mediaMissingItems.length > 0 || answerMissingItems.length > 0) {
        isValid = false
      }
    }

    if (form.quizType === quizTypeEnum.FLASHCARDS) {
      if (form.flashcardList.length < 1 || form.flashcardList.length > 100) {
        getErrorNotify({
          error: {
            message: i18n.t('error.flashcardListLength', { min: 1, max: 100 })
          }
        })
        form.isBusy = false
        closeCreatingRoomModal()

        return
      }

      const invalidItems = form.flashcardList.filter(
        item => !item.cardFrontText || item.cardFrontText.trim() === '' || !item.cardBackText || item.cardBackText.trim() === ''
      )

      if (invalidItems.length > 0) isValid = false
    }

    if (!isValid) {
      form.isClear = false
      scrollToErrorMessage('.van-field__error-message')
      getErrorNotify()
      form.isBusy = false
      closeCreatingRoomModal()

      return
    } else {
      form.isClear = true
    }

    const deviceInfo = await getDeviceInfo()

    const getQuizVisibility = () => {
      if (isDraft) return false

      return selectedMediaCount <= 0
    }

    const payload = {
      ...form,
      qaList: form.quizType === quizTypeEnum.QA ? form.qaList : [],
      choices: form.quizType === quizTypeEnum.CHOICES ? form.choices : [],
      flashcardList: form.quizType === quizTypeEnum.FLASHCARDS ? form.flashcardList : [],
      gameTimeLimit: form.quizType === quizTypeEnum.QA ? form.gameTimeLimit : null,
      isVisible: getQuizVisibility()
    }

    const { data, error } = props.room
      ? await store.dispatch('creator/editRoom', {
          documentId: props.room.documentId,
          form: payload,
          deviceInfo
        })
      : await store.dispatch('creator/postRoom', { form: payload, deviceInfo })

    if (data) {
      const room = roomTransformer(data.data)

      if (room.isVisible) {
        form.isDraft = false
      }

      createdRoom.title = room.title
      createdRoom.roomId = room.roomId
      createdRoom.questions = room.questions
      createdRoom.choices = room.choices || []
      createdRoom.isListed = form.isListed

      // Upload Media
      let uploadedMediaCount = 0

      try {
        // Cover photo step (compose or edit). Best-effort: failures notify
        // but don't abort the qa media loop.
        if (hasCoverPhotoUpload) {
          updateCreatingRoomProgress({
            currentMedia: { file: form.coverPhotoFile, url: null }
          })
          const { data: cpData, error: cpError } = await store.dispatch('creator/uploadRoomCoverPhoto', {
            documentId: room.documentId,
            file: form.coverPhotoFile
          })

          if (cpData) {
            form.coverPhoto = cpData.data?.coverPhoto || cpData.coverPhoto || form.coverPhoto
            form.coverPhotoFile = null
            uploadedMediaCount++
            updateCreatingRoomProgress({ uploadedCount: uploadedMediaCount })
          } else if (cpError) {
            getErrorNotify({
              error: { message: i18n.t('form.creatorModeCompose.room.coverPhoto.error.uploadFailed') }
            })
          }
        } else if (hasCoverPhotoDelete) {
          const { data: cpDelData, error: cpDelError } = await store.dispatch('creator/deleteRoomCoverPhoto', {
            documentId: room.documentId
          })

          if (cpDelData) {
            form.coverPhoto = null
            form.coverPhotoRemoved = false
          } else if (cpDelError) {
            getErrorNotify({
              error: { message: cpDelError.message }
            })
          }
        }

        // Reset the croppa's local isDirty flag now that we've attempted
        // the upload/delete — mirrors avatar.isDirty = false at the end
        // of ProfileEditForm's photo branch. Same posture: a failed
        // upload won't retry on the next submit unless the user
        // interacts with the cropper again.
        if (hasCoverPhotoUpload || hasCoverPhotoDelete) {
          roomBasicInfoRef?.value?.markCoverPhotoCommitted?.()
        }

        if (form.quizType === quizTypeEnum.CHOICES) {
          // Handle choices media upload
          for (let i = 0; i < form.choices.length; i++) {
            const formItem = form.choices[i]
            const createdChoice = createdRoom.choices[i]

            if (formItem.mediaFile && createdChoice) {
              updateCreatingRoomProgress({
                currentMedia: {
                  file: formItem.mediaFile,
                  url: formItem.media?.url || null
                }
              })

              const { data: uploadedData, error: uploadedError } = await store.dispatch('creator/uploadQuizMedia', {
                file: formItem.mediaFile,
                path: `quiz/${room.id}`,
                ref: 'api::room-choice.room-choice',
                refId: createdChoice.id,
                field: 'media'
              })

              if (uploadedData) {
                uploadedMediaCount++
                formItem.media = uploadedData[0]
                formItem.mediaFile = null
                updateCreatingRoomProgress({ uploadedCount: uploadedMediaCount })
              }

              if (uploadedError) throw uploadedError
            }
          }
        }

        if (form.quizType === quizTypeEnum.QA) {
          // Standard QA media upload
          for (let index = 0; index < form.qaList.length; index++) {
            const qaItem = form.qaList[index]

            if (qaItem.mediaFile) {
              const createdQaItem = createdRoom.questions[index]

              if (createdQaItem) {
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
                  form.qaList[index].mediaFile = null
                  updateCreatingRoomProgress({ uploadedCount: uploadedMediaCount })
                }

                if (uploadedError) throw uploadedError
              }
            }
          }
        }

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
  }

  const saveAsDraft = async () => {
    await handleSubmit({ isDraft: true })
  }

  const isVisibleSaveDraftButton = computed(() => {
    const hasItems =
      (form.qaList && form.qaList.length > 0) ||
      (form.choices && form.choices.length > 0) ||
      (form.flashcardList && form.flashcardList.length > 0)

    return hasItems && (!props.room || (props.room && !props.room.isVisible))
  })

  // Navigation block
  const handleBeforeUnload = e => {
    const hasContent =
      form.roomTitle.length > 0 ||
      form.qaList.length > 0 ||
      form.choices.length > 0 ||
      form.flashcardList.length > 0 ||
      form.tags.length > 0

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
    isVisibleSaveDraftButton,
    handleCoverPhotoChoose,
    handleCoverPhotoDirty,
    handleCoverPhotoRemove
  }
}
