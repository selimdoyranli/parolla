<template lang="pug">
.page.music-mode-page
  MusicModeScene
</template>

<script>
import { defineComponent, useContext, useMeta } from '@nuxtjs/composition-api'

export default defineComponent({
  layout: 'Default/Default.layout',
  setup() {
    const { i18n } = useContext()

    useMeta(() => ({
      title: `${i18n.t('seo.musicMode.title')} - ${i18n.t('seo.main.title')}`,
      description: i18n.t('seo.musicMode.description'),
      meta: [
        {
          hid: 'og:title',
          name: 'og:title',
          content: `${i18n.t('seo.musicMode.title')} - ${i18n.t('seo.main.title')}`
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: i18n.t('seo.musicMode.description')
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: i18n.t('seo.musicMode.description')
        },
        {
          hid: 'keywords',
          name: 'keywords',
          content: i18n.t('seo.musicMode.keywords')
        }
      ]
    }))
  },
  head: {}
})
</script>

<style lang="scss" src="./MusicMode.page.scss"></style>
