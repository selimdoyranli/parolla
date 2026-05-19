<template lang="pug">
.profile-scores-tab
  // Widget A — tour mode scores
  .profile-scores-tab__widget
    strong.profile-scores-tab__widget-title {{ $t('profile.scoresTab.tour.title') }}

    template(v-if="tourScoreLoading")
      .profile-scores-tab__state
        Loading(color="var(--color-brand-02)")

    template(v-else-if="tourScoreError")
      Empty(image="error" :description="$t('dialog.player.tourScore.callback.error.title')")
        Button(@click="refetchShell") {{ $t('error.tryAgain') }}

    template(v-else)
      PlayerTourScoreTable(:tourScore="tourScore")

  // Widget B — recently played
  .profile-scores-tab__widget
    strong.profile-scores-tab__widget-title {{ $t('profile.scoresTab.room.title') }}

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
          NuxtLink.profile-scores-tab__item-title(
            v-if="score.attributes.room && score.attributes.room.data"
            :to="localePath({ name: 'CreatorMode-CreatorModeRoom-slug', params: { slug: score.attributes.room.data.attributes.roomId } })"
          ) {{ score.attributes.room.data.attributes.title }}

          .profile-scores-tab__item-meta
            Timeago(:datetime="score.attributes.createdAt" :auto-update="60" :locale="$i18n.locale")
            span &nbsp;·&nbsp;
            span {{ statsLine(score) }}

      Button.profile-scores-tab__more(
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
    const { localePath, i18n } = useContext()

    const tourScore = computed(() => shell?.tourScore?.value || null)
    const tourScoreLoading = computed(() => shell?.tourScoreLoading?.value || false)
    const tourScoreError = computed(() => shell?.tourScoreError?.value || null)
    const refetchShell = () => shell?.refetch?.()

    const roomScores = ref([])
    const pagination = ref({ page: 1, pageCount: 1, pageSize: PAGE_SIZE, total: 0 })
    const loading = ref(false)
    const loadingMore = ref(false)
    const error = ref(null)

    const playerId = computed(() => shell?.player?.value?.id || null)

    const load = async (page = 1, isLoadMore = false) => {
      if (!playerId.value) return

      if (isLoadMore) loadingMore.value = true
      else loading.value = true
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

    const statsLine = score => {
      const results = score.attributes?.results || {}
      const correct = Array.isArray(results.correctAnswers) ? results.correctAnswers.length : 0
      const wrong = Array.isArray(results.wrongAnswers) ? results.wrongAnswers.length : 0
      const passed = Array.isArray(results.passedAnswers) ? results.passedAnswers.length : 0
      const composite = correct * 10 - wrong * 2 - passed * 1

      return i18n.t('profile.scoresTab.room.statsLine', { correct, wrong, score: composite })
    }

    return {
      tourScore,
      tourScoreLoading,
      tourScoreError,
      refetchShell,
      roomScores,
      pagination,
      loading,
      loadingMore,
      error,
      loadMore,
      reload,
      localePath,
      statsLine
    }
  }
})
</script>

<style lang="scss" src="./ProfileScoresTab.component.scss"></style>
