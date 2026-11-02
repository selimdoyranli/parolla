<template lang="pug">
div
  //- step 1: pick an action
  Dialog.dialog.gm-moderation-dialog(
    :value="isOpen"
    show-cancel-button
    :show-confirm-button="false"
    :title="$t('gmModeration.title')"
    :cancel-button-text="$t('general.cancel')"
    width="min(92vw, 400px)"
    @input="$emit('update:isOpen', $event)"
  )
    CellGroup.gm-moderation-dialog__options(inset)
      Cell(is-link center :title="actionLabel" @click="openForm")
        template(#icon)
          AppIcon.gm-moderation-dialog__optionIcon(name="tabler:eye-off" :width="20" :height="20")
      template(v-if="target === 'room'")
        Cell(is-link center :title="$t('gmModeration.queueAiTags')" @click="queueAiTags")
          template(#icon)
            AppIcon.gm-moderation-dialog__optionIcon.gm-moderation-dialog__optionIcon--neutral(
              name="tabler:sparkles"
              :width="20"
              :height="20"
            )
        Cell(is-link center :title="$t('gmModeration.editTags')" @click="openTags")
          template(#icon)
            AppIcon.gm-moderation-dialog__optionIcon.gm-moderation-dialog__optionIcon--neutral(name="tabler:tags" :width="20" :height="20")

  //- step 2: note + optional ban, then send
  Dialog.dialog.gm-moderation-dialog(
    v-model="form.isOpen"
    show-cancel-button
    :show-confirm-button="false"
    :title="actionLabel"
    :cancel-button-text="$t('general.cancel')"
    :close-on-click-overlay="!form.isBusy"
    width="min(92vw, 400px)"
  )
    .gm-moderation-dialog__content
      Field.gm-moderation-dialog__note(
        v-model="form.note"
        type="textarea"
        :placeholder="$t('gmModeration.notePlaceholder')"
        rows="3"
        autosize
        maxlength="1000"
        show-word-limit
        :disabled="form.isBusy"
      )
      Cell.gm-moderation-dialog__ban(center :title="$t('gmModeration.banOwner')")
        template(#right-icon)
          VanSwitch(v-model="form.blockOwner" size="22px" :disabled="form.isBusy")
      Button.gm-moderation-dialog__send(type="danger" block round native-type="button" :loading="form.isBusy" @click="send")
        | {{ $t('gmModeration.send') }}

  //- manual tags: same format as the creator form, existing tags suggested while typing
  Dialog.dialog.gm-moderation-dialog(
    v-if="target === 'room'"
    v-model="tagForm.isOpen"
    show-cancel-button
    :show-confirm-button="false"
    :title="$t('gmModeration.editTags')"
    :cancel-button-text="$t('general.cancel')"
    :close-on-click-overlay="!tagForm.isBusy"
    width="min(92vw, 400px)"
  )
    .gm-moderation-dialog__content
      Field.gm-moderation-dialog__note(
        v-model="tagForm.input"
        :placeholder="$t('form.creatorModeCompose.room.tag.placeholder')"
        maxlength="64"
        :disabled="tagForm.isBusy || tagForm.tags.length >= ROOM_TAGS_MAX"
        @input="onTagInput"
        @keydown.enter.prevent="addTag(tagForm.input)"
      )
      .gm-moderation-dialog__tags(v-if="tagForm.suggestions.length")
        Tag.gm-moderation-dialog__suggestion(v-for="tag in tagForm.suggestions" :key="tag" type="primary" plain @click="addTag(tag)") {{ tag }}
      .gm-moderation-dialog__tags
        Tag.gm-moderation-dialog__tag(v-for="tag in tagForm.tags" :key="tag" type="primary" closeable @close="removeTag(tag)") {{ tag }}
      Button.gm-moderation-dialog__save(type="primary" block round native-type="button" :loading="tagForm.isBusy" @click="saveTags")
        | {{ $t('gmModeration.saveTags') }}
</template>

<script>
import { defineComponent, computed, reactive, useStore, useContext } from '@nuxtjs/composition-api'
import { Dialog, CellGroup, Cell, Field, Switch, Button, Tag } from 'vant'
import { showToast } from '@/helpers/toast'
import { ROOM_TAG_REGEX } from '@/system/constant'

const ROOM_TAGS_MAX = 5

export default defineComponent({
  name: 'GmModerationDialog',
  components: { Dialog: Dialog.Component, CellGroup, Cell, Field, VanSwitch: Switch, Button, Tag },
  props: {
    isOpen: { type: Boolean, default: false },
    // 'room': unlist from the public list, 'community': hide from the site
    target: { type: String, required: true, validator: value => ['room', 'community'].includes(value) },
    // room needs documentId + locale (+ roomTags for the tag editor), community documentId
    item: { type: Object, required: true }
  },
  emits: ['update:isOpen', 'done'],
  setup(props, { emit }) {
    const store = useStore()
    const { i18n } = useContext()
    const form = reactive({ isOpen: false, note: '', blockOwner: false, isBusy: false })

    const actionLabel = computed(() => i18n.t(props.target === 'room' ? 'gmModeration.unlistRoom' : 'gmModeration.hideCommunity'))

    const openForm = () => {
      emit('update:isOpen', false)
      Object.assign(form, { isOpen: true, note: '', blockOwner: false })
    }

    const send = async () => {
      if (form.isBusy) return

      form.isBusy = true

      const payload = { documentId: props.item.documentId, note: form.note.trim(), blockOwner: form.blockOwner }
      const { error } =
        props.target === 'room'
          ? await store.dispatch('gm/unlistRoom', { ...payload, locale: props.item.locale })
          : await store.dispatch('community/gmHideCommunity', payload)

      form.isBusy = false

      if (error) {
        showToast.fail(error.message || i18n.t('error.anErrorOccurred'))

        return
      }

      form.isOpen = false
      showToast.success(i18n.t(props.target === 'room' ? 'gmModeration.unlistedDone' : 'gmModeration.hiddenDone'))
      emit('done')
    }

    const tagForm = reactive({ isOpen: false, input: '', tags: [], suggestions: [], isBusy: false })
    // tags saved in this session win over the (stale) prop
    let savedTags = null
    let suggestTimer = null

    const queueAiTags = async () => {
      emit('update:isOpen', false)

      const { error } = await store.dispatch('gm/queueRoomAiTags', { documentId: props.item.documentId, locale: props.item.locale })

      if (error) showToast.fail(error.message || i18n.t('error.anErrorOccurred'))
      else showToast.success(i18n.t('gmModeration.aiTagsQueued'))
    }

    const openTags = () => {
      emit('update:isOpen', false)
      Object.assign(tagForm, {
        isOpen: true,
        input: '',
        suggestions: [],
        tags: savedTags || (props.item.roomTags || []).map(tag => tag.title)
      })
    }

    const onTagInput = value => {
      tagForm.input = value.replace(ROOM_TAG_REGEX, '')
      clearTimeout(suggestTimer)

      const q = tagForm.input.toLocaleLowerCase('tr')

      if (!q) {
        tagForm.suggestions = []

        return
      }

      suggestTimer = setTimeout(async () => {
        const { data } = await store.dispatch('gm/fetchRoomTagSuggestions', { q })

        // drop late replies for an older input
        if (tagForm.input.toLocaleLowerCase('tr') === q) tagForm.suggestions = (data?.data || []).filter(tag => !tagForm.tags.includes(tag))
      }, 250)
    }

    const addTag = value => {
      const tag = value.replace(ROOM_TAG_REGEX, '').toLocaleLowerCase('tr')

      if (tag && tagForm.tags.length < ROOM_TAGS_MAX && !tagForm.tags.includes(tag)) tagForm.tags.push(tag)

      tagForm.input = ''
      tagForm.suggestions = []
    }

    const removeTag = tag => {
      tagForm.tags = tagForm.tags.filter(t => t !== tag)
    }

    const saveTags = async () => {
      if (tagForm.isBusy) return

      tagForm.isBusy = true

      const { data, error } = await store.dispatch('gm/setRoomTags', {
        documentId: props.item.documentId,
        locale: props.item.locale,
        tags: tagForm.tags
      })

      tagForm.isBusy = false

      if (error) {
        showToast.fail(error.message || i18n.t('error.anErrorOccurred'))

        return
      }

      savedTags = data?.tags || tagForm.tags
      tagForm.isOpen = false
      showToast.success(i18n.t('gmModeration.tagsSaved'))
      emit('done')
    }

    return {
      ROOM_TAGS_MAX,
      form,
      actionLabel,
      openForm,
      send,
      tagForm,
      queueAiTags,
      openTags,
      onTagInput,
      addTag,
      removeTag,
      saveTags
    }
  }
})
</script>

<style lang="scss" src="./GmModerationDialog.component.scss"></style>
