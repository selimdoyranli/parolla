<template lang="pug">
.how-to-play-creator-mode-content
  i18n(tag="p" path="dialog.howToPlay.body")
    template(#description)
      h3 {{ room.title }}
      div(v-html="descriptionHtml")
    template(#extra)
      <br>
      div(v-html="$t('dialog.howToPlay.creator.extra', { questionCount: String(alphabet.items.length) })")
      NoticeBar.mb-2.mt-2.cursor-pointer(v-if="!$auth.loggedIn && !$auth.user" auth-control wrapable)
        small(v-html="$t('scoreboard.loginToBeInScoreboard')")
        br
        small(v-html="$t('scoreboard.loginToBeInScoreboardExtra')")
</template>

<script>
import { defineComponent, useContext, useStore, computed } from '@nuxtjs/composition-api'
import { NoticeBar } from 'vant'
import { GAME_TIME_LIMIT } from '@/system/constant'

export default defineComponent({
  components: {
    NoticeBar
  },
  setup() {
    const store = useStore()
    const { i18n } = useContext()
    const { convertMsToTime } = useTime()

    const room = computed(() => store.getters['creator/room'])
    const alphabet = computed(() => store.getters['creator/alphabet'])

    const gameTimeLimitMinutes = computed(() => {
      return room.value.gameTimeLimit
        ? String(Number(convertMsToTime(room.value.gameTimeLimit).minutes))
        : String(Number(convertMsToTime(GAME_TIME_LIMIT).minutes))
    })

    const descriptionHtml = computed(() => {
      return i18n.t('dialog.howToPlay.description', {
        gameTimeLimitMinutes: gameTimeLimitMinutes.value
      })
    })

    return {
      room,
      alphabet,
      convertMsToTime,
      descriptionHtml
    }
  }
})
</script>

<style lang="scss" src="./HowToPlayCreatorModeContent.component.scss"></style>
