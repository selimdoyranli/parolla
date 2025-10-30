<template lang="pug">
.scene.intro-scene(ref="rootRef" tabindex="1")
  // Scene Inner
  .scene__inner
    AppLogo
    h2.intro-scene__title {{ $t('introScene.title') }}

    .intro-scene-mode-list
      IntroButton.intro-scene-mode-list-item.intro-scene-mode-list-item--daily(
        v-if="$i18n.locale === $i18n.defaultLocale"
        icon="noto:calendar"
        :to="localePath({ name: 'DailyMode' })"
        :title="`${$t('introScene.modeList.daily.title')} (${$t('introScene.modeList.daily.subtitle')})`"
        :description="$t('introScene.modeList.daily.description')"
        :headLabel="{ title: $t('introScene.modeList.daily.label', { count: dailyPlayingCount }) }"
        :playerList="dailyLeaderboard"
      )
        template(#avatarsMoreCount)
          | +{{ dailyLeaderboard?.length - 4 }}
        template(#body)
          .top-scorer(v-if="todaysDailyBestScorer")
            AppIcon.top-scorer__icon(name="tabler:trophy" :width="16" :height="16")
            i18n(tag="p" path="introScene.modeList.daily.todaysBestScore")
              template(#label)
                label.best-score-label {{ $t('introScene.modeList.daily.todaysBestScoreLabel') }}
              template(#player)
                PlayerAvatar.top-scorer__avatar(with-username open-player-dialog-on-click :user="todaysDailyBestScorer" :size="22")
            Button.leaderboard-button(
              size="small"
              plain
              :to="localePath({ name: 'DailyMode-Leaderboard-period', params: { period: $t('period.daily.slug') } })"
            )
              AppIcon.leaderboard-button__icon(name="noto:trophy" :width="16" :height="16")
              | {{ $t('leaderboard.title') }}

      IntroButton.intro-scene-mode-list-item.intro-scene-mode-list-item--unlimited(
        v-if="$i18n.locale === $i18n.defaultLocale"
        icon="noto:infinity"
        :to="localePath({ name: 'UnlimitedMode' })"
        :title="$t('introScene.modeList.unlimited.title')"
        :headLabel="{ title: $t('introScene.modeList.unlimited.label', { count: tourUserList?.totalPlayers }) }"
        :description="$t('introScene.modeList.unlimited.description')"
      )

      IntroButton.intro-scene-mode-list-item.intro-scene-mode-list-item--creator(
        icon="noto:pencil"
        :to="localePath({ name: 'CreatorMode-CreatorModeIntro' })"
        :title="$t('introScene.modeList.creator.title')"
        :headLabel="{ title: $t('introScene.modeList.creator.label', { count: todaysSolvedTotalQuiz?.meta?.pagination?.total }) }"
        :description="$t('introScene.modeList.creator.description')"
      )
        template(v-if="todaysQuiz && Object.keys(todaysQuiz).length > 0" #body)
          .todaysQuiz
            span {{ $t('introScene.modeList.creator.todaysQuizLabel') }}&nbsp;
            NuxtLink(:to="localePath({ name: 'CreatorMode-CreatorModeRoom-slug', params: { slug: todaysQuiz.id } })") "{{ todaysQuiz.title }}"

      IntroButton.intro-scene-mode-list-item.intro-scene-mode-list-item--tour(
        v-if="$i18n.locale === $i18n.defaultLocale"
        :label="$t('introScene.modeList.tour.label')"
        icon="akar-icons:arrow-cycle"
        :to="localePath({ name: 'TourMode-TourModeGame' })"
        :headLabel="{ title: $t('introScene.modeList.tour.liveCount', { count: tourUserList?.totalPlayers }), icon: 'tabler:users', pulse: true }"
        :title="$t('introScene.modeList.tour.title')"
        :description="$t('introScene.modeList.tour.description')"
        :playerList="tourUserList.players"
      )
        template(#avatarsMoreCount)
          | +{{ tourUserList?.totalPlayers - 4 }}
        template(#body)
          .top-scorer(v-if="todaysTourBestScorer")
            AppIcon.top-scorer__icon(name="tabler:trophy" :width="16" :height="16")
            i18n(tag="p" path="introScene.modeList.tour.todaysBestScore")
              template(#label)
                label.best-score-label {{ $t('introScene.modeList.tour.todaysBestScoreLabel') }}
              template(#by)
                PlayerAvatar.top-scorer__avatar(with-username open-player-dialog-on-click :user="todaysTourBestScorer" :size="22")
              template(#byLabel)
                label.by-label {{ $t('introScene.modeList.tour.todaysBestScoreByLabel') }}
              template(#score)
                strong &nbsp;{{ todaysTourBestScorer.score }}&nbsp;
            Button.leaderboard-button(
              size="small"
              plain
              :to="localePath({ name: 'TourMode-Leaderboard-period', params: { period: $t('period.daily.slug') } })"
            )
              AppIcon.leaderboard-button__icon(name="noto:trophy" :width="16" :height="16")
              | {{ $t('leaderboard.title') }}

      IntroButton.intro-scene-mode-list-item.intro-scene-mode-list-item--wordblock(
        v-if="$i18n.locale === $i18n.defaultLocale"
        icon="icon-park:view-grid-card"
        :to="localePath({ name: 'WordblockMode' })"
        :title="$t('introScene.modeList.wordblock.title')"
        :headLabel="{ title: $t('introScene.modeList.wordblock.label', { count: wordblockDailyPlayingCount }) }"
        :description="$t('introScene.modeList.wordblock.description')"
      )

    .intro-scene__keywords.d-none
      h3.intro-scene__subtitle {{ $t('introScene.subtitle') }}
      p.intro-scene__description {{ $t('introScene.description') }}
</template>

<script>
import { defineComponent, useContext, useStore, onMounted, computed } from '@nuxtjs/composition-api'
import { Button, Notify } from 'vant'

export default defineComponent({
  components: {
    Button
  },
  setup() {
    const { i18n } = useContext()
    const store = useStore()

    const localeAvailabilityMessage = () => {
      if (i18n.locale !== i18n.defaultLocale) {
        Notify({
          message: 'Currently only available for TR',
          color: 'var(--color-text-04)',
          background: 'var(--color-warning-01)',
          duration: 2000
        })
      }
    }

    const dailyPlayingCount = computed(() => store.getters['daily/dailyPlayingCount'])
    const dailyLeaderboard = computed(() => store.getters['daily/leaderboard'])
    const todaysDailyBestScorer = computed(() => dailyLeaderboard.value?.[0])

    const tourUserList = computed(() => store.getters['tour/userList'])
    const tourLeaderboard = computed(() => store.getters['tour/leaderboard'])
    const todaysTourBestScorer = computed(() => tourLeaderboard.value?.[0])

    const todaysSolvedTotalQuiz = computed(() => store.getters['creator/todaysSolvedTotalQuiz'])
    const todaysQuiz = computed(() => store.getters['creator/todaysQuiz'])

    const wordblockDailyPlayingCount = computed(() => store.getters['wordblock/dailyPlayingCount'])

    onMounted(async () => {
      await Promise.all([
        store.dispatch('daily/fetchDailyPlayingCount'),
        store.dispatch('daily/fetchLeaderboard', { period: 'daily', limit: 10 }),
        store.dispatch('tour/fetchLeaderboard', { period: 'daily', limit: 1 }),
        store.dispatch('creator/fetchTodaysSolvedTotalQuiz', { limit: 1 }),
        store.dispatch('creator/fetchTodaysQuiz'),
        store.dispatch('wordblock/fetchDailyPlayingCount')
      ])
    })

    return {
      dailyPlayingCount,
      dailyLeaderboard,
      todaysDailyBestScorer,
      tourUserList,
      tourLeaderboard,
      todaysTourBestScorer,
      todaysSolvedTotalQuiz,
      todaysQuiz,
      wordblockDailyPlayingCount,
      localeAvailabilityMessage
    }
  }
})
</script>

<style lang="scss" src="./IntroScene.component.scss"></style>
