<template lang="pug">
.scene.intro-scene(ref="rootRef" tabindex="1")
  // Scene Inner
  .scene__inner
    AppLogo
    h2.intro-scene__title {{ $t('introScene.title') }}

    .intro-scene-mode-list
      Button.intro-scene-mode-list-item(
        v-if="$i18n.locale === $i18n.defaultLocale"
        size="large"
        :to="$i18n.locale === $i18n.defaultLocale ? localePath({ name: 'DailyMode' }) : localePath('/')"
        :class="[{ 'intro-scene-mode-list-item--disabled': $i18n.locale !== $i18n.defaultLocale }]"
        @click="localeAvailabilityMessage"
      )
        .prepend
          AppIcon.intro-scene-mode-list-item__icon(name="noto:calendar" :width="24" :height="24")
          .title-group
            a.intro-scene-mode-list-item-title(href="https://parolla.app" :title="$t('introScene.subtitle')" @click.prevent.stop.capture)
              | {{ $t('introScene.modeList.daily.title') }}
            span.ms-1 ({{ $t('introScene.modeList.daily.subtitle') }})
          p.intro-scene-mode-list-item__description {{ $t('introScene.modeList.daily.description') }}

      Button.intro-scene-mode-list-item(
        v-if="$i18n.locale === $i18n.defaultLocale"
        size="large"
        :to="$i18n.locale === $i18n.defaultLocale ? localePath({ name: 'UnlimitedMode' }) : localePath('/')"
        :class="[{ 'intro-scene-mode-list-item--disabled': $i18n.locale !== $i18n.defaultLocale }]"
        @click="localeAvailabilityMessage"
      )
        .prepend
          AppIcon.intro-scene-mode-list-item__icon(name="noto:infinity" :width="24" :height="24")
          span.intro-scene-mode-list-item-title {{ $t('introScene.modeList.unlimited.title') }}
          p.intro-scene-mode-list-item__description {{ $t('introScene.modeList.unlimited.description') }}

      Button.intro-scene-mode-list-item(size="large" :to="localePath({ name: 'CreatorMode-CreatorModeIntro' })")
        .prepend
          AppIcon.intro-scene-mode-list-item__icon(name="noto:pencil" :width="24" :height="24")
          span.intro-scene-mode-list-item-title {{ $t('introScene.modeList.creator.title') }}
          p.intro-scene-mode-list-item__description {{ $t('introScene.modeList.creator.description') }}

      .intro-scene-mode-list-item.intro-scene-mode-list-item--tour(v-if="$i18n.locale === $i18n.defaultLocale" size="large")
        .prepend
          AppIcon.intro-scene-mode-list-item__icon(name="akar-icons:arrow-cycle" color="var(--color-text-01)" :width="24" :height="24")
          span.intro-scene-mode-list-item-title
            | {{ $t('introScene.modeList.tour.title') }}

          span.live-count
            AppIcon.icon(name="tabler:users" :width="16" :height="16")
            span.count {{ $t('introScene.modeList.tour.liveCount', { count: userList.totalPlayers }) }}
            span.pulse

          .top-scorer(v-if="todaysTourBestScorer")
            .top-scorer__content
              AppIcon.top-scorer__icon(name="tabler:trophy" :width="16" :height="16")
              i18n(tag="p" path="introScene.modeList.tour.todaysBestScore")
                template(#label)
                  label.best-score-label {{ $t('introScene.modeList.tour.todaysBestScoreLabel') }}
                template(#by)
                  PlayerAvatar.top-scorer__avatar(with-username open-player-dialog-on-click :user="todaysTourBestScorer" :size="22")
                template(#byLabel)
                  label.by-label {{ $t('introScene.modeList.tour.todaysBestScoreByLabel') }}
                template(#score)
                  strong &nbsp; {{ todaysTourBestScorer.score }} &nbsp;
              Button.leaderboard-button(size="small" plain :to="localePath({ name: 'Leaderboard' })")
                AppIcon.leaderboard-button__icon(name="noto:trophy" :width="16" :height="16")
                | Liderlik tablosu

          p.intro-scene-mode-list-item__description {{ $t('introScene.modeList.tour.description') }}

          .intro-scene-mode-list-item.intro-scene-mode-list-item__footer
            Button.play-now-button(:to="localePath({ name: 'TourMode-TourModeGame' })") {{ $t('general.play') }}
            .avatar-group(v-if="userList.players.length > 0")
              PlayerAvatar(
                v-for="player in userList.players.slice(0, 4)"
                :key="player.id"
                :user="{ username: player.username, diceBear: player.diceBear }"
              )
              .avatar-group__moreCount(v-if="userList.totalPlayers > 4") +{{ userList.totalPlayers - 4 }}

        .append
          label.intro-scene-mode-list-item__label
            AppIcon(name="tabler:sparkles" :width="16" :height="16")
            | {{ $t('introScene.modeList.tour.label') }}

      Button.intro-scene-mode-list-item(
        v-if="$i18n.locale === $i18n.defaultLocale"
        size="large"
        :to="localePath({ name: 'WordblockMode' })"
      )
        .prepend
          AppIcon.intro-scene-mode-list-item__icon(name="icon-park:view-grid-card" :width="24" :height="24")
          span.intro-scene-mode-list-item-title {{ $t('introScene.modeList.wordblock.title') }}
          p.intro-scene-mode-list-item__description {{ $t('introScene.modeList.wordblock.description') }}

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

    const userList = computed(() => store.getters['tour/userList'])
    const leaderboard = computed(() => store.getters['tour/leaderboard'])
    const todaysTourBestScorer = computed(() => store.getters['tour/todaysBestScorer'])

    onMounted(async () => {
      await store.dispatch('tour/fetchLeaderboard', { period: 'daily', limit: 10 })
    })

    return {
      userList,
      leaderboard,
      todaysTourBestScorer,
      localeAvailabilityMessage
    }
  }
})
</script>

<style lang="scss" src="./IntroScene.component.scss"></style>
