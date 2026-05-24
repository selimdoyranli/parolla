<template lang="pug">
.how-to-play-creator-mode-content
  i18n(tag="p" path="dialog.howToPlay.body")
    template(#description)
      h3 {{ room.title }}
      .how-to-play-creator-mode-content__preparedBy
        span.how-to-play-creator-mode-content__preparedBy-label {{ $t('dialog.howToPlay.creator.preparedBy') }}
        PlayerAvatar(with-username :user="room.isAnon ? null : room.user" :open-player-dialog-on-click="!room.isAnon && !!room.user")
      p.how-to-play-creator-mode-content__userDescription(v-if="room.description")
        | {{ room.description }}
      div(v-html="descriptionHtml")
    template(#extra)
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
      const isTrivia = room.value?.answerTypeDominance === 'trivia'
      const key = isTrivia ? 'dialog.howToPlay.creator.descriptionTrivia' : 'dialog.howToPlay.creator.description'

      return i18n.t(key, {
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
