<template lang="pug">
.page.legal-page
  LegalDocument(:doc="doc")
</template>

<script>
import { defineComponent, computed, useContext, useMeta } from '@nuxtjs/composition-api'
import trDoc from '~/content/legal/tr/privacy-policy.md'
import enDoc from '~/content/legal/en/privacy-policy.md'

export default defineComponent({
  layout: 'Default/Default.layout',
  setup() {
    const { i18n } = useContext()

    const doc = computed(() => (i18n.locale === 'en' ? enDoc : trDoc))

    useMeta(() => ({
      title: `${doc.value.attributes.title} - ${i18n.t('seo.main.title')}`,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: doc.value.attributes.description
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content: `${doc.value.attributes.title} - ${i18n.t('seo.main.title')}`
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: doc.value.attributes.description
        }
      ]
    }))

    return { doc }
  },
  head: {}
})
</script>
