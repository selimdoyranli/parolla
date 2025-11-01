<template lang="pug">
.page.leaderboard-page
  .leaderboard-page-header
    h1.leaderboard-page-header__title.mb-base {{ $t('leaderboard.modeTitle', { mode: $t('introScene.modeList.daily.title') }) }}
    p.leaderboard-page-header__description.mb-base {{ pageDescription }}

  .button-group
    NuxtLink(:to="localePath({ name: 'DailyMode-Leaderboard-period', params: { period: $t('period.daily.slug') } })")
      Button(type="primary" size="small" :class="{ active: period === $t('period.daily.slug') }")
        | {{ $t('leaderboard.daily.short') }}

    NuxtLink(:to="localePath({ name: 'DailyMode-Leaderboard-period', params: { period: $t('period.weekly.slug') } })")
      Button(type="primary" size="small" :class="{ active: period === $t('period.weekly.slug') }")
        | {{ $t('leaderboard.weekly.short') }}

    NuxtLink(:to="localePath({ name: 'DailyMode-Leaderboard-period', params: { period: $t('period.monthly.slug') } })")
      Button(type="primary" size="small" :class="{ active: period === $t('period.monthly.slug') }")
        | {{ $t('leaderboard.monthly.short') }}

    NuxtLink(:to="localePath({ name: 'DailyMode-Leaderboard-period', params: { period: $t('period.season.slug') } })")
      Button(type="primary" size="small" :class="{ active: period === $t('period.season.slug') }")
        | {{ $t('leaderboard.season.short', { seasonYear: seasonYear }) }}

  template(v-if="fetchState.pending")
    Empty(:description="$t('leaderboard.pending')")

  template(v-else-if="fetchState.error")
    Empty(image="error" :description="$t('leaderboard.error')")
      Button(@click="fetch") {{ $t('leaderboard.error.action') }}

  template(v-else)
    template(v-if="leaderboard.length > 0")
      Leaderboard(:scorers="leaderboard")
    template(v-else)
      Empty(:description="$t('leaderboard.empty.description')")

  // Ad
  AppAd.my-base.pt-base(:data-ad-slot="6048083070")
</template>

<script lang="ts">
import { defineComponent, useContext, useStore, useRoute, useFetch, computed, useMeta } from '@nuxtjs/composition-api'
import { Empty, Button } from 'vant'
import dayjs from 'dayjs'
import 'dayjs/locale/tr'
import 'dayjs/locale/en'

export default defineComponent({
  name: 'PeriodLeaderboardPage',
  components: {
    Empty,
    Button
  },
  layout: 'Default/Default.layout',
  setup() {
    const { i18n } = useContext()
    const store = useStore()
    const { seasonYear } = useFormatter()

    const route = useRoute()
    const period = computed(() => route.value.params.period)

    const mapPeriod = period => {
      if (period === i18n.t('period.daily.slug')) {
        return 'daily'
      } else if (period === i18n.t('period.weekly.slug')) {
        return 'weekly'
      } else if (period === i18n.t('period.monthly.slug')) {
        return 'monthly'
      } else if (period === i18n.t('period.season.slug')) {
        return 'season'
      }

      return 'daily'
    }

    const { fetch, fetchState } = useFetch(async () => {
      await store.dispatch('daily/fetchLeaderboard', { period: mapPeriod(period.value), limit: 100 })
    })

    const leaderboard = computed(() => store.getters['daily/leaderboard'])

    const pageDescription = computed(() => {
      const currentPeriod = mapPeriod(period.value)

      return i18n.t(`leaderboard.${currentPeriod}.leaderSorting`, {
        startDate: dayjs().locale(i18n.locale).startOf('month').format('D MMMM'),
        endDate: dayjs().locale(i18n.locale).endOf('month').format('D MMMM')
      })
    })

    useMeta(() => ({
      title: `${i18n.t(`leaderboard.${mapPeriod(period.value)}.full`)} - ${i18n.t('leaderboard.modeTitle', {
        mode: i18n.t('introScene.modeList.daily.title')
      })} - ${i18n.t('seo.main.title')}`,
      meta: [
        {
          hid: 'og:title',
          name: 'og:title',
          content: `${i18n.t(`leaderboard.${mapPeriod(period.value)}.full`)} - ${i18n.t('leaderboard.modeTitle', {
            mode: i18n.t('introScene.modeList.daily.title')
          })} - ${i18n.t('seo.main.title')}`
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: `${i18n.t(`leaderboard.${mapPeriod(period.value)}.full`)} - ${i18n.t('leaderboard.modeTitle', {
            mode: i18n.t('introScene.modeList.daily.title')
          })} - ${i18n.t('seo.main.title')}`
        }
      ]
    }))

    return {
      fetch,
      fetchState,
      period,
      leaderboard,
      pageDescription,
      seasonYear
    }
  },
  head: {}
})
</script>

<style lang="scss" src="../Leaderboard.page.scss"></style>
