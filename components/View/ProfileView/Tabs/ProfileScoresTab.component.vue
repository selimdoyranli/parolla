<template lang="pug">
.profile-scores-tab
  Tabs.profile-scores-tab__subtabs(
    v-model="activeSubTab"
    type="line"
    color="var(--color-brand-02)"
    line-width="32px"
    line-height="3px"
    background="transparent"
    title-active-color="var(--color-text-01)"
    title-inactive-color="var(--color-text-03)"
  )
    Tab(name="creator" :title="$t('profile.scoresSubTabs.creator')")
      .profile-scores-tab__panel
        template(v-if="loading")
          .profile-scores-tab__state
            Loading(color="var(--color-brand-02)")

        template(v-else-if="error")
          Empty(image="error" :description="$t('profile.scoresTab.room.error')")
            Button(@click="reload") {{ $t('error.tryAgain') }}

        template(v-else-if="roomScores.length === 0")
          Empty(:description="$t('profile.scoresTab.room.empty')")

        template(v-else)
          .profile-scores-tab__list
            .profile-scores-tab__item(v-for="score in roomScores" :key="score.id")
              NuxtLink.profile-scores-tab__item-link(
                v-if="score.room"
                :to="localePath({ name: 'CreatorMode-CreatorModeRoom-slug', params: { slug: score.room.roomId } })"
              )
                .profile-scores-tab__item-head
                  span.profile-scores-tab__item-title {{ score.room.title }}
                  span.profile-scores-tab__item-score {{ compositeOf(score) }}

                .profile-scores-tab__item-meta
                  Timeago(:datetime="score.createdAt" :auto-update="60" :locale="$i18n.locale")
                  span.profile-scores-tab__item-dot ·
                  span {{ statsLine(score) }}

          InfiniteLoading(v-if="roomScores.length >= PAGE_SIZE && pagination.page < pagination.pageCount" @infinite="handleInfinite")
            template(#spinner)
              Loading(color="var(--color-brand-02)" size="20")
            template(#no-more) {{ '' }}
            template(#no-results) {{ '' }}

    Tab(name="tour" :title="$t('profile.scoresSubTabs.tour')")
      .profile-scores-tab__panel
        template(v-if="tourScoreLoading")
          .profile-scores-tab__state
            Loading(color="var(--color-brand-02)")

        template(v-else-if="tourScoreError")
          Empty(image="error" :description="$t('dialog.player.tourScore.callback.error.title')")
            Button(@click="refetchShell") {{ $t('error.tryAgain') }}

        template(v-else)
          PlayerTourScoreTable(:tourScore="tourScore")
</template>

<script>
import { defineComponent, inject, ref, computed, watch, useStore, useContext } from '@nuxtjs/composition-api'
import { Loading, Empty, Button, Tabs, Tab } from 'vant'
import InfiniteLoading from 'vue-infinite-loading'

const PAGE_SIZE = 10

export default defineComponent({
  components: {
    Loading,
    Empty,
    Button,
    Tabs,
    Tab,
    InfiniteLoading
  },
  setup() {
    const shell = inject('profileShell')
    const store = useStore()
    const { localePath, i18n } = useContext()

    const activeSubTab = ref('creator')

    const tourScore = computed(() => shell?.tourScore?.value || null)
    const tourScoreLoading = computed(() => shell?.tourScoreLoading?.value || false)
    const tourScoreError = computed(() => shell?.tourScoreError?.value || null)
    const refetchShell = () => shell?.refetch?.()

    const roomScores = ref([])
    const pagination = ref({ page: 1, pageCount: 1, pageSize: PAGE_SIZE, total: 0 })
    const loading = ref(false)
    const error = ref(null)

    const playerId = computed(() => shell?.player?.value?.id || null)

    const load = async (page = 1, isLoadMore = false) => {
      if (!playerId.value) return null

      if (!isLoadMore) loading.value = true
      error.value = null

      const { data, error: err } = await store.dispatch('creator/fetchRoomScoresByUser', {
        userId: playerId.value,
        page,
        limit: PAGE_SIZE,
        isLoadMore
      })

      if (err) {
        error.value = err
      } else if (data) {
        roomScores.value = isLoadMore ? [...roomScores.value, ...(data.data || [])] : data.data || []
        pagination.value = data.meta?.pagination || pagination.value
      }

      loading.value = false

      return { data, error: err }
    }

    watch(
      playerId,
      (id, prev) => {
        if (id && id !== prev) load(1, false)
      },
      { immediate: true }
    )

    const reload = () => load(1, false)

    const handleInfinite = async $state => {
      const result = await load(pagination.value.page + 1, true)

      if (result?.error) {
        $state.error()

        return
      }

      $state.loaded()

      if (pagination.value.page >= pagination.value.pageCount) {
        $state.complete()
      }
    }

    const compositeOf = score => {
      const results = score.results || {}
      const correct = Array.isArray(results.correctAnswers) ? results.correctAnswers.length : 0
      const wrong = Array.isArray(results.wrongAnswers) ? results.wrongAnswers.length : 0
      const passed = Array.isArray(results.passedAnswers) ? results.passedAnswers.length : 0

      return correct * 10 - wrong * 2 - passed * 1
    }

    const statsLine = score => {
      const results = score.results || {}
      const correct = Array.isArray(results.correctAnswers) ? results.correctAnswers.length : 0
      const wrong = Array.isArray(results.wrongAnswers) ? results.wrongAnswers.length : 0

      return i18n.t('profile.scoresTab.room.statsLine', { correct, wrong, score: compositeOf(score) })
    }

    return {
      PAGE_SIZE,
      activeSubTab,
      tourScore,
      tourScoreLoading,
      tourScoreError,
      refetchShell,
      roomScores,
      pagination,
      loading,
      error,
      reload,
      handleInfinite,
      localePath,
      compositeOf,
      statsLine
    }
  }
})
</script>

<style lang="scss" src="./ProfileScoresTab.component.scss"></style>
