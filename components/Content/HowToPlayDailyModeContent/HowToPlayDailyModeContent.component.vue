<template lang="pug">
.how-to-play-daily-mode-content
  i18n(tag="p" path="dialog.howToPlay.body")
    template(#description)
      div(
        v-html="$t('dialog.howToPlay.description', { gameTimeLimitMinutes: String(convertMsToTime(GAME_TIME_LIMIT).minutes).slice(1, 2) })"
      )
    template(#extra)
      <br>
      div(v-html="$t('dialog.howToPlay.daily.extra', { questionCount: String(alphabet.items.length) })")
</template>

<script>
import { defineComponent, useStore, computed } from '@nuxtjs/composition-api'
import { GAME_TIME_LIMIT } from '@/system/constant'

export default defineComponent({
  setup() {
    const store = useStore()

    const alphabet = computed(() => store.getters['daily/alphabet'])

    const { convertMsToTime } = useTime()

    return {
      alphabet,
      GAME_TIME_LIMIT,
      convertMsToTime
    }
  }
})
</script>

<style lang="scss" src="./HowToPlayDailyModeContent.component.scss"></style>
