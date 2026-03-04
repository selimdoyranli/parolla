<template lang="pug">
.page.wordblock-mode-page
  WordblockModeScene(:charLength="charLength")
</template>

<script>
import { defineComponent, useContext, useMeta, computed } from '@nuxtjs/composition-api'
import { WORDBLOCK_AVAILABLE_LENGTHS } from '@/system/constant'

export default defineComponent({
  layout: 'Default/Default.layout',
  setup() {
    const { i18n, route, redirect, app } = useContext()

    const charLength = computed(() => {
      const len = parseInt(route.value.params.charLength)

      return isNaN(len) ? 5 : len
    })

    if (!WORDBLOCK_AVAILABLE_LENGTHS.includes(charLength.value)) {
      if (process.client) {
        redirect(app.localePath('WordblockMode'))
      } else {
        redirect(302, app.localePath('WordblockMode'))
      }
    }

    useMeta(() => ({
      title: `${i18n.t('seo.wordblockMode.title', { charLength: charLength.value })} - ${i18n.t('seo.main.title')}`,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: i18n.t('seo.wordblockMode.description', { charLength: charLength.value })
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content: `${i18n.t('seo.wordblockMode.title', { charLength: charLength.value })} - ${i18n.t('seo.main.title')}`
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: i18n.t('seo.wordblockMode.description', { charLength: charLength.value })
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: i18n.t('seo.wordblockMode.description', { charLength: charLength.value })
        },
        {
          hid: 'keywords',
          name: 'keywords',
          content: i18n.t('seo.wordblockMode.keywords')
        }
      ]
    }))

    return {
      charLength
    }
  },
  head: {}
})
</script>

<style lang="scss" src="./WordblockMode.page.scss"></style>
