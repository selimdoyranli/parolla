<template lang="pug">
.how-to-play-creator-mode-content
  i18n(tag="p" path="dialog.howToPlay.body")
    template(#description)
      h3 {{ room.title }}
      div(v-html="$t('dialog.howToPlay.description')")
    template(#extra)
      <br>
      div(v-html="$t('dialog.howToPlay.creator.extra', { questionCount: String(alphabet.items.length) })")
      NoticeBar.mb-2.mt-2.cursor-pointer(v-if="!$auth.loggedIn && !$auth.user" auth-control wrapable)
        small(v-html="$t('scoreboard.loginToBeInScoreboard')")
        br
        small(v-html="$t('scoreboard.loginToBeInScoreboardExtra')")
</template>

<script>
import { defineComponent, useStore, computed } from '@nuxtjs/composition-api'
import { NoticeBar } from 'vant'

export default defineComponent({
  components: {
    NoticeBar
  },
  setup() {
    const store = useStore()

    const room = computed(() => store.getters['creator/room'])
    const alphabet = computed(() => store.getters['creator/alphabet'])

    return {
      room,
      alphabet
    }
  }
})
</script>

<style lang="scss" src="./HowToPlayCreatorModeContent.component.scss"></style>
