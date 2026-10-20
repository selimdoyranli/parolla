<template lang="pug">
.page.profile-page
  template(v-if="!playerLoading && playerError")
    .profile-page__not-found
      Empty(:description="$t('profile.notFound.title')")
        Button(@click="goHome") {{ $t('profile.notFound.action') }}

  template(v-else)
    ProfileView(
      :player="player"
      :player-loading="playerLoading"
      :player-error="!!playerError"
      :player-stats="playerStats"
      @player-error-click="refetch"
    )

    template(v-if="!playerLoading && player && player.id")
      ProfileTabBar(:username="username" :show-achievements="isSelf")

      nuxt-child(:key="$route.fullPath")
</template>

<script>
import {
  defineComponent,
  useRoute,
  useStore,
  useFetch,
  useRouter,
  useContext,
  useMeta,
  computed,
  ref,
  provide
} from '@nuxtjs/composition-api'
import { Empty, Button } from 'vant'
import { profileHead } from '@/helpers/profileSeo'

export default defineComponent({
  components: {
    Empty,
    Button
  },
  layout: 'Default/Default.layout',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    const { localePath, getRouteBaseName, i18n } = useContext()

    const username = computed(() => route.value.params.username)

    const playerLoading = ref(true)
    const playerError = ref(null)
    const tourScoreLoading = ref(true)
    const tourScoreError = ref(null)

    const fetchTourScore = async name => {
      tourScoreLoading.value = true
      tourScoreError.value = null

      const { error } = await store.dispatch('tour/fetchTourScoreOfUser', { username: name })

      // a newer profile was opened meanwhile
      if (name !== username.value) return

      tourScoreError.value = error || null
      tourScoreLoading.value = false
    }

    const { fetch, fetchState } = useFetch(async () => {
      playerLoading.value = true
      playerError.value = null

      // the tour score is only shown on the Scores tab: start it now but never block the card on it
      fetchTourScore(username.value)

      const { data: playerData, error: pErr } = await store.dispatch('profile/fetchPlayer', { username: username.value })

      if (pErr) playerError.value = pErr

      playerLoading.value = false

      if (playerData?.id) {
        const me = store.getters['auth/user']
        const isSelf = !!(me?.id && Number(me.id) === Number(playerData.id))
        store.dispatch('profile/fetchPlayerStats', { userId: playerData.id, isSelf })
      }
    })

    const player = computed(() => store.getters['profile/player'])
    const playerStats = computed(() => store.getters['profile/playerStats'])
    const tourScore = computed(() => store.getters['tour/tourScoreOfUser'])

    const isSelf = computed(() => {
      const me = store.getters['auth/user']

      return Boolean(me && player.value && me.username === player.value.username)
    })

    const refetch = () => fetch()

    const TAB_BY_ROUTE = { Quizzes: 'quizzes', Reviews: 'reviews', Scores: 'scores', Achievements: 'achievements' }

    useMeta(() => {
      if (!player.value?.username || player.value.username !== username.value) return {}

      const tab = TAB_BY_ROUTE[(getRouteBaseName(route.value) || '').replace('Profile-username-', '')] || null

      return profileHead({ player: player.value, locale: i18n.locale, tab, quizCount: playerStats.value?.rooms ?? null })
    })

    const goHome = () => {
      router.push(localePath({ name: 'Main' }))
    }

    provide('profileShell', {
      username,
      player,
      playerLoading,
      playerError,
      tourScore,
      tourScoreLoading,
      tourScoreError,
      refetch
    })

    return {
      username,
      player,
      playerStats,
      isSelf,
      playerLoading,
      playerError,
      fetchState,
      refetch,
      goHome
    }
  },
  head: {}
})
</script>

<style lang="scss" src="./_username.page.scss"></style>
