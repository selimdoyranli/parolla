<template lang="pug">
.page.wordblock-mode-page
  WordblockModeScene
</template>

<script>
import { defineComponent, useContext, useMeta } from '@nuxtjs/composition-api'

export default defineComponent({
  layout: 'Default/Default.layout',
  setup() {
    const { i18n } = useContext()

    useMeta(() => ({
      title: `${i18n.t('seo.wordblockMode.title')} - ${i18n.t('seo.main.title')}`,
      description: i18n.t('seo.wordblockMode.description'),
      meta: [
        {
          hid: 'og:title',
          name: 'og:title',
          content: `${i18n.t('seo.wordblockMode.title')} - ${i18n.t('seo.main.title')}`
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: i18n.t('seo.wordblockMode.description')
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: i18n.t('seo.wordblockMode.description')
        }
      ]
    }))
  },
  head: {}
})
</script>

<style lang="scss" src="./WordblockMode.page.scss"></style>
