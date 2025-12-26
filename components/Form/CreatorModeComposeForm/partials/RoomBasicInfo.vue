<template lang="pug">
.room-basic-info
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

    template(v-if="user")
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
      @input="onInputTag"
      @keydown.enter.prevent="onAddTag"
    )
      template(#button)
        Button(
          type="info"
          native-type="button"
          round
          size="small"
          :disabled="form.tag.length <= 0 || form.tags.length >= 5"
          @click="onAddTag"
        )
          | +

    Cell.creator-mode-compose-form-tags(v-if="form.tags && form.tags.length > 0")
      .creator-mode-compose-form-tags__tags
        template(v-for="tag in form.tags")
          Tag.creator-mode-compose-form-tags__tag(type="primary" closeable @close="onRemoveTag(tag)") {{ tag }}

    Cell.creator-mode-compose-form__gameTimeLimit
      template(#title)
        span {{ $t('form.creatorModeCompose.room.gameTimeLimit.label') }}

      template(#right-icon)
        .game-time-limit-steppers
          .game-time-limit-stepper
            Stepper(v-model="localGameTimeLimitMinutes" :min="1" :max="60" :step="1" :integer="true")
            span.game-time-limit-label {{ $t('form.creatorModeCompose.room.gameTimeLimit.minutes') }}
</template>

<script>
import { defineComponent, computed } from '@nuxtjs/composition-api'
import { Field, Cell, Switch, Button, Tag, Stepper } from 'vant'

export default defineComponent({
  name: 'RoomBasicInfo',
  components: {
    Field,
    Cell,
    VanSwitch: Switch,
    Button,
    Tag,
    Stepper
  },
  props: {
    form: {
      type: Object,
      required: true
    },
    user: {
      type: Object,
      default: null
    },
    gameTimeLimitMinutes: {
      type: Number,
      required: true
    }
  },
  setup(props, { emit }) {
    const localGameTimeLimitMinutes = computed({
      get: () => props.gameTimeLimitMinutes,
      set: val => emit('update:gameTimeLimitMinutes', val)
    })

    const onInputTag = val => emit('input-tag', val)
    const onAddTag = () => emit('add-tag')
    const onRemoveTag = tag => emit('remove-tag', tag)

    return {
      localGameTimeLimitMinutes,
      onInputTag,
      onAddTag,
      onRemoveTag
    }
  }
})
</script>
