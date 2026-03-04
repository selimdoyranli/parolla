<template lang="pug">
.page.wordblock-mode-page
  WordblockModeScene(:charLength="5")
</template>

<script>
import { defineComponent, useContext, useMeta } from '@nuxtjs/composition-api'

export default defineComponent({
  layout: 'Default/Default.layout',
  setup() {
    const { i18n } = useContext()

    useMeta(() => ({
      title: `${i18n.t('seo.wordblockMode.title', { charLength: 5 })} - ${i18n.t('seo.main.title')}`,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: i18n.t('seo.wordblockMode.description', { charLength: 5 })
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content: `${i18n.t('seo.wordblockMode.title', { charLength: 5 })} - ${i18n.t('seo.main.title')}`
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: i18n.t('seo.wordblockMode.description', { charLength: 5 })
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: i18n.t('seo.wordblockMode.description', { charLength: 5 })
        },
        {
          hid: 'keywords',
          name: 'keywords',
          content: i18n.t('seo.wordblockMode.keywords')
        }
      ]
    }))
  },
  head: {}
})
</script>

<style lang="scss" src="./WordblockMode.page.scss"></style>
