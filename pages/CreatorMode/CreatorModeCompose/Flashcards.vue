<template lang="pug">
.page.creator-mode-compose-page
  CreatorModeComposeForm
</template>

<script>
import { defineComponent, useContext, useMeta } from '@nuxtjs/composition-api'

export default defineComponent({
  layout: 'Default/Default.layout',
  middleware: ['auth-control'],
  setup() {
    const { i18n } = useContext()

    useMeta(() => ({
      title: `${i18n.t('seo.creatorModeComposeFlashcards.title')} - ${i18n.t('seo.main.title')}`,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: i18n.t('seo.creatorModeComposeFlashcards.description')
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content: `${i18n.t('seo.creatorModeComposeFlashcards.title')} - ${i18n.t('seo.main.title')}`
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: `${i18n.t('seo.creatorModeComposeFlashcards.title')} - ${i18n.t('seo.main.title')}`
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: i18n.t('seo.creatorModeComposeFlashcards.description')
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: i18n.t('seo.creatorModeComposeFlashcards.description')
        },
        {
          hid: 'keywords',
          name: 'keywords',
          content: i18n.t('seo.creatorModeComposeFlashcards.keywords')
        }
      ]
    }))
  },
  head: {}
})
</script>

<style lang="scss" src="./CreatorModeCompose.page.scss"></style>
