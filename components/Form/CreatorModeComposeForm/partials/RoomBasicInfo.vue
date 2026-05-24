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

    .creator-mode-compose-form__coverPhoto
      span.creator-mode-compose-form__coverPhotoLabel
        | {{ $t('form.creatorModeCompose.room.coverPhoto.label') }} &nbsp;
        small.creator-mode-compose-form__optionalHint
          | ({{ $t('form.optionalHint') }})

      .creator-mode-compose-form__coverPhotoCropperBox
        client-only
          croppa.creator-mode-compose-form__coverPhotoCroppa(
            v-model="coverPhotoCroppa"
            placeholder
            accept="image/jpeg,image/png,image/gif,image/webp"
            initial-size="cover"
            :initial-image="coverPhotoInitialUrl"
            :quality="2"
            :prevent-white-space="true"
            :file-size-limit="parollaConfig.upload.maxFileSize"
            :show-remove-button="!form.isBusy"
            :zoom-speed="10"
            :width="320"
            :height="180"
            :disabled="form.isBusy"
            @file-type-mismatch="handleCoverPhotoTypeMismatch"
            @file-size-exceed="handleCoverPhotoSizeExceed"
            @file-choose="handleCoverPhotoChoose"
            @new-image-drawn="handleCoverPhotoLoaded"
            @zoom="handleCoverPhotoDirty"
            @move="handleCoverPhotoDirty"
            @image-remove="handleCoverPhotoRemove"
          )
        span.creator-mode-compose-form__coverPhotoUploadIcon(v-if="!coverPhotoState.hasImage")
          AppIcon(name="tabler:photo-plus" color="var(--color-text-02)" :width="32" :height="32")

    Field.creator-mode-compose-form__description(
      v-model="form.description"
      name="description"
      type="textarea"
      :placeholder="$t('form.creatorModeCompose.room.description.placeholder')"
      autosize
      maxlength="256"
      show-word-limit
    )
      template(#label)
        span {{ $t('form.creatorModeCompose.room.description.label') }} &nbsp;
        small.creator-mode-compose-form__optionalHint
          | ({{ $t('form.optionalHint') }})

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

    Cell.creator-mode-compose-form__gameTimeLimit(v-if="form.quizType === quizTypeEnum.QA")
      template(#title)
        span {{ $t('form.creatorModeCompose.room.gameTimeLimit.label') }}

      template(#right-icon)
        .game-time-limit-steppers
          .game-time-limit-stepper
            Stepper(v-model="localGameTimeLimitMinutes" :min="1" :max="60" :step="1" :integer="true")
            span.game-time-limit-label {{ $t('form.creatorModeCompose.room.gameTimeLimit.minutes') }}
</template>

<script>
import { defineComponent, computed, reactive, ref, useContext } from '@nuxtjs/composition-api'
import { Field, Cell, Switch, Button, Tag, Stepper, Toast } from 'vant'
import { quizTypeEnum } from '@/enums/quiz.enum'
import parollaConfig from '@/system/parolla.config'

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
    const { i18n } = useContext()

    const localGameTimeLimitMinutes = computed({
      get: () => props.gameTimeLimitMinutes,
      set: val => emit('update:gameTimeLimitMinutes', val)
    })

    // Owns the croppa instance locally. Parent reaches in via template
    // ref to call generateCoverPhotoBlob() at submit time — see the
    // setup return below.
    const coverPhotoCroppa = ref({})
    const coverPhotoState = reactive({
      hasImage: Boolean(props.form.coverPhoto?.url)
    })

    // Cache-bust to dodge CORS taint on the canvas — same trick as ProfileEditForm
    const coverPhotoInitialUrl = computed(() => {
      const url = props.form.coverPhoto?.url

      if (!url) return null

      return `${url}?v=${Date.now()}`
    })

    const handleCoverPhotoTypeMismatch = () => {
      Toast.fail({
        message: i18n.t('form.creatorModeCompose.room.coverPhoto.error.mimeTypeNotAllowed'),
        duration: 2500
      })
    }

    const handleCoverPhotoSizeExceed = () => {
      Toast.fail({
        message: i18n.t('form.creatorModeCompose.room.coverPhoto.error.sizeLimitExceeded'),
        duration: 2500
      })
    }

    const handleCoverPhotoChoose = () => {
      emit('cover-photo-choose')
    }

    const handleCoverPhotoLoaded = () => {
      coverPhotoState.hasImage = true
    }

    const handleCoverPhotoDirty = () => {
      emit('cover-photo-dirty')
    }

    const handleCoverPhotoRemove = () => {
      coverPhotoState.hasImage = false
      emit('cover-photo-remove')
    }

    // Snapshot the current croppa canvas as a 16:9 JPEG blob. Parent calls
    // this through the template ref before submitting.
    const generateCoverPhotoBlob = () => {
      return new Promise(resolve => {
        const inst = coverPhotoCroppa.value

        if (!inst || typeof inst.generateBlob !== 'function') {
          resolve(null)

          return
        }
        inst.generateBlob(blob => resolve(blob), 'image/jpeg', 0.9)
      })
    }

    // Helper for parent: did the user actually touch the photo (vs. just
    // looking at the initial image)?
    const coverPhotoIsCommittable = () => {
      const inst = coverPhotoCroppa.value

      if (!inst) return false
      const hasImage = typeof inst.hasImage === 'function' ? inst.hasImage() : false
      const isInitial = Boolean(inst.currentIsInitial)

      return hasImage && !isInitial
    }

    const onInputTag = val => emit('input-tag', val)
    const onAddTag = () => emit('add-tag')
    const onRemoveTag = tag => emit('remove-tag', tag)

    return {
      localGameTimeLimitMinutes,
      coverPhotoCroppa,
      coverPhotoState,
      coverPhotoInitialUrl,
      parollaConfig,
      handleCoverPhotoTypeMismatch,
      handleCoverPhotoSizeExceed,
      handleCoverPhotoChoose,
      handleCoverPhotoLoaded,
      handleCoverPhotoDirty,
      handleCoverPhotoRemove,
      generateCoverPhotoBlob,
      coverPhotoIsCommittable,
      onInputTag,
      onAddTag,
      onRemoveTag,
      quizTypeEnum
    }
  }
})
</script>

<style lang="scss" scoped>
.creator-mode-compose-form__coverPhoto {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
}

.creator-mode-compose-form__coverPhotoLabel {
  color: var(--color-text-02);
  font-size: 14px;
}

.creator-mode-compose-form__optionalHint {
  color: var(--color-text-03);
  font-size: 12px;
}

.creator-mode-compose-form__coverPhotoCropperBox {
  position: relative;
  width: 320px;
  max-width: 100%;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  background: var(--color-bg-03);
  border-radius: 12px;
}

.creator-mode-compose-form__coverPhotoUploadIcon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
</style>
