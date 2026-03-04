<template lang="pug">
.page.guess-the-song-page
  GuessTheSongScene
</template>

<script>
import { defineComponent, useContext, onMounted, useMeta } from '@nuxtjs/composition-api'

export default defineComponent({
  layout: 'Default/Default.layout',
  setup() {
    const { i18n } = useContext()

    const { layoutScrollToTop } = useScroll()

    onMounted(() => {
      layoutScrollToTop()
    })

    useMeta(() => ({
      title: `${i18n.t('seo.musicMode.guessTheSong.title')} - ${i18n.t('seo.main.title')}`,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: i18n.t('seo.musicMode.guessTheSong.description')
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content: `${i18n.t('seo.musicMode.guessTheSong.title')} - ${i18n.t('seo.main.title')}`
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: i18n.t('seo.musicMode.guessTheSong.description')
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: i18n.t('seo.musicMode.guessTheSong.description')
        },
        {
          hid: 'keywords',
          name: 'keywords',
          content: i18n.t('seo.musicMode.guessTheSong.keywords')
        }
      ]
    }))
  },
  head: {}
})
</script>

<style lang="scss" src="./GuessTheSong.page.scss"></style>
