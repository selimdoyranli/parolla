<template lang="pug">
.profile-quizzes-tab
  template(v-if="loading")
    .profile-quizzes-tab__state
      Loading(color="var(--color-brand-02)")

  template(v-else-if="error")
    Empty(image="error" :description="$t('profile.quizzesTab.error')")
      Button(@click="reload") {{ $t('error.tryAgain') }}

  template(v-else-if="!rooms || rooms.length === 0")
    Empty(:description="$t('profile.quizzesTab.empty')")

  template(v-else)
    RoomList(:items="rooms" :user="player" :isActiveInfiniteLoading="true")
</template>

<script>
import { defineComponent, inject, ref, computed, watch } from '@nuxtjs/composition-api'
import { useStore, useContext } from '@nuxtjs/composition-api'
import { Loading, Empty, Button } from 'vant'

const PAGE_SIZE = 10

export default defineComponent({
  components: {
    Loading,
    Empty,
    Button
  },
  setup() {
    const shell = inject('profileShell')
    const store = useStore()
    const { i18n } = useContext()

    const rooms = computed(() => store.getters['creator/rooms'] || [])
    const loading = ref(false)
    const error = ref(null)

    const player = computed(() => shell?.player?.value || null)
    const playerId = computed(() => player.value?.id || null)

    const load = async () => {
      if (!playerId.value) return

      loading.value = true
      error.value = null

      const { error: err } = await store.dispatch('creator/fetchRooms', {
        isVisible: true,
        isLoadMore: false,
        user: playerId.value,
        page: 1,
        limit: PAGE_SIZE,
        locale: i18n.locale
      })

      if (err) error.value = err

      loading.value = false
    }

    watch(
      playerId,
      (id, prev) => {
        if (id && id !== prev) load()
      },
      { immediate: true }
    )

    const reload = () => load()

    return {
      rooms,
      loading,
      error,
      reload,
      player
    }
  }
})
</script>

<style lang="scss" src="./ProfileQuizzesTab.component.scss"></style>
