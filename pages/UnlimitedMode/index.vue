<template lang="pug">
.page.unlimited-mode-page
  // Game Scene
  UnlimitedModeGameScene
</template>

<script>
import { defineComponent, useContext, useMeta } from '@nuxtjs/composition-api'

export default defineComponent({
  layout: 'Default/Default.layout',
  setup() {
    const { i18n, redirect, localePath } = useContext()

    if (i18n.locale !== i18n.defaultLocale) {
      redirect(localePath({ name: 'Main' }))
    }

    useMeta(() => ({
      title: `${i18n.t('seo.unlimitedMode.title')} - ${i18n.t('seo.main.title')}`,
      description: i18n.t('seo.unlimitedMode.description'),
      meta: [
        {
          hid: 'og:title',
          name: 'og:title',
          content: `${i18n.t('seo.unlimitedMode.title')} - ${i18n.t('seo.main.title')}`
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: i18n.t('seo.unlimitedMode.description')
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: i18n.t('seo.unlimitedMode.description')
        }
      ]
    }))
  },
  head: {}
})
</script>

<style lang="scss" src="./UnlimitedMode.page.scss"></style>
