<template lang="pug">
Cell.community-compose-form__mediaCell
  template(#title)
    | {{ $t(`community.form.${field}.label`) }} &nbsp;
    small.community-compose-form__optionalHint {{ $t('form.optionalHint') }}
  .community-compose-form__picker(
    ref="wrapperRef"
    :class="[`community-compose-form__picker--${shape}`, { 'community-compose-form__picker--hasImage': hasImage }]"
  )
    client-only
      croppa.community-compose-form__croppa(
        v-model="croppa"
        placeholder
        initial-size="cover"
        :accept="parollaConfig.upload.allowedMimeTypes.join(',')"
        :initial-image="initialUrl"
        :quality="quality"
        :prevent-white-space="true"
        :file-size-limit="parollaConfig.upload.maxFileSize"
        :zoom-speed="10"
        :disable-drag-to-move="isLocked"
        :disable-scroll-to-zoom="isLocked"
        :disable-pinch-to-zoom="isLocked"
        :width="size.width"
        :height="size.height"
        @file-type-mismatch="onTypeMismatch"
        @file-size-exceed="onOversize"
        @file-choose="onChoose"
        @new-image-drawn="onDrawn"
        @zoom="cut"
        @move="cut"
        @image-remove="onRemove"
      )
    .community-compose-form__pickerOverlay(v-if="!hasImage")
      AppIcon.community-compose-form__pickerIcon(name="tabler:upload" :width="28" :height="28")
      span.community-compose-form__pickerTitle {{ $t(`community.form.${field}.uploaderTitle`) }}
      p.community-compose-form__pickerDescription {{ $t(`community.form.${field}.hint`) }}
      small.community-compose-form__pickerMeta
        | Max: {{ convertSize(parollaConfig.upload.maxFileSize, { unit: 'mb' }) }} ·
        | {{ parollaConfig.upload.allowedExtensions.map(ext => `.${ext}`).join(', ') }}
</template>

<script>
import { defineComponent, ref, reactive, computed, onMounted, onBeforeUnmount, useContext } from '@nuxtjs/composition-api'
import { Cell, Notify } from 'vant'
import convertSize from 'convert-size'
import parollaConfig from '@/system/parolla.config'

// output size of the cropped image: avatar 1:1, cover 16:9
const OUTPUT_WIDTH = { avatar: 512, cover: 1600 }
const AVATAR_BOX = 200

export default defineComponent({
  name: 'MediaPicker',
  components: { Cell },
  props: {
    media: { type: Object, required: true },
    field: { type: String, required: true },
    shape: { type: String, required: true, validator: value => ['avatar', 'cover'].includes(value) },
    // already-saved image url (edit mode)
    current: { type: String, default: null }
  },
  setup(props) {
    const { i18n } = useContext()

    const croppa = ref({})
    const wrapperRef = ref(null)
    // the wizard unmounts this step: a crop made earlier comes back as the initial image
    const picked = props.media[props.field]
    const hasImage = ref(Boolean(picked || props.current))
    // a file picked on this mount: only then is the canvas cut and uploaded
    const isChosen = ref(false)
    // the initial image is only shown (a saved image may be CORS-tainted); pick a new file to change it
    const isLocked = computed(() => hasImage.value && !isChosen.value)
    // cache-bust so the canvas loads the saved image with CORS (same trick as RoomBasicInfo)
    const initialUrl = picked ? picked.url : props.current ? `${props.current}?v=${Date.now()}` : null

    const size = reactive({ width: AVATAR_BOX, height: AVATAR_BOX })
    const quality = computed(() => OUTPUT_WIDTH[props.shape] / size.width)
    let resizeObserver = null

    // the cover canvas follows the wrapper width; the avatar box is fixed
    const updateSize = () => {
      if (props.shape !== 'cover' || !wrapperRef.value) return

      const width = Math.max(160, Math.floor(wrapperRef.value.clientWidth))

      if (Math.abs(size.width - width) > 2) {
        size.width = width
        size.height = Math.floor((width * 9) / 16)
      }
    }

    onMounted(() => {
      updateSize()

      if (props.shape === 'cover' && typeof ResizeObserver !== 'undefined' && wrapperRef.value) {
        resizeObserver = new ResizeObserver(updateSize)
        resizeObserver.observe(wrapperRef.value)
      }
    })

    // media is the form's shared reactive picks ({ file, url }, uploaded after the text fields are saved)
    const setPick = value => {
      const previous = props.media[props.field]?.url

      // eslint-disable-next-line vue/no-mutating-props
      props.media[props.field] = value

      if (previous?.startsWith('blob:') && previous !== value?.url) URL.revokeObjectURL(previous)
    }

    // re-cut the canvas after each pan/zoom settles; png keeps a transparent avatar transparent, the cover is a photo
    let cutTimer = null
    let lastCut = Promise.resolve()
    const cutNow = () => {
      clearTimeout(cutTimer)
      cutTimer = null

      if (!isChosen.value || typeof croppa.value.generateBlob !== 'function') return lastCut

      lastCut = new Promise(resolve =>
        croppa.value.generateBlob(
          file => {
            if (file) setPick({ file, url: URL.createObjectURL(file) })

            resolve()
          },
          props.shape === 'avatar' ? 'image/png' : 'image/jpeg',
          0.9
        )
      )

      return lastCut
    }
    const cut = () => {
      clearTimeout(cutTimer)
      cutTimer = setTimeout(cutNow, 300)
    }

    // the form awaits this before uploading so a crop still in its debounce / toBlob is not lost
    // eslint-disable-next-line vue/no-mutating-props
    props.media.flush[props.field] = () => (cutTimer ? cutNow() : lastCut)

    onBeforeUnmount(() => {
      resizeObserver?.disconnect()

      // leaving the step mid-gesture: keep the latest crop
      if (cutTimer) cutNow()
    })

    const onChoose = () => {
      isChosen.value = true
    }
    const onDrawn = () => {
      hasImage.value = true
      cutNow()
    }
    const onRemove = () => {
      hasImage.value = false
      isChosen.value = false
      setPick(null)
    }
    const onTypeMismatch = () => Notify({ message: i18n.t('error.mediaError.mimeTypeNotAllowed'), type: 'warning' })
    const onOversize = () => Notify({ message: i18n.t('error.mediaError.limitExceeded'), type: 'warning' })

    return {
      convertSize,
      parollaConfig,
      croppa,
      wrapperRef,
      hasImage,
      isLocked,
      initialUrl,
      size,
      quality,
      onChoose,
      onDrawn,
      cut,
      onRemove,
      onTypeMismatch,
      onOversize
    }
  }
})
</script>
