<template lang="pug">
.page.knowledge-kingdom-page
  KnowledgeKingdomGameScene
</template>

<script>
import { defineComponent, useContext, useMeta } from '@nuxtjs/composition-api'

export default defineComponent({
  layout: 'Default/Default.layout',
  setup() {
    const { i18n } = useContext()

    useMeta(() => ({
      title: `${i18n.t('seo.tycoon.knowledgeKingdom.title')} - ${i18n.t('seo.main.title')}`,
      description: i18n.t('seo.tycoon.knowledgeKingdom.description'),
      meta: [
        {
          hid: 'og:title',
          name: 'og:title',
          content: `${i18n.t('seo.tycoon.knowledgeKingdom.title')} - ${i18n.t('seo.main.title')}`
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: i18n.t('seo.tycoon.knowledgeKingdom.description')
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: i18n.t('seo.tycoon.knowledgeKingdom.description')
        },
        {
          hid: 'keywords',
          name: 'keywords',
          content: i18n.t('seo.tycoon.knowledgeKingdom.keywords')
        }
      ]
    }))
  },
  head: {}
})
</script>

<style lang="scss" src="./KnowledgeKingdom.page.scss"></style>
