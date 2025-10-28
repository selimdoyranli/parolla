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

    template(v-if="!$auth.loggedIn && !$auth.user")
      small.creator-mode-compose-form__anonNotice
        AppIcon(name="tabler:info-circle" :width="16" :height="16")
        | Giriş yapmadığın için oluşturacağın odayı tekrar düzenleyemez ya da silemezsin.

    span.creator-mode-compose-form__fieldsTitle {{ $t('form.creatorModeCompose.qaSet') }}
    .creator-mode-compose-form__fields
      .compose-qa-list
        template(v-if="form.qaList && form.qaList.length > 0")
          // List
          .compose-qa-card(v-for="(item, index) in form.qaList")
            Field.creator-mode-compose-form__questionField(
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
            Field.creator-mode-compose-form__characterField(
              v-model="item.character"
              name="character"
              :label="$t('form.creatorModeCompose.qa.character.label')"
              :placeholder="$t('form.creatorModeCompose.qa.character.placeholder')"
              maxlength="1"
              readonly
              disabled
              :rules="[{ required: true, message: $t('form.isRequired', { model: $t('form.creatorModeCompose.qa.character.label') }) }]"
              @input="validateAnswer({ item, index })"
            )

            .compose-qa-card__actions
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
              ) {{ $t('general.remove') }}

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

        Button(
          v-if="form.qaList && form.qaList.length > 1 && room === null"
          type="warning"
          plain
          native-type="button"
          round
          :loading="form.isBusy"
          :disabled="form.isBusy"
          @click="handleClickDeleteDraft"
        ) {{ $t('form.creatorModeCompose.deleteDraft.action') }}

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
    :confirmButtonText="$t('dialog.createdRoom.joinRoom')"
    :room="createdRoom"
    @onConfirm="handleConfirmRoomDialog"
    @closed="handleCloseRoomDialog"
  )

  // Ad
  AppAd.my-base.pt-base(:data-ad-slot="6048083070")
</template>

<script>
import { defineComponent, useRouter, useContext, useStore, reactive, set, watch, computed } from '@nuxtjs/composition-api'
import { ROOM_TAG_REGEX } from '@/system/constant'
import { roomTransformer } from '@/transformers'
import { Form, Field, Cell, Switch, Button, Empty, Notify, Dialog, Tag } from 'vant'

export default defineComponent({
  components: {
    Form,
    Field,
    Cell,
    VanSwitch: Switch,
    Button,
    Empty,
    Dialog,
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
    const baseClassName = 'creator-mode-compose-form'

    const router = useRouter()
    const { localePath, i18n } = useContext()
    const store = useStore()

    const { getDeviceInfo } = useDeviceInfo()

    const user = computed(() => store.getters['auth/user'])

    const form = reactive({
      isBusy: false,
      isClear: false,
      roomTitle: '',
      isListed: false,
      isAnon: false,
      tag: '',
      tags: [],
      qaList: []
    })

    const createdRoom = reactive({
      title: '',
      id: '',
      isListed: form.isListed
    })

    const dialog = reactive({
      room: {
        isOpen: false
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
        question: '',
        answer: '',
        isMatched: null
      })
    }

    const removeItem = index => {
      form.qaList.splice(index, 1)
    }

    const moveUp = index => {
      const temp = form.qaList[index]
      set(form.qaList, index, form.qaList[index - 1])
      set(form.qaList, index - 1, temp)
    }

    const moveDown = index => {
      const temp = form.qaList[index]
      set(form.qaList, index, form.qaList[index + 1])
      set(form.qaList, index + 1, temp)
    }

    const disableMoveUp = index => index === 0
    const disableMoveDown = index => index === form.qaList.length - 1

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

    const handleFailed = errorInfo => {
      if (errorInfo && errorInfo.values.length > 0) {
        form.isClear = false
      } else {
        form.isClear = true
      }
    }

    const getErrorNotify = () => {
      Notify({
        message: i18n.t('form.creatorModeCompose.error.couldNotCreate'),
        color: 'var(--color-text-04)',
        background: 'var(--color-danger-01)',
        duration: 1000
      })
    }

    const handleSubmit = async () => {
      form.isBusy = true

      const nonMatchedItems = form.qaList.filter(item => {
        return item.isMatched === false
      })

      if (nonMatchedItems.length > 0) {
        form.isClear = false
      } else {
        form.isClear = true
      }

      if (form.isClear) {
        const deviceInfo = await getDeviceInfo()

        const { data, error } = props.room
          ? await store.dispatch('creator/editRoom', { documentId: props.room.documentId, form, deviceInfo })
          : await store.dispatch('creator/postRoom', { form, deviceInfo })

        if (data) {
          const room = data.data

          createdRoom.title = room.title
          createdRoom.id = room.roomId
          createdRoom.isListed = form.isListed

          dialog.room.isOpen = true

          let storagedMyRooms = JSON.parse(window.localStorage.getItem('myRooms'))

          if (storagedMyRooms && storagedMyRooms.length > 0) {
            window.localStorage.setItem('myRooms', JSON.stringify([...storagedMyRooms, roomTransformer(room)]))
          } else {
            window.localStorage.setItem('myRooms', JSON.stringify([roomTransformer(room)]))
          }
        }

        if (error) {
          getErrorNotify()
        }
      } else {
        getErrorNotify()
      }

      form.isBusy = false
    }

    const resetForm = () => {
      form.roomTitle = ''
      form.isListed = false
      form.isAnon = false
      form.qaList = []
      form.tags = []
    }

    const handleClickDeleteDraft = () => {
      Dialog.confirm({
        title: i18n.t('form.creatorModeCompose.deleteDraft.confirm.title'),
        message: i18n.t('form.creatorModeCompose.deleteDraft.confirm.description'),
        cancelButtonText: i18n.t('form.creatorModeCompose.deleteDraft.confirm.cancel'),
        confirmButtonText: i18n.t('form.creatorModeCompose.deleteDraft.confirm.confirm')
      }).then(() => {
        deleteDraft()
      })
    }

    const saveDraft = () => {
      window.localStorage.setItem('creatorFormDraft', JSON.stringify(form))
    }

    const storagedForm = JSON.parse(window.localStorage.getItem('creatorFormDraft'))

    if (storagedForm && props.room === null) {
      form.roomTitle = storagedForm.roomTitle
      form.isListed = storagedForm.isListed
      form.isAnon = storagedForm.isAnon
      form.qaList = storagedForm.qaList
      form.tags = storagedForm.tags
    }

    const deleteDraft = () => {
      window.localStorage.removeItem('creatorFormDraft')
      resetForm()
    }

    const setForm = value => {
      form.roomTitle = value.title
      form.isListed = value.isListed
      form.isAnon = value.isAnon
      form.qaList = value.questions
      form.tags = value.tags.map(tag => tag.title)
    }

    if (props.room) {
      setForm(props.room)
    }

    watch(props.room, value => {
      setForm(value)
    })

    const handleConfirmRoomDialog = () => {
      router.push(
        localePath({
          name: 'CreatorMode-CreatorModeRoom',
          query: { id: createdRoom.id }
        })
      )
    }

    const handleCloseRoomDialog = () => {
      dialog.room.isOpen = false
    }

    watch(form, value => {
      if (value.qaList && value.qaList.length > 0) {
        saveDraft()
      }
    })

    return {
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
      handleFailed,
      handleSubmit,
      handleClickDeleteDraft,
      saveDraft,
      deleteDraft,
      createdRoom,
      dialog,
      handleConfirmRoomDialog,
      handleCloseRoomDialog
    }
  }
})
</script>

<style lang="scss" src="./CreatorModeComposeForm.component.scss"></style>
