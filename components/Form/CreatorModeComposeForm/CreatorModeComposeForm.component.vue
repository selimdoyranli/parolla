<template lang="pug">
Form.creator-mode-compose-form(validate-first @keypress.enter.prevent @failed="onFormFailed" @submit="handleSubmit")
  span.creator-mode-compose-form__title(align="center")
    template(v-if="room")
      | {{ $t('form.creatorModeEdit.title') }}
      Tag.creator-mode-compose-form__draftTag(v-if="form.isDraft" type="warning") {{ $t('general.draft') }}
    template(v-else) {{ $t('form.creatorModeCompose.title') }}

  RoomBasicInfo(
    :form="form"
    :user="user"
    :game-time-limit-minutes.sync="gameTimeLimitMinutes"
    @input-tag="handleInputTag"
    @add-tag="addTag"
    @remove-tag="removeTag"
  )

  QuestionList(
    :qa-list.sync="form.qaList"
    :quiz-type="form.quizType"
    :is-busy="form.isBusy"
    :answer-type-options="answerTypeOptions"
    :get-media-src="getMediaSrc"
    :get-media-alt="getMediaAlt"
    :is-form-valid="form.isClear"
    @update-order="() => {}"
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

  FormActions(
    :is-visible-save-draft-button="isVisibleSaveDraftButton"
    :qa-list-length="form.qaList.length"
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
import { defineComponent, useRouter, useContext } from '@nuxtjs/composition-api'
import { Form, Tag } from 'vant'

export default defineComponent({
  components: {
    Form,
    Tag
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
      handleCloseCreatedRoomDialog
    }
  }
})
</script>

<style lang="scss" src="./CreatorModeComposeForm.component.scss"></style>
