<template lang="pug">
.app-logo(:class="`app-logo--${type}`")
  NuxtLink.app-logo-link(:to="localePath('/')" :title="APP_NAME")
    span.app-logo-title(v-if="type === 'title'") {{ APP_NAME }}
    img.app-logo-circle(
      v-else
      src="/img/core/logo.webp"
      fetchPriority="high"
      :alt="$t('seo.main.title')"
      :style="`width: ${width}px; height: ${height}px;`"
    )
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import { APP_NAME } from '@/system/constant'

export default defineComponent({
  props: {
    type: {
      type: String,
      required: false,
      default: 'default'
    },
    width: {
      type: Number,
      required: false,
      default: 128
    },
    height: {
      type: Number,
      required: false,
      default: 128
    },
    letterSize: {
      type: Number,
      required: false,
      default: 48
    }
  },
  setup() {
    return {
      APP_NAME
    }
  }
})
</script>

<style lang="scss" src="./AppLogo.component.scss"></style>
