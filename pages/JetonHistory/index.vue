<template lang="pug">
.page.history-page
  JetonHistoryView
</template>

<script>
import { defineComponent, useContext, useMeta } from '@nuxtjs/composition-api'

export default defineComponent({
  layout: 'Default/Default.layout',
  setup() {
    const { i18n } = useContext()

    useMeta(() => ({ title: `${i18n.t('economy.history.title')} - ${i18n.t('seo.main.title')}` }))
  },
  head: {}
})
</script>
