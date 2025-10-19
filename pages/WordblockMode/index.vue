<template lang="pug">
.page.wordblock-mode-page
  WordblockScene
</template>

<script>
import { defineComponent, useMeta } from '@nuxtjs/composition-api'

export default defineComponent({
  layout: 'Default/Default.layout',
  setup() {
    useMeta(() => ({
      title: 'parolla - Kelime oyunu - Kelimeblok',
      description: 'Günlük kelimeyi tahmin et',
      meta: [
        {
          hid: 'og:title',
          name: 'og:title',
          content: 'parolla - Kelime oyunu - Kelimeblok'
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: 'Günlük kelimeyi tahmin et'
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: 'Günlük kelimeyi tahmin et'
        }
      ]
    }))
  },
  head: {}
})
</script>

<style lang="scss" src="./WordblockMode.page.scss"></style>
