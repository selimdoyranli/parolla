<template lang="pug">
.room-basic-info
  span.creator-mode-compose-form__fieldsTitle {{ $t('form.creatorModeCompose.roomInformations') }}
  .creator-mode-compose-form__fields
    Field.creator-mode-compose-form__roomTitle(
      v-model="form.roomTitle"
      name="roomTitle"
      :label="$t('form.creatorModeCompose.room.roomTitle.label')"
      :placeholder="$t('form.creatorModeCompose.room.roomTitle.placeholder')"
      maxlength="100"
      show-word-limit
      :rules="[{ required: true, message: $t('form.isRequired', { model: $t('form.creatorModeCompose.room.roomTitle.label') }) }]"
    )

    Cell.creator-mode-compose-form__coverPhotoCell
      template(#title)
        span.creator-mode-compose-form__coverPhotoLabel
          | {{ $t('form.creatorModeCompose.room.coverPhoto.label') }} &nbsp;
          small.creator-mode-compose-form__optionalHint
            | {{ $t('form.optionalHint') }}

      .creator-mode-compose-form__coverPhotoUploader(
        ref="coverPhotoWrapperRef"
        :class="{ 'creator-mode-compose-form__coverPhotoUploader--hasImage': coverPhotoState.hasImage }"
      )
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
            :disable-drag-to-move="isCoverPhotoLocked"
            :disable-scroll-to-zoom="isCoverPhotoLocked"
            :disable-pinch-to-zoom="isCoverPhotoLocked"
            :width="croppaSize.width"
            :height="croppaSize.height"
            :disabled="form.isBusy"
            @file-type-mismatch="handleCoverPhotoTypeMismatch"
            @file-size-exceed="handleCoverPhotoSizeExceed"
            @file-choose="handleCoverPhotoChoose"
            @new-image-drawn="handleCoverPhotoLoaded"
            @zoom="handleCoverPhotoDirty"
            @move="handleCoverPhotoDirty"
            @image-remove="handleCoverPhotoRemove"
          )
        .creator-mode-compose-form__coverPhotoUploaderOverlay(v-if="!coverPhotoState.hasImage")
          AppIcon.creator-mode-compose-form__coverPhotoUploaderIcon(name="tabler:upload" :width="32" :height="32")
          span.creator-mode-compose-form__coverPhotoUploaderTitle
            | {{ $t('form.creatorModeCompose.room.coverPhoto.uploaderTitle') }}
          p.creator-mode-compose-form__coverPhotoUploaderDescription
            | {{ $t('form.creatorModeCompose.room.coverPhoto.uploaderDescription') }}
          small.creator-mode-compose-form__coverPhotoUploaderMeta
            | Max: {{ convertSize(parollaConfig.upload.maxFileSize, { unit: 'mb' }) }} ·
            | {{ parollaConfig.upload.allowedExtensions.map(ext => `.${ext}`).join(', ') }}

      p.creator-mode-compose-form__infoHint(v-if="!coverPhotoState.hasImage")
        | {{ $t('form.creatorModeCompose.room.coverPhoto.hint') }}

    Field.creator-mode-compose-form__description(
      v-model="form.description"
      name="description"
      type="textarea"
      :placeholder="$t('form.creatorModeCompose.room.description.placeholder')"
      autosize
      maxlength="320"
      show-word-limit
    )
      template(#label)
        span {{ $t('form.creatorModeCompose.room.description.label') }} &nbsp;
        small.creator-mode-compose-form__optionalHint
          | {{ $t('form.optionalHint') }}

    .room-choices
      span.room-choices__title {{ $t('form.creatorModeCompose.room.visibility.label') }}
      //- stacked on phones, side by side from tablet up
      .room-choices__grid
        button.room-choice.room-choice--tile(
          v-for="mode in ['public', 'unlisted']"
          :key="mode"
          type="button"
          :class="{ 'room-choice--selected': form.visibilityMode === mode }"
          :disabled="form.isBusy"
          @click="pickVisibility(mode)"
        )
          span.room-choice__icon
            AppIcon(:name="visibilityIcons[mode]" :width="20" :height="20")
          span.room-choice__body
            span.room-choice__name {{ $t(`community.visibilityMode.${mode}`) }}
            span.room-choice__description {{ $t(`community.visibilityMode.${mode}Description`) }}

      //- optional with either visibility: public = lists + the community, unlisted = only the community
      template(v-if="user")
        span.room-choices__title {{ $t('form.creatorModeCompose.room.community.title') }}
        .room-choice(v-if="selectedCommunity")
          CommunityAvatar.room-choice__avatar(:community="selectedCommunity" :size="40")
          span.room-choice__body
            span.room-choice__name {{ selectedCommunity.name }}
            span.room-choice__description(v-if="selectedCommunity.memberCount != null") {{ communityStats(selectedCommunity) }}
          span.room-choices__actions
            button.room-choices__change(type="button" :disabled="form.isBusy" @click="openCommunityDialog")
              | {{ $t('form.creatorModeCompose.room.community.change') }}
            button.room-choices__remove(
              type="button"
              :aria-label="$t('form.creatorModeCompose.room.community.remove')"
              :title="$t('form.creatorModeCompose.room.community.remove')"
              :disabled="form.isBusy"
              @click="clearCommunity"
            )
              AppIcon(name="tabler:x" :width="18" :height="18")
        span.room-choices__note(v-if="selectedCommunity && form.visibilityMode === 'unlisted'")
          | {{ $t('form.creatorModeCompose.room.community.unlistedNote') }}
        template(v-else-if="!selectedCommunity")
          button.room-choice.room-choice--pick(type="button" :disabled="form.isBusy || isCommunityBlocked" @click="openCommunityDialog")
            AppIcon(name="tabler:plus" :width="20" :height="20")
            | {{ $t('form.creatorModeCompose.room.community.pick') }}
          span.room-choices__note(v-if="isCommunityBlocked") {{ $t('form.creatorModeCompose.room.community.anonUnlisted') }}

      // guests are always anonymous, so the choice only exists for players
      template(v-if="user")
        span.room-choices__title {{ $t('form.creatorModeCompose.room.isAnon.label') }}
        .room-choices__grid
          button.room-choice(
            v-for="isAnon in [false, true]"
            :key="String(isAnon)"
            type="button"
            :class="{ 'room-choice--selected': form.isAnon === isAnon }"
            :disabled="form.isBusy"
            @click="pickCreator(isAnon)"
          )
            PlayerAvatar.room-choice__avatar(v-if="!isAnon" :size="40" :user="user")
            span.room-choice__avatar.room-choice__anonAvatar(v-else) A
            span.room-choice__body
              span.room-choice__name {{ isAnon ? $t('form.creatorModeCompose.room.isAnon.anonTitle') : user.username }}
              span.room-choice__description
                | {{ $t(`form.creatorModeCompose.room.isAnon.${isAnon ? 'anonDescription' : 'namedDescription'}`) }}

    Dialog.dialog.room-community-dialog(
      v-model="isCommunityDialogOpen"
      close-on-click-overlay
      get-container="body"
      show-cancel-button
      :title="$t('form.creatorModeCompose.room.community.dialogTitle')"
      :show-confirm-button="false"
      :cancel-button-text="$t('general.close')"
      width="min(92vw, 440px)"
    )
      .room-community-dialog__content
        Loading.room-community-dialog__state(v-if="communityList.isLoading" color="var(--color-brand-02)" size="24")
        .room-community-dialog__state(v-else-if="communityList.error")
          span {{ $t('form.creatorModeCompose.room.community.loadFailed') }}
          button.room-choices__change(type="button" @click="loadCommunities") {{ $t('error.tryAgain') }}
        .room-community-dialog__state(v-else-if="!communityList.items.length")
          | {{ $t('form.creatorModeCompose.room.community.empty') }}
        template(v-else)
          button.room-choice(
            v-for="community in communityList.items"
            :key="community.documentId"
            type="button"
            :class="{ 'room-choice--selected': form.community === community.documentId }"
            @click="pickCommunity(community)"
          )
            CommunityAvatar.room-choice__avatar(:community="community" :size="40")
            span.room-choice__body
              span.room-choice__name {{ community.name }}
              span.room-choice__description {{ communityStats(community) }}

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

    // The hint takes the tag cloud's place until a tag is added
    Cell.creator-mode-compose-form-tags
      .creator-mode-compose-form-tags__tags(v-if="form.tags && form.tags.length > 0")
        template(v-for="tag in form.tags")
          Tag.creator-mode-compose-form-tags__tag(type="primary" closeable @close="onRemoveTag(tag)") {{ tag }}
      p.creator-mode-compose-form__infoHint.creator-mode-compose-form__infoHint--flush(v-else)
        | {{ $t('form.creatorModeCompose.room.tag.hint') }}

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
import { defineComponent, computed, reactive, ref, useContext, useStore, onMounted, onBeforeUnmount } from '@nuxtjs/composition-api'
import { Field, Cell, Button, Tag, Stepper, Toast, Dialog, Loading } from 'vant'
import { communityTransformer } from '@/transformers'
import { quizTypeEnum } from '@/enums/quiz.enum'
import parollaConfig from '@/system/parolla.config'
import convertSize from 'convert-size'

export default defineComponent({
  name: 'RoomBasicInfo',
  components: {
    Field,
    Cell,
    Button,
    Tag,
    Stepper,
    Dialog: Dialog.Component,
    Loading
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
    room: {
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
    const store = useStore()

    const localGameTimeLimitMinutes = computed({
      get: () => props.gameTimeLimitMinutes,
      set: val => emit('update:gameTimeLimitMinutes', val)
    })

    // Owns the croppa instance locally. Parent reaches in via template
    // ref to call generateCoverPhotoBlob() at submit time — see the
    // setup return below.
    const coverPhotoCroppa = ref({})
    const coverPhotoState = reactive({
      hasImage: Boolean(props.form.coverPhoto?.url),
      isDirty: false
    })

    // vue-croppa needs explicit pixel sizes for its canvas buffer. We sync
    // them to the wrapper's measured width so the croppa fills the dashed
    // box on any viewport. Changes here re-create the canvas, but that's
    // acceptable: initial-image reloads from URL on a fresh canvas.
    const coverPhotoWrapperRef = ref(null)
    const croppaSize = reactive({ width: 320, height: 180 })
    let resizeObserver = null

    const updateCroppaSize = () => {
      const el = coverPhotoWrapperRef.value

      if (!el) return
      const w = Math.max(160, Math.floor(el.clientWidth))

      if (Math.abs(croppaSize.width - w) > 2) {
        croppaSize.width = w
        croppaSize.height = Math.floor((w * 9) / 16)
      }
    }

    onMounted(() => {
      updateCroppaSize()

      if (typeof ResizeObserver !== 'undefined' && coverPhotoWrapperRef.value) {
        resizeObserver = new ResizeObserver(() => updateCroppaSize())
        resizeObserver.observe(coverPhotoWrapperRef.value)
      }
    })

    onBeforeUnmount(() => {
      if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
      }
    })

    // Lock pan/zoom while the cropper is showing the server-side initial
    // photo so the user can't accidentally re-crop it on submit. Once
    // they click X (remove) or pick a new file, isDirty flips and the
    // lock releases. Keyed on form.coverPhoto rather than props.room
    // because RoomBasicInfo doesn't receive the original room — only the
    // form, whose coverPhoto field already mirrors the initial value.
    const isCoverPhotoLocked = computed(() => {
      return Boolean(props.form.coverPhoto?.url) && !coverPhotoState.isDirty && coverPhotoState.hasImage
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
      coverPhotoState.isDirty = true
      emit('cover-photo-choose')
    }

    const handleCoverPhotoLoaded = () => {
      coverPhotoState.hasImage = true
    }

    const handleCoverPhotoDirty = () => {
      coverPhotoState.isDirty = true
      emit('cover-photo-dirty')
    }

    const handleCoverPhotoRemove = () => {
      coverPhotoState.hasImage = false
      coverPhotoState.isDirty = true
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
    // looking at the initial image)? Pan/zoom on the initial image counts
    // as a change too — vue-croppa keeps currentIsInitial=true through
    // transforms, so we track our own isDirty flag (mirrors ProfileEditForm).
    const coverPhotoIsCommittable = () => {
      const inst = coverPhotoCroppa.value

      if (!inst) return false
      const hasImage = typeof inst.hasImage === 'function' ? inst.hasImage() : false
      const isInitial = Boolean(inst.currentIsInitial)

      return hasImage && (!isInitial || coverPhotoState.isDirty)
    }

    // Called by the parent after the cover photo step has been attempted
    // at submit time. Mirrors `avatar.isDirty = false` in ProfileEditForm.
    const markCoverPhotoCommitted = () => {
      coverPhotoState.isDirty = false
    }

    // me items are raw: the transformer adds the avatar initials
    const postableCommunities = computed(() => (store.getters['auth/postableCommunities'] || []).map(communityTransformer))
    const visibilityIcons = { public: 'tabler:world', unlisted: 'tabler:lock' }

    // only its owner could share an anonymous unlisted quiz, which would unmask them; useCreatorForm clears the pick
    const isCommunityBlocked = computed(() => props.form.isAnon && props.form.visibilityMode === 'unlisted')

    const pickVisibility = mode => {
      // eslint-disable-next-line vue/no-mutating-props
      if (!props.form.isBusy) props.form.visibilityMode = mode
    }

    const pickCreator = isAnon => {
      // eslint-disable-next-line vue/no-mutating-props
      if (!props.form.isBusy) props.form.isAnon = isAnon
    }

    // the list endpoint carries the counts; the postable getter decides which ones may hold the quiz
    const communityList = reactive({ items: [], isLoading: false, error: null, isLoaded: false })

    const loadCommunities = async () => {
      communityList.isLoading = true
      communityList.error = null

      const results = await Promise.all(
        [{ owned: 1 }, { joined: 1 }].map(query => store.dispatch('community/fetchCommunities', { ...query, pageSize: 50 }))
      )
      const failed = results.find(r => r.error || !r.data)

      communityList.isLoading = false

      if (failed) {
        communityList.error = failed.error || true

        return
      }

      const postableIds = postableCommunities.value.map(c => c.documentId)

      communityList.items = results
        .flatMap(r => r.data.items)
        .filter((c, i, all) => postableIds.includes(c.documentId) && all.findIndex(o => o.documentId === c.documentId) === i)
      communityList.isLoaded = true
    }

    const isCommunityDialogOpen = ref(false)

    const openCommunityDialog = () => {
      isCommunityDialogOpen.value = true

      if (!communityList.isLoaded) loadCommunities()
    }

    const pickCommunity = community => {
      // eslint-disable-next-line vue/no-mutating-props
      props.form.community = community.documentId
      isCommunityDialogOpen.value = false
    }

    const clearCommunity = () => {
      // eslint-disable-next-line vue/no-mutating-props
      props.form.community = null
    }

    // counts come from the fetched list; the getter entry covers the time before it loads
    const selectedCommunity = computed(() => {
      const id = props.form.community

      if (!id) return null

      return communityList.items.find(c => c.documentId === id) || postableCommunities.value.find(c => c.documentId === id) || null
    })

    const communityStats = community =>
      `${i18n.t('community.list.members', { count: community.memberCount })} · ${i18n.t('community.list.posts', {
        count: community.postCount
      })}`

    // edit: preselect the first of my communities that already holds this quiz (re-saving it there is a no-op)
    onMounted(async () => {
      if (!props.user || !props.room?.documentId || !postableCommunities.value.length) return

      loadCommunities()

      const { data } = await store.dispatch('community/fetchSharedIn', { roomDocumentId: props.room.documentId })
      const first = (data?.communityDocumentIds || []).find(id => postableCommunities.value.some(c => c.documentId === id))

      // the user may have picked one while this was loading
      // eslint-disable-next-line vue/no-mutating-props
      if (first && !props.form.community) props.form.community = first
    })

    const onInputTag = val => emit('input-tag', val)
    const onAddTag = () => emit('add-tag')
    const onRemoveTag = tag => emit('remove-tag', tag)

    return {
      localGameTimeLimitMinutes,
      coverPhotoCroppa,
      coverPhotoState,
      isCoverPhotoLocked,
      coverPhotoInitialUrl,
      coverPhotoWrapperRef,
      croppaSize,
      parollaConfig,
      convertSize,
      handleCoverPhotoTypeMismatch,
      handleCoverPhotoSizeExceed,
      handleCoverPhotoChoose,
      handleCoverPhotoLoaded,
      handleCoverPhotoDirty,
      handleCoverPhotoRemove,
      generateCoverPhotoBlob,
      coverPhotoIsCommittable,
      markCoverPhotoCommitted,
      postableCommunities,
      visibilityIcons,
      isCommunityBlocked,
      pickVisibility,
      pickCreator,
      communityList,
      loadCommunities,
      isCommunityDialogOpen,
      openCommunityDialog,
      pickCommunity,
      clearCommunity,
      selectedCommunity,
      communityStats,
      onInputTag,
      onAddTag,
      onRemoveTag,
      quizTypeEnum
    }
  }
})
</script>

<style lang="scss" scoped>
.creator-mode-compose-form__coverPhotoCell {
  flex-direction: column;
  align-items: stretch;

  /* stylelint-disable-next-line selector-pseudo-element-no-unknown */
  ::v-deep .van-cell__title {
    flex: none;
    width: 100%;
    max-width: 100%;
  }

  /* stylelint-disable-next-line selector-pseudo-element-no-unknown */
  ::v-deep .van-cell__value {
    flex: none;
    width: 100%;
    max-width: 100%;
    margin-block-start: 8px;
    color: var(--color-text-01);
    text-align: left;
  }
}

.creator-mode-compose-form__coverPhotoLabel {
  color: var(--color-text-02);
  font-size: 14px;
}

.creator-mode-compose-form__infoHint {
  margin: 8px 0 0;
  padding: 8px 12px;
  color: var(--color-info-01);
  font-size: 13px;
  text-align: left;
  background-color: color-mix(in sRGB, var(--color-info-01) 10%, transparent);
  border-radius: calc(var(--border-radius-01) / 2);

  &--flush {
    margin: 0;
  }
}

// label on its own full-width line so "(isteğe bağlı)" sits right after the word, like the cover photo label
.creator-mode-compose-form__description.van-field {
  /* stylelint-disable-next-line selector-pseudo-element-no-unknown */
  ::v-deep .van-field__label {
    width: 100%;
    max-width: 100%;
  }
}

.creator-mode-compose-form__optionalHint {
  color: var(--color-text-03);
  font-size: 12px;
}

.creator-mode-compose-form__coverPhotoUploader {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  background-color: light-dark(#f2f2f2, #222);
  border: 2px dashed var(--color-border-02);
  border-radius: calc(var(--border-radius-01) / 2);
  cursor: pointer;
  transition: border-color 0.2s var(--motion-01), background-color 0.2s var(--motion-01);

  &:hover {
    background-color: light-dark(#eee, #212121);
    border-color: var(--color-hover-01);
  }

  &--hasImage {
    background-color: transparent;
    border-style: solid;
    cursor: default;

    &:hover {
      border-color: var(--color-border-02);
    }
  }
}

/* vue-croppa puts the .croppa-container class on its root element, which
   is the same node our .coverPhotoCroppa class lives on — so the
   background override has to be a same-element rule, not a descendant
   one (::v-deep .croppa-container never matches here). */
.creator-mode-compose-form__coverPhotoCroppa {
  display: block;
  background-color: light-dark(#f2f2f2, #222);

  /* Remove-button is a real descendant svg, so ::v-deep works here.
     !important is needed because vue-croppa sets top/right inline based
     on its own width/height props (negative offsets, outside the box). */
  /* stylelint-disable-next-line selector-pseudo-element-no-unknown */
  ::v-deep svg.icon-remove {
    top: 4px !important;
    right: 4px !important;
    width: 24px;
    height: 24px;
  }
}

.creator-mode-compose-form__coverPhotoUploaderOverlay {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  justify-content: center;
  padding: 16px;
  text-align: center;
  pointer-events: none;
  inset: 0;
}

.creator-mode-compose-form__coverPhotoUploaderIcon {
  margin-block-end: 4px;
  color: var(--color-icon-01);
}

.creator-mode-compose-form__coverPhotoUploaderTitle {
  color: var(--color-text-01);
  font-weight: 600;
  font-size: 14px;
}

.creator-mode-compose-form__coverPhotoUploaderDescription {
  margin: 0;
  color: var(--color-text-02);
  font-size: 13px;
}

.creator-mode-compose-form__coverPhotoUploaderMeta {
  color: var(--color-text-03);
  font-size: 11px;
}

.room-choices {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background-color: var(--color-ui-02);

  &__title {
    margin-block-start: 8px;
    color: var(--color-text-03);
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;

    &:first-child {
      margin-block-start: 0;
    }
  }

  // equal-height rows: stacked on phones, side by side from tablet up
  &__grid {
    display: grid;
    grid-auto-rows: 1fr;
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;

    @include media-breakpoint-up(tablet) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  &__change {
    flex-shrink: 0;
    padding: 6px 14px;
    color: var(--color-brand-02);
    font: inherit;
    font-weight: 600;
    font-size: 13px;
    background: transparent;
    border: 1px solid var(--color-brand-02);
    border-radius: 999px;
    cursor: pointer;
  }

  &__actions {
    display: flex;
    flex-shrink: 0;
    gap: 4px;
    align-items: center;
  }

  &__remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    color: var(--color-text-03);
    background: transparent;
    border: 0;
    border-radius: 50%;
    cursor: pointer;
  }

  &__note {
    color: var(--color-text-03);
    font-size: 12px;
    line-height: 1.35;
  }
}

.room-choice {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 12px 14px;
  color: var(--color-text-02);
  font: inherit;
  text-align: left;
  background-color: var(--color-ui-01);
  border: 2px solid var(--color-border-02);
  border-radius: calc(var(--border-radius-01) / 2);
  cursor: pointer;
  transition: border-color 0.2s var(--motion-01), background-color 0.2s var(--motion-01);

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  &__icon,
  &__avatar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
  }

  &__icon {
    color: var(--color-text-03);
    background-color: var(--color-ui-03);
    border-radius: calc(var(--border-radius-01) / 2);
  }

  &__anonAvatar {
    color: var(--color-text-04);
    font-weight: 700;
    font-size: 16px;
    background-color: var(--color-text-03);
    border-radius: 50%;
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__name {
    overflow: hidden;
    color: var(--color-text-01);
    font-weight: 600;
    font-size: 15px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__description {
    color: var(--color-text-03);
    font-size: 13px;
    line-height: 1.35;
  }

  // grid tiles from tablet up: text on top, the icon small in the top-right corner
  &--tile {
    @include media-breakpoint-up(tablet) {
      position: relative;
      align-items: flex-start;
      height: 100%;
      padding-inline-end: 36px;

      .room-choice__icon {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 24px;
        height: 24px;
        background: transparent;
      }

      .room-choice__name {
        white-space: normal;
      }
    }
  }

  &--pick {
    gap: 8px;
    justify-content: center;
    color: var(--color-text-02);
    font-weight: 600;
    border-color: var(--color-border-02);
    border-style: dashed;

    &:not(:disabled):hover {
      background-color: var(--color-hover-01);
    }
  }

  &--selected {
    background-color: color-mix(in sRGB, var(--color-brand-02) 8%, var(--color-ui-01));
    border-color: var(--color-brand-02);

    .room-choice__name {
      color: var(--color-brand-02);
    }

    .room-choice__icon {
      color: var(--color-brand-02);
      background-color: color-mix(in sRGB, var(--color-brand-02) 15%, transparent);
    }
  }
}

.room-community-dialog__content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 60vh;
  padding: 16px;
  overflow-y: auto;
}

.room-community-dialog__state {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  align-self: center;
  padding: 16px;
  color: var(--color-text-03);
  text-align: center;
}
</style>
