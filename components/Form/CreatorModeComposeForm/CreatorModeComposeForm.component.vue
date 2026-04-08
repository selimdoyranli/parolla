<template lang="pug">
Form.creator-mode-compose-form(validate-first @keypress.enter.prevent @failed="onFormFailed" @submit="handleSubmit")
  h1.creator-mode-compose-form__title(align="center")
    template(v-if="room")
      template(v-if="form.quizType === quizTypeEnum.CHOICES") {{ $t('form.creatorModeEdit.choicesTitle') }}
      template(v-else-if="form.quizType === quizTypeEnum.FLASHCARDS") {{ $t('form.creatorModeEdit.flashcardsTitle') }}
      template(v-else) {{ $t('form.creatorModeEdit.title') }}
      Tag.creator-mode-compose-form__draftTag(v-if="form.isDraft" type="warning") {{ $t('general.draft') }}
    template(v-else)
      template(v-if="form.quizType === quizTypeEnum.CHOICES") {{ $t('form.creatorModeCompose.choicesTitle') }}
      template(v-else-if="form.quizType === quizTypeEnum.FLASHCARDS") {{ $t('form.creatorModeCompose.flashcardsTitle') }}
      template(v-else) {{ $t('form.creatorModeCompose.title') }}

  RoomBasicInfo(
    :form="form"
    :user="user"
    :game-time-limit-minutes.sync="gameTimeLimitMinutes"
    @input-tag="handleInputTag"
    @add-tag="addTag"
    @remove-tag="removeTag"
  )

  ChoiceList(
    v-if="form.quizType === quizTypeEnum.CHOICES"
    :choices.sync="form.choices"
    :is-busy="form.isBusy"
    :get-media-src="getMediaSrc"
    :get-media-alt="getMediaAlt"
    @add-item="addItem"
    @add-media="handleAddMedia"
    @delete-media="handleDeleteMedia"
    @remove="removeItem"
    @open-batch-dialog="openAddChoicesDialog"
  )

  QuestionList(
    v-else-if="form.quizType === quizTypeEnum.QA"
    :qa-list.sync="form.qaList"
    :is-busy="form.isBusy"
    :answer-type-options="answerTypeOptions"
    :get-media-src="getMediaSrc"
    :get-media-alt="getMediaAlt"
    :is-form-valid="form.isClear"
    @add-item="addItem"
    @add-media="handleAddMedia"
    @delete-media="handleDeleteMedia"
    @answer-type-change="handleAnswerTypeChange"
    @trivia-select-correct="triviaHandleSelectCorrectOption"
    @trivia-set-options="triviaHandleSetOptions"
    @get-character="getCharacter"
    @move-up="moveUp"
    @move-down="moveDown"
    @remove="removeItem"
  )

  FlashcardList(
    v-else-if="form.quizType === quizTypeEnum.FLASHCARDS"
    :flashcard-list.sync="form.flashcardList"
    :is-busy="form.isBusy"
    @add-item="addItem"
    @remove="removeItem"
    @move-up="moveUp"
    @move-down="moveDown"
  )

  AddChoicesDialog(
    v-if="form.quizType === quizTypeEnum.CHOICES"
    :is-open="isAddChoicesDialogOpen"
    :get-media-src="getMediaSrc"
    :get-media-alt="getMediaAlt"
    @close="closeAddChoicesDialog"
    @confirm="handleBatchAddItems"
  )

  FormActions(
    :is-visible-save-draft-button="isVisibleSaveDraftButton"
    :qa-list-length="qaListLength"
    :is-busy="form.isBusy"
    :is-room-exists="!!room"
    @save-draft="saveAsDraft"
  )

  CreatorModeCreatedRoomDialog(
    :isOpen="dialog.room.isOpen"
    :title="room ? $t('dialog.createdRoom.quizUpdated') : $t('dialog.createdRoom.title')"
    :confirmButtonText="$t('dialog.createdRoom.joinRoom')"
    :room="createdRoom"
    @onConfirm="handleConfirmCreatedRoomDialog"
    @onCancel="handleCancelCreatedRoomDialog"
    @closed="handleCloseCreatedRoomDialog"
  )

  CreatingRoomModal(
    :isOpen="dialog.creatingRoom.isOpen"
    :isUpdating="!!room"
    :totalMediaCount="dialog.creatingRoom.totalMediaCount"
    :uploadedMediaCount="dialog.creatingRoom.uploadedMediaCount"
    :currentUploadingMedia="dialog.creatingRoom.currentUploadingMedia"
  )

  // Ad
  AppAd.my-base.pt-base(:data-ad-slot="6048083070")
</template>

<script>
import { defineComponent, useRouter, useContext, ref, computed } from '@nuxtjs/composition-api'
import { Form, Tag } from 'vant'
import { quizTypeEnum } from '@/enums/quiz.enum'
import ChoiceList from './partials/ChoiceList.vue'
import QuestionList from './partials/QuestionList.vue'
import FlashcardList from './partials/FlashcardList.vue'

export default defineComponent({
  components: {
    Form,
    Tag,
    ChoiceList,
    QuestionList,
    FlashcardList
  },
  props: {
    room: {
      type: Object,
      required: false,
      default: null
    }
  },
  setup(props) {
    const router = useRouter()
    const { localePath } = useContext()

    const {
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
      triviaHandleSelectCorrectOption,
      triviaHandleSetOptions,
      handleAddMedia,
      handleDeleteMedia,
      getMediaSrc,
      getMediaAlt,
      onFormFailed,
      handleSubmit,
      saveAsDraft,
      isVisibleSaveDraftButton
    } = useCreatorForm(props)

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

    const isAddChoicesDialogOpen = ref(false)

    const openAddChoicesDialog = () => {
      isAddChoicesDialogOpen.value = true
    }

    const closeAddChoicesDialog = () => {
      isAddChoicesDialogOpen.value = false
    }

    const qaListLength = computed(() => {
      if (form.quizType === quizTypeEnum.CHOICES) return form.choices.length

      if (form.quizType === quizTypeEnum.FLASHCARDS) return form.flashcardList.length

      return form.qaList.length
    })

    const handleBatchAddItems = items => {
      if (!items || items.length === 0) return

      items.forEach(item => {
        form.choices.push({
          id: Date.now() + Math.random(),
          order: form.choices.length,
          type: item.type,
          content: item.content || '',
          media: item.media || null,
          mediaFile: item.mediaFile || null,
          mediaNote: item.mediaNote || ''
        })
      })
    }

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
      triviaHandleSelectCorrectOption,
      triviaHandleSetOptions,
      handleAddMedia,
      handleDeleteMedia,
      getMediaSrc,
      getMediaAlt,
      onFormFailed,
      handleSubmit,
      saveAsDraft,
      isVisibleSaveDraftButton,
      handleConfirmCreatedRoomDialog,
      handleCancelCreatedRoomDialog,
      handleCloseCreatedRoomDialog,
      quizTypeEnum,
      isAddChoicesDialogOpen,
      openAddChoicesDialog,
      closeAddChoicesDialog,
      handleBatchAddItems,
      qaListLength
    }
  }
})
</script>

<style lang="scss" src="./CreatorModeComposeForm.component.scss"></style>
