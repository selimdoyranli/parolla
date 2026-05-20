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
      ProfileTabBar(:username="username")

      nuxt-child(:key="$route.fullPath")
</template>

<script>
import { defineComponent, useRoute, useStore, useFetch, useRouter, useContext, computed, ref, provide } from '@nuxtjs/composition-api'
import { Empty, Button } from 'vant'

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
    const { localePath } = useContext()

    const username = computed(() => route.value.params.username)

    const playerLoading = ref(true)
    const playerError = ref(null)
    const tourScoreLoading = ref(true)
    const tourScoreError = ref(null)

    const { fetch, fetchState } = useFetch(async () => {
      playerLoading.value = true
      playerError.value = null
      tourScoreLoading.value = true
      tourScoreError.value = null

      const [{ data: playerData, error: pErr }, { error: tErr }] = await Promise.all([
        store.dispatch('profile/fetchPlayer', { username: username.value }),
        store.dispatch('tour/fetchTourScoreOfUser', { username: username.value })
      ])

      if (pErr) playerError.value = pErr

      if (tErr) tourScoreError.value = tErr

      playerLoading.value = false
      tourScoreLoading.value = false

      if (playerData?.id) {
        store.dispatch('profile/fetchPlayerStats', { userId: playerData.id })
      }
    })

    const player = computed(() => store.getters['profile/player'])
    const playerStats = computed(() => store.getters['profile/playerStats'])
    const tourScore = computed(() => store.getters['tour/tourScoreOfUser'])

    const refetch = () => fetch()

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
      playerLoading,
      playerError,
      fetchState,
      refetch,
      goHome
    }
  }
})
</script>

<style lang="scss" src="./_username.page.scss"></style>
