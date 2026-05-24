<template lang="pug">
.how-to-play-flashcards-content
  i18n(tag="p" path="dialog.howToPlay.body")
    template(#description)
      h3 {{ room.title }}
      p.how-to-play-flashcards-content__userDescription(v-if="room.description")
        | {{ room.description }}
      div(v-html="$t('dialog.howToPlay.creator.flashcards.description', { cardCount: String(room.flashcardCount || 0) })")
    template(#extra)
      <br>
      div(v-html="$t('dialog.howToPlay.creator.flashcards.extra')")
</template>

<script>
import { defineComponent, useStore, computed } from '@nuxtjs/composition-api'

export default defineComponent({
  setup() {
    const store = useStore()

    const room = computed(() => store.getters['creator/room'])

    return {
      room
    }
  }
})
</script>

<style lang="scss" src="./HowToPlayFlashcardsContent.component.scss"></style>
