<template lang="pug">
.page.leaderboard-page.wordblock-leaderboard-page
  .leaderboard-page-header
    h1.leaderboard-page-header__title.mb-base {{ $t('leaderboard.modeTitle', { mode: $t('introScene.modeList.wordblock.title') }) }}
    p.leaderboard-page-header__description.mb-base {{ pageDescription }}

  // Character length boards
  .button-group.button-group--charLength
    NuxtLink(
      v-for="length in availableCharLengths"
      :key="length"
      :to="localePath({ name: 'WordblockMode-Leaderboard-charLength-period', params: { charLength: length, period: period } })"
    )
      Button(type="primary" size="small" :class="{ active: length === charLength }")
        | {{ $t('wordblockMode.title', { charLength: length }) }}

  // Periods
  .button-group
    NuxtLink(
      v-for="option in periodOptions"
      :key="option.key"
      :to="localePath({ name: 'WordblockMode-Leaderboard-charLength-period', params: { charLength: charLength, period: option.slug } })"
    )
      Button(type="primary" size="small" :class="{ active: option.slug === period }")
        | {{ option.label }}

  template(v-if="fetchState.pending")
    Empty(:description="$t('leaderboard.pending')")

  template(v-else-if="fetchState.error")
    Empty(image="error" :description="$t('leaderboard.error.fetch.description')")
      Button(@click="fetch") {{ $t('leaderboard.error.fetch.action') }}

  template(v-else)
    template(v-if="leaderboard.items.length > 0")
      Leaderboard(:scorers="leaderboard.items" :current-player="currentPlayer")
    template(v-else)
      Empty(:description="$t('leaderboard.empty.description')")

  // Ad
  AppAd.my-base.pt-base(:data-ad-slot="6048083070")
</template>

<script>
import { defineComponent, useContext, useStore, useRoute, useFetch, computed, useMeta } from '@nuxtjs/composition-api'
import { Empty, Button } from 'vant'
import dayjs from 'dayjs'
import 'dayjs/locale/tr'
import 'dayjs/locale/en'
import { WORDBLOCK_AVAILABLE_LENGTHS, WORDBLOCK_LEADERBOARD_PAGE_SIZE } from '@/system/constant'

export default defineComponent({
  name: 'WordblockPeriodLeaderboardPage',
  components: {
    Empty,
    Button
  },
  layout: 'Default/Default.layout',
  setup() {
    const { i18n, error, $auth } = useContext()
    const store = useStore()
    const { seasonYear } = useFormatter()

    const route = useRoute()
    const period = computed(() => route.value.params.period)

    const charLength = computed(() => {
      const parsed = parseInt(route.value.params.charLength)

      return WORDBLOCK_AVAILABLE_LENGTHS.includes(parsed) ? parsed : WORDBLOCK_AVAILABLE_LENGTHS[0]
    })

    if (!WORDBLOCK_AVAILABLE_LENGTHS.includes(parseInt(route.value.params.charLength))) {
      error({ statusCode: 404 })
    }

    // Slugs are translated, so the route param has to be mapped back to the API period
    const periodOptions = computed(() => [
      { key: 'daily', slug: i18n.t('period.daily.slug'), label: i18n.t('leaderboard.daily.short') },
      { key: 'weekly', slug: i18n.t('period.weekly.slug'), label: i18n.t('leaderboard.weekly.short') },
      { key: 'monthly', slug: i18n.t('period.monthly.slug'), label: i18n.t('leaderboard.monthly.short') },
      { key: 'season', slug: i18n.t('period.season.slug'), label: i18n.t('leaderboard.season.short', { seasonYear: seasonYear.value }) }
    ])

    const activePeriodKey = computed(() => {
      const match = periodOptions.value.find(option => option.slug === period.value)

      return match ? match.key : 'daily'
    })

    const fetchUserRank = () => {
      if (!$auth.loggedIn || !$auth.user?.id) {
        store.commit('wordblock/SET_USER_RANK', null)

        return Promise.resolve()
      }

      return store.dispatch('wordblock/fetchUserRank', {
        userId: $auth.user.id,
        period: activePeriodKey.value,
        charLength: charLength.value
      })
    }

    const { fetch, fetchState } = useFetch(async () => {
      // The board and the reader's own standing are independent queries, so run them together
      const [{ error: fetchError }] = await Promise.all([
        store.dispatch('wordblock/fetchLeaderboard', {
          period: activePeriodKey.value,
          charLength: charLength.value,
          limit: WORDBLOCK_LEADERBOARD_PAGE_SIZE
        }),
        fetchUserRank()
      ])

      // $appFetch resolves an error tuple instead of throwing, so surface it to useFetch
      if (fetchError) {
        throw new Error(fetchError.message)
      }
    })

    const leaderboard = computed(() => store.getters['wordblock/leaderboard'])

    // The pinned row carries what the rows below it carry: the attempts and time behind
    // the player's best word on this board
    const currentPlayer = computed(() => {
      const userRank = store.getters['wordblock/userRank']

      if (!$auth.loggedIn || !userRank?.rank) {
        return null
      }

      return {
        ...$auth.user,
        rank: userRank.rank,
        ...(userRank.results && { results: userRank.results })
      }
    })

    const pageTitle = computed(
      () =>
        `${i18n.t(`leaderboard.${activePeriodKey.value}.full`)} - ${i18n.t('wordblockMode.title', {
          charLength: charLength.value
        })} - ${i18n.t('leaderboard.modeTitle', { mode: i18n.t('introScene.modeList.wordblock.title') })} - ${i18n.t('seo.main.title')}`
    )

    const pageDescription = computed(() =>
      i18n.t(`leaderboard.${activePeriodKey.value}.leaderSorting`, {
        startDate: dayjs().locale(i18n.locale).startOf('month').format('D MMMM'),
        endDate: dayjs().locale(i18n.locale).endOf('month').format('D MMMM')
      })
    )

    useMeta(() => ({
      title: pageTitle.value,
      meta: [
        {
          hid: 'og:title',
          name: 'og:title',
          content: pageTitle.value
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: pageTitle.value
        }
      ]
    }))

    return {
      fetch,
      fetchState,
      period,
      charLength,
      availableCharLengths: WORDBLOCK_AVAILABLE_LENGTHS,
      periodOptions,
      leaderboard,
      currentPlayer,
      pageDescription,
      seasonYear
    }
  },
  head: {}
})
</script>

<style lang="scss" src="../../Leaderboard.page.scss"></style>
