<template lang="pug">
.app-download-banner(v-if="!isWebView")
  AppIcon.app-download-banner__icon(name="tabler:gift" :width="24" :height="24")
  p.app-download-banner__text {{ $t('download.banner') }}
  .app-download-banner__buttons
    a.app-download-banner__button(v-for="s in stores" :key="s.key" rel="noopener" :href="s.url" target="_blank")
      AppIcon(:name="s.icon" :width="16" :height="16")
      span {{ stores.length > 1 ? s.label : $t('download.cta') }}
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import { APP_STORE_URL, PLAY_STORE_URL } from '@/system/constant'

const APP_STORE = { key: 'appStore', url: APP_STORE_URL, icon: 'logos:apple-app-store', label: 'App Store' }
const PLAY_STORE = { key: 'playStore', url: PLAY_STORE_URL, icon: 'logos:google-play-icon', label: 'Google Play' }

export default defineComponent({
  setup() {
    const { isWebView } = useNativeBridge()

    // phones go straight to their own store (the store link opens the store app); desktop gets both
    const ua = window.navigator.userAgent
    const isIos = /iPad|iPhone|iPod/.test(ua) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
    const stores = isIos ? [APP_STORE] : /android/i.test(ua) ? [PLAY_STORE] : [APP_STORE, PLAY_STORE]

    return { isWebView, stores }
  }
})
</script>

<style lang="scss" src="./AppDownloadBanner.component.scss"></style>
