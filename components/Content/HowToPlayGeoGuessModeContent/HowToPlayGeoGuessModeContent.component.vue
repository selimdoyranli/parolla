<template lang="pug">
.how-to-play-geoguess-mode-content
  ul.how-to-play-geoguess-mode-content__rules
    li(v-for="rule in rules" :key="rule.key")
      AppIcon(:name="rule.icon" :width="18" :height="18")
      span {{ rule.text }}
</template>

<script>
import { defineComponent, computed, useContext } from '@nuxtjs/composition-api'
import { GEOGUESS_TOTAL_ROUNDS, GEOGUESS_MAX_ROUND_SCORE, GEOGUESS_ROUND_TIME_MS } from '@/system/geoguess'

export default defineComponent({
  setup() {
    const { i18n } = useContext()

    const rules = computed(() => [
      { key: 'explore', icon: 'tabler:walk', text: i18n.t('geoGuessMode.rules.explore') },
      { key: 'mark', icon: 'tabler:map-pin', text: i18n.t('geoGuessMode.rules.mark') },
      { key: 'rounds', icon: 'tabler:flag', text: i18n.t('geoGuessMode.rules.rounds', { count: GEOGUESS_TOTAL_ROUNDS }) },
      { key: 'timer', icon: 'tabler:clock', text: i18n.t('geoGuessMode.rules.timer', { minutes: GEOGUESS_ROUND_TIME_MS / 60000 }) },
      {
        key: 'maxScore',
        icon: 'tabler:trophy',
        text: i18n.t('geoGuessMode.rules.maxScore', { score: GEOGUESS_MAX_ROUND_SCORE.toLocaleString(i18n.locale) })
      }
    ])

    return { rules }
  }
})
</script>

<style lang="scss" src="./HowToPlayGeoGuessModeContent.component.scss"></style>
