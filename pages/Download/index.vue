<template lang="pug">
.page.download-page
  img.download-page__logo(src="/img/core/logo.webp" :alt="APP_NAME" width="96" height="96")
  h1.download-page__title {{ $t('download.title') }}
  p.download-page__subtitle {{ $t('download.subtitle') }}
  .download-page__buttons
    a.download-page__button(rel="noopener" :href="APP_STORE_URL" target="_blank")
      AppIcon(name="logos:apple-app-store" :width="28" :height="28")
      span
        small {{ $t('download.hint') }}
        | App Store
    a.download-page__button(rel="noopener" :href="PLAY_STORE_URL" target="_blank")
      AppIcon(name="logos:google-play-icon" :width="28" :height="28")
      span
        small {{ $t('download.hint') }}
        | Google Play
</template>

<script>
import { defineComponent, useContext, useMeta } from '@nuxtjs/composition-api'
import { APP_NAME, APP_STORE_URL, PLAY_STORE_URL } from '@/system/constant'

export default defineComponent({
  layout: 'Default/Default.layout',
  setup() {
    const { i18n } = useContext()

    useMeta(() => ({
      title: `${i18n.t('seo.download.title')} - ${i18n.t('seo.main.title')}`,
      meta: [
        { hid: 'description', name: 'description', content: i18n.t('seo.download.description') },
        { hid: 'keywords', name: 'keywords', content: i18n.t('seo.download.keywords') },
        { hid: 'og:title', name: 'og:title', content: `${i18n.t('seo.download.title')} - ${i18n.t('seo.main.title')}` },
        { hid: 'og:description', name: 'og:description', content: i18n.t('seo.download.description') },
        { hid: 'twitter:description', name: 'twitter:description', content: i18n.t('seo.download.description') }
      ]
    }))

    return { APP_NAME, APP_STORE_URL, PLAY_STORE_URL }
  },
  head: {}
})
</script>

<style lang="scss" src="./Download.page.scss"></style>
