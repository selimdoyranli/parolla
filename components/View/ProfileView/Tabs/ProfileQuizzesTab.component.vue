<template lang="pug">
.profile-quizzes-tab
  template(v-if="loading")
    .profile-quizzes-tab__state
      Loading(color="var(--color-brand-02)")

  template(v-else-if="error")
    Empty(image="error" :description="$t('profile.quizzesTab.error')")
      Button(@click="reload") {{ $t('error.tryAgain') }}

  template(v-else-if="rooms.length === 0")
    Empty(:description="$t('profile.quizzesTab.empty')")

  template(v-else)
    List
      template(v-for="room in rooms")
        NuxtLink(
          :key="room.roomId"
          :to="localePath({ name: 'CreatorMode-CreatorModeRoom-slug', params: { slug: room.roomId } })"
          :title="room.title"
        )
          Cell.profile-quizzes-tab__cell(is-link)
            template(#title) {{ room.title }}
            template(#label)
              span.profile-quizzes-tab__cell-label {{ formatViewCount(room.viewCount) }}

    Button.profile-quizzes-tab__more(
      v-if="pagination.page < pagination.pageCount"
      plain
      round
      size="small"
      :loading="loadingMore"
      @click="loadMore"
    ) {{ $t('general.loadMore') }}
</template>

<script>
import { defineComponent, inject, ref, computed, watch } from '@nuxtjs/composition-api'
import { useStore, useContext } from '@nuxtjs/composition-api'
import { Loading, Empty, Button, List, Cell } from 'vant'

const PAGE_SIZE = 10

export default defineComponent({
  components: {
    Loading,
    Empty,
    Button,
    List,
    Cell
  },
  setup() {
    const shell = inject('profileShell')
    const store = useStore()
    const { localePath, i18n } = useContext()

    const rooms = computed(() => store.getters['creator/rooms'] || [])
    const pagination = computed(() => store.getters['creator/roomsPagination'] || { page: 1, pageCount: 1, pageSize: PAGE_SIZE, total: 0 })
    const loading = ref(false)
    const loadingMore = ref(false)
    const error = ref(null)

    const playerId = computed(() => shell?.player?.value?.id || null)

    const load = async (page = 1, isLoadMore = false) => {
      if (!playerId.value) return

      if (isLoadMore) loadingMore.value = true
      else loading.value = true
      error.value = null

      const { error: err } = await store.dispatch('creator/fetchRooms', {
        user: playerId.value,
        page,
        limit: PAGE_SIZE,
        isLoadMore,
        locale: i18n.locale
      })

      if (err) error.value = err

      loading.value = false
      loadingMore.value = false
    }

    watch(
      playerId,
      (id, prev) => {
        if (id && id !== prev) load(1, false)
      },
      { immediate: true }
    )

    const loadMore = () => load(pagination.value.page + 1, true)
    const reload = () => load(1, false)

    const formatViewCount = n => {
      if (n == null) return ''

      return `👁 ${n}`
    }

    return {
      rooms,
      pagination,
      loading,
      loadingMore,
      error,
      loadMore,
      reload,
      localePath,
      formatViewCount
    }
  }
})
</script>

<style lang="scss" src="./ProfileQuizzesTab.component.scss"></style>
