<template lang="pug">
.page.music-mode-page
</template>

<script>
import { defineComponent, useContext } from '@nuxtjs/composition-api'

export default defineComponent({
  layout: 'Default/Default.layout',
  setup() {
    const { i18n } = useContext()
  }
})
</script>

<style lang="scss" src="./MusicMode.page.scss"></style>
