<template lang="pug">
.community-compose-form__section
  label {{ label }}
  Uploader(
    :max-size="parollaConfig.upload.maxFileSize"
    :accept="parollaConfig.upload.allowedMimeTypes.join(',')"
    :preview-image="false"
    :before-read="isAllowedType"
    :after-read="onRead"
    @oversize="onOversize"
  )
    .community-compose-form__picker(:class="`community-compose-form__picker--${shape}`")
      img.community-compose-form__picker-image(v-if="media[field]" :src="media[field].url" alt)
      img.community-compose-form__picker-image(v-else-if="current" :src="current" alt)
      AppIcon(v-else name="tabler:upload" :width="28" :height="28")
  small.community-compose-form__media-hint {{ hint }}
</template>

<script>
import { defineComponent, useContext } from '@nuxtjs/composition-api'
import { Uploader, Notify } from 'vant'
import parollaConfig from '@/system/parolla.config'

export default defineComponent({
  name: 'MediaPicker',
  components: { Uploader },
  props: {
    media: { type: Object, required: true },
    field: { type: String, required: true },
    shape: { type: String, required: true },
    label: { type: String, required: true },
    hint: { type: String, required: true },
    // already-saved image url (edit mode)
    current: { type: String, default: null }
  },
  setup(props) {
    const { i18n } = useContext()

    const isAllowedType = file => {
      const ok = parollaConfig.upload.allowedMimeTypes.includes(file.type)

      if (!ok) Notify({ message: i18n.t('error.mediaError.mimeTypeNotAllowed'), type: 'warning' })

      return ok
    }
    const onRead = ({ file, content }) => {
      // media is the form's shared reactive picks (mirrors how the house forms edit `form` props)
      // eslint-disable-next-line vue/no-mutating-props
      props.media[props.field] = { file, url: content }
    }
    const onOversize = () => Notify({ message: i18n.t('error.mediaError.limitExceeded'), type: 'warning' })

    return { parollaConfig, isAllowedType, onRead, onOversize }
  }
})
</script>
