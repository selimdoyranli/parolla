<template lang="pug">
.page.gm-panel-page
  GmPanel(:date.sync="date" :description="$t('gmPanel.daily.description')")
    Loading(v-if="isLoading" color="var(--color-brand-02)")
    Empty(v-else-if="!anomalies.length" image="search" :description="$t('gmPanel.empty')")

    template(v-else)
      span.gm-panel__itemsTitle {{ $t('gmPanel.anomalyCount', { count: total }) }}
      CellGroup.gm-panel__group(v-for="item in anomalies" :key="item.scoreId" inset)
        Cell(:label="item.user && item.user.email" icon="user-o" center :title="item.user && item.user.username")
          template(#right-icon)
            .gm-panel__tags
              Tag(v-if="item.user && item.user.blocked" type="danger" round) {{ $t('gmPanel.blocked') }}
        Cell(icon="warning-o" title-class="gm-panel__meta" :title="formatMeta(item)")
        .gm-panel__actions
          Button(type="danger" icon="delete-o" plain round size="small" @click="deleteScore(item)") {{ $t('gmPanel.deleteScore') }}
          Button(icon="cross" plain round size="small" :disabled="item.user && item.user.blocked" @click="blockUser(item)")
            | {{ $t('gmPanel.blockUser') }}

      Pagination(v-if="pageCount > 1" v-model="page" mode="simple" :page-count="pageCount")
</template>

<script>
import { defineComponent, useContext, useStore, ref, watch } from '@nuxtjs/composition-api'
import { Loading, Empty, Button, Tag, Pagination, CellGroup, Cell } from 'vant'

export default defineComponent({
  name: 'GmPanelDailyPage',
  components: {
    Loading,
    Empty,
    Button,
    Tag,
    Pagination,
    CellGroup,
    Cell
  },
  layout: 'Default/Default.layout',
  middleware: ['gm-control'],
  setup() {
    const { i18n } = useContext()
    const store = useStore()
    const { date, runAction } = useGmActions()
    const { convertMsToTime } = useTime()

    const anomalies = ref([])
    const isLoading = ref(false)
    const page = ref(1)
    const pageCount = ref(0)
    const total = ref(0)

    const fetchAnomalies = async () => {
      isLoading.value = true
      const { data } = await store.dispatch('gm/fetchDailyAnomalies', { date: date.value, page: page.value })

      anomalies.value = data?.data || []
      pageCount.value = data?.meta?.pagination?.pageCount || 0
      total.value = data?.meta?.pagination?.total || 0
      isLoading.value = false
    }

    const formatMeta = item => {
      const { minutes, seconds } = convertMsToTime(item.elapsedTimeAsMs)
      const time = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      return `${i18n.t('gmPanel.daily.anomaly', { correct: item.correctCount, time: `${minutes}:${seconds}` })} · ${time}`
    }

    const deleteScore = item =>
      runAction({
        action: 'delete-daily-score',
        data: { scoreId: item.scoreId },
        confirmMessage: i18n.t('gmPanel.confirmDeleteScores', { username: item.user?.username }),
        confirmButtonText: i18n.t('general.delete'),
        onDone: fetchAnomalies
      })

    const blockUser = item =>
      runAction({
        action: 'block-user',
        data: { userId: item.userId },
        confirmMessage: i18n.t('gmPanel.confirmBlockUser', { username: item.user?.username }),
        confirmButtonText: i18n.t('gmPanel.blockUser'),
        onDone: fetchAnomalies
      })

    watch(date, () => {
      page.value = 1
    })
    watch([date, page], fetchAnomalies, { immediate: true })

    return {
      date,
      anomalies,
      isLoading,
      page,
      pageCount,
      total,
      formatMeta,
      deleteScore,
      blockUser
    }
  },
  head() {
    return { title: this.$t('gmPanel.title') }
  }
})
</script>
