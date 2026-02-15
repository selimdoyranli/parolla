<template lang="pug">
.compose-qa-card
  // Choice type switch
  Cell.creator-mode-compose-form__typeSwitchCell
    template(#title)
      span {{ $t('form.creatorModeCompose.choices.choiceType') }}
    template(#right-icon)
      FilterDropdown(
        :options="typeOptions"
        :selected="selectedTypeOption"
        :trigger-title="triggerTitle"
        :header-title="$t('form.creatorModeCompose.choices.choiceType')"
        @on-select-option="onTypeChange"
      )

  // Media Input Section
  Cell.media-list(v-if="item.type === choiceTypeEnum.MEDIA")
    template(#title)
      span {{ $t('form.creatorModeCompose.choices.type.media') }}

    template(#label)
      MediaInput(
        input-type="file"
        :media="item.media"
        :media-note="item.mediaNote"
        :get-media-src="getMediaSrc"
        :get-media-alt="getMediaAlt"
        @update:media="onMediaUpdate"
        @update:mediaNote="onMediaNoteUpdate"
        @remove="onMediaRemove"
      )

  // YouTube Input Section
  Cell.media-list(v-if="item.type === choiceTypeEnum.YOUTUBE")
    template(#title)
      span {{ $t('form.creatorModeCompose.choices.type.youtube') }}

    template(#label)
      MediaInput(
        input-type="youtube"
        :media="item.media"
        :media-note="item.mediaNote"
        :get-media-src="getMediaSrc"
        :get-media-alt="getMediaAlt"
        @update:media="onMediaUpdate"
        @update:mediaNote="onMediaNoteUpdate"
        @remove="onMediaRemove"
      )

  // Text Input Section
  Field.creator-mode-compose-form__questionField(
    v-if="item.type === choiceTypeEnum.TEXT"
    v-model="item.content"
    name="content"
    :placeholder="$t('form.creatorModeCompose.choices.placeholder.text')"
    maxlength="64"
    rows="2"
    autosize
    show-word-limit
  )

  .compose-qa-card__actions
    label.compose-qa-card__index {{ index + 1 }}. {{ $t('general.option') }}

    Button.compose-qa-card__removeButton(
      type="danger"
      icon="cross"
      plain
      native-type="button"
      round
      size="small"
      @click="$emit('remove', index)"
    ) {{ $t('form.creatorModeCompose.choices.removeChoice') }}
</template>

<script>
import { defineComponent, computed, useContext } from '@nuxtjs/composition-api'
import { choiceTypeEnum } from '@/enums/quiz.enum'
import { Field, Button, Cell, Dialog } from 'vant'
import MediaInput from './MediaInput.vue'

export default defineComponent({
  name: 'ChoiceItem',
  components: {
    Field,
    Button,
    Cell,
    MediaInput
  },
  props: {
    item: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      required: true
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

    const onMediaUpdate = (mediaData, mediaFile) => {
      emit('update-item', {
        ...props.item,
        media: mediaData,
        mediaFile: mediaFile || null
      })
    }

    const onMediaNoteUpdate = note => {
      emit('update-item', { ...props.item, mediaNote: note })
    }

    const onMediaRemove = () => {
      emit('delete-media', { index: props.index })
    }

    const typeOptions = computed(() => [
      {
        label: i18n.t('form.creatorModeCompose.choices.type.media'),
        value: choiceTypeEnum.MEDIA,
        icon: 'tabler:photo'
      },
      {
        label: i18n.t('form.creatorModeCompose.choices.type.youtube'),
        value: choiceTypeEnum.YOUTUBE,
        icon: 'tabler:brand-youtube'
      },
      {
        label: i18n.t('form.creatorModeCompose.choices.type.text'),
        value: choiceTypeEnum.TEXT,
        icon: 'tabler:pencil'
      }
    ])

    const triggerTitle = computed(() => {
      const option = typeOptions.value.find(opt => opt.value === props.item.type)

      return option ? option.label : ''
    })

    const selectedTypeOption = computed(() => {
      return typeOptions.value.find(opt => opt.value === props.item.type)
    })

    const onTypeChange = option => {
      const newType = option.value
      const currentType = props.item.type

      let hasData = false

      if (currentType === choiceTypeEnum.MEDIA) {
        if (props.item.media || props.item.mediaFile || (props.item.mediaNote && props.item.mediaNote.trim() !== '')) {
          hasData = true
        }
      } else if (currentType === choiceTypeEnum.YOUTUBE) {
        if (props.item.media || (props.item.mediaNote && props.item.mediaNote.trim() !== '')) {
          hasData = true
        }
      } else if (currentType === choiceTypeEnum.TEXT) {
        if (props.item.content && props.item.content.trim() !== '') {
          hasData = true
        }
      }

      if (hasData) {
        Dialog.confirm({
          title: i18n.t('form.creatorModeCompose.choices.changeType.title'),
          message: i18n.t('form.creatorModeCompose.choices.changeType.description'),
          confirmButtonText: i18n.t('form.creatorModeCompose.choices.changeType.confirm'),
          cancelButtonText: i18n.t('form.creatorModeCompose.choices.changeType.cancel')
        })
          .then(() => {
            performTypeChange(newType)
          })
          .catch(() => {})
      } else {
        performTypeChange(newType)
      }
    }

    const performTypeChange = newType => {
      const updatedItem = { ...props.item, type: newType }

      if (newType === choiceTypeEnum.TEXT) {
        updatedItem.media = null
        updatedItem.mediaFile = null
        updatedItem.mediaNote = ''
      } else {
        updatedItem.content = ''

        if (props.item.type !== choiceTypeEnum.TEXT && props.item.type !== newType) {
          updatedItem.media = null
          updatedItem.mediaFile = null
          updatedItem.mediaNote = ''
        }
      }

      emit('update-item', updatedItem)
    }

    return {
      choiceTypeEnum,
      typeOptions,
      triggerTitle,
      selectedTypeOption,
      onTypeChange,
      onMediaUpdate,
      onMediaNoteUpdate,
      onMediaRemove
    }
  }
})
</script>

<style lang="scss" scoped src="./ChoiceItem.scss"></style>
