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
        :playerList="dailyLeaderboard.items"
      )
        template(#avatarsMoreCount)
          | +{{ dailyLeaderboard?.meta?.pagination?.total - 4 }}
        template(#body)
          .top-scorer(v-if="todaysDailyBestScorer")
            AppIcon.top-scorer__icon(name="tabler:trophy" :width="16" :height="16")
            i18n(tag="p" path="introScene.modeList.daily.todaysBestScore")
              template(#label)
                label.best-score-label {{ $t('introScene.modeList.daily.todaysBestScoreLabel') }}
              template(#player)
                span.top-scorer__player
                  AppIcon.top-scorer__crown(name="tabler:crown" :width="14" :height="14")
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
        :headLabel="{ title: $t('introScene.modeList.unlimited.label') }"
        :description="$t('introScene.modeList.unlimited.description')"
      )

      IntroButton.intro-scene-mode-list-item.intro-scene-mode-list-item--creator(
        icon="noto:pencil"
        :to="localePath({ name: 'CreatorMode-CreatorModeRooms' })"
        :title="$t('introScene.modeList.creator.title')"
        :headLabel="{ title: $t('introScene.modeList.creator.label', { count: creatorDailyPlayingCount }) }"
        :description="$t('introScene.modeList.creator.description')"
      )
        template(v-if="todaysQuiz && Object.keys(todaysQuiz).length > 0" #body)
          .todaysQuiz
            span {{ $t('introScene.modeList.creator.todaysQuizLabel') }}&nbsp;
            NuxtLink(:to="localePath({ name: 'CreatorMode-CreatorModeRoom-slug', params: { slug: todaysQuiz.roomId } })") "{{ todaysQuiz.title }}"

      IntroButton.intro-scene-mode-list-item.intro-scene-mode-list-item--tour(
        v-if="$i18n.locale === $i18n.defaultLocale"
        icon="akar-icons:arrow-cycle"
        :to="localePath({ name: 'TourMode-TourModeGame' })"
        :headLabel="{ title: $t('introScene.modeList.tour.label'), icon: 'tabler:users', pulse: true }"
        :title="$t('introScene.modeList.tour.title')"
        :description="$t('introScene.modeList.tour.description')"
        :playerList="tourUserList"
      )
        template(#body)
          .top-scorer(v-if="todaysTourBestScorer")
            AppIcon.top-scorer__icon(name="tabler:trophy" :width="16" :height="16")
            i18n(tag="p" path="introScene.modeList.tour.todaysBestScore")
              template(#label)
                label.best-score-label {{ $t('introScene.modeList.tour.todaysBestScoreLabel') }}
              template(#by)
                span.top-scorer__player
                  AppIcon.top-scorer__crown(name="tabler:crown" :width="14" :height="14")
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

      IntroButton.intro-scene-mode-list-item.intro-scene-mode-list-item--music(
        icon="emojione:musical-notes"
        :to="localePath({ name: 'MusicMode-GuessTheSong' })"
        :title="$t('introScene.modeList.music.title')"
        :headLabel="{ title: $t('introScene.modeList.music.label') }"
        :description="$t('introScene.modeList.music.description')"
      )

      IntroButton.intro-scene-mode-list-item.intro-scene-mode-list-item--knowledge-kingdom(
        v-if="false"
        icon="noto:crown"
        :to="localePath({ name: 'Tycoon-KnowledgeKingdom' })"
        :title="$t('introScene.modeList.knowledgeKingdom.title')"
        :headLabel="{ title: $t('introScene.modeList.knowledgeKingdom.label') }"
        :description="$t('introScene.modeList.knowledgeKingdom.description')"
      )

    .intro-scene__keywords.d-none
      h3.intro-scene__subtitle {{ $t('introScene.subtitle') }}
      p.intro-scene__description {{ $t('introScene.description') }}

    // Ad
    AppAd(:data-ad-slot="9964323575")
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
    const todaysDailyBestScorer = computed(() => dailyLeaderboard.value.items?.[0])
    const dailyScores = computed(() => store.getters['daily/dailyScores'])

    const tourUserList = computed(() => {
      return Array.from({ length: 10 }, (_, index) => ({
        id: index + 1,
        username: `Player ${Math.random().toString(36).substring(2, 15)}`
      }))
    })
    const tourLeaderboard = computed(() => store.getters['tour/leaderboard'])
    const todaysTourBestScorer = computed(() => tourLeaderboard.value.items?.[0])

    const todaysQuiz = computed(() => store.getters['creator/todaysQuiz'])
    const creatorDailyPlayingCount = computed(() => store.getters['creator/dailyPlayingCount'])

    const wordblockDailyPlayingCount = computed(() => store.getters['wordblock/dailyPlayingCount'])

    onMounted(async () => {
      await Promise.all([
        store.dispatch('daily/fetchDailyPlayingCount'),
        store.dispatch('daily/fetchLeaderboard', { period: 'daily', limit: 10 }),
        store.dispatch('tour/fetchLeaderboard', { period: 'daily', limit: 1 }),
        store.dispatch('creator/fetchDailyPlayingCount'),
        store.dispatch('creator/fetchTodaysQuiz'),
        store.dispatch('wordblock/fetchDailyPlayingCount')
      ])
    })

    return {
      dailyPlayingCount,
      dailyLeaderboard,
      todaysDailyBestScorer,
      dailyScores,
      tourUserList,
      tourLeaderboard,
      todaysTourBestScorer,
      creatorDailyPlayingCount,
      todaysQuiz,
      wordblockDailyPlayingCount,
      localeAvailabilityMessage
    }
  }
})
</script>

<style lang="scss" src="./IntroScene.component.scss"></style>
