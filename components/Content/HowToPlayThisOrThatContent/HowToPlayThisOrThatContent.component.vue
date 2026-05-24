<template lang="pug">
.how-to-play-creator-mode-content
  i18n(tag="p" path="dialog.howToPlay.body")
    template(#description)
      h3 {{ room.title }}
      p.how-to-play-creator-mode-content__userDescription(v-if="room.description")
        | {{ room.description }}
      div(v-html="descriptionHtml")
    template(#extra)
      <br>
      .how-to-play-creator-mode-content__preparedBy
        span.how-to-play-creator-mode-content__preparedBy-label {{ $t('dialog.howToPlay.creator.preparedBy') }}
        PlayerAvatar(with-username :user="room.isAnon ? null : room.user" :open-player-dialog-on-click="!room.isAnon && !!room.user")
      div(v-html="$t('dialog.howToPlay.creator.thisOrThat.extra', { choiceCount: String(room.choices.length) })")
</template>

<script>
import { defineComponent, useContext, useStore, computed } from '@nuxtjs/composition-api'

export default defineComponent({
  setup() {
    const store = useStore()
    const { i18n } = useContext()

    const room = computed(() => store.getters['creator/room'])

    const descriptionHtml = computed(() => {
      return i18n.t('dialog.howToPlay.creator.thisOrThat.description')
    })

    return {
      room,
      descriptionHtml
    }
  }
})
</script>

<style lang="scss" src="./HowToPlayThisOrThatContent.component.scss"></style>
