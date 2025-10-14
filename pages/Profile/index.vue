<template lang="pug">
.page.profile-page
  ProfileView(
    :player-loading="playerLoading"
    :player-error="playerError"
    :player="player"
    :tour-score-loading="tourScoreLoading"
    :tour-score-error="tourScoreError"
    :tour-score="tourScoreOfUser"
    @player-error-click="fetch"
    @tour-score-error-click="fetch"
  )
</template>

<script>
import { defineComponent, useRoute, useFetch, useStore, computed, ref } from '@nuxtjs/composition-api'
import { Loading, Empty, Button } from 'vant'

export default defineComponent({
  components: {
    Loading,
    Empty,
    Button
  },
  layout: 'Default/Default.layout',
  props: {
    user: {
      type: Object,
      required: false,
      default: null
    }
  },
  setup() {
    const route = useRoute()
    const store = useStore()

    const username = computed(() => route.value.query.username)

    const playerLoading = ref(false)
    const playerError = ref(null)
    const tourScoreLoading = ref(false)
    const tourScoreError = ref(null)

    const { fetch, fetchState } = useFetch(async () => {
      playerLoading.value = true
      playerError.value = null
      tourScoreLoading.value = true
      tourScoreError.value = null

      const fetchPlayer = async () => {
        const { data, error } = await store.dispatch('profile/fetchPlayer', { username: username.value })

        if (error) {
          playerError.value = error
        }

        playerLoading.value = false
      }

      const fetchTourScore = async () => {
        const { data, error } = await store.dispatch('tour/fetchTourScoreOfUser', {
          username: username.value
        })

        if (error) {
          tourScoreError.value = error
        }

        tourScoreLoading.value = false
      }

      fetchPlayer()
      fetchTourScore()
    })

    const tourScoreOfUser = computed(() => store.getters['tour/tourScoreOfUser'])
    const player = computed(() => store.getters['profile/player'])

    return {
      fetch,
      fetchState,
      playerLoading,
      playerError,
      tourScoreLoading,
      tourScoreError,
      username,
      player,
      tourScoreOfUser
    }
  }
})
</script>

<style lang="scss" src="./Profile.page.scss"></style>
