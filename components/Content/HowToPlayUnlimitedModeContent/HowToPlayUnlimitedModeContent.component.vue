<template lang="pug">
.how-to-play-unlimited-mode-content
  i18n(tag="p" path="dialog.howToPlay.body")
    template(#description)
      div(v-html="$t('dialog.howToPlay.description')")
    template(#extra)
      <br>
      div(v-html="$t('dialog.howToPlay.unlimited.extra', { questionCount: String(alphabet.items.length) })")
</template>

<script>
import { defineComponent, useStore, computed } from '@nuxtjs/composition-api'

export default defineComponent({
  setup() {
    const store = useStore()

    const alphabet = computed(() => store.getters['unlimited/alphabet'])

    return {
      alphabet
    }
  }
})
</script>

<style lang="scss" src="./HowToPlayUnlimitedModeContent.component.scss"></style>
