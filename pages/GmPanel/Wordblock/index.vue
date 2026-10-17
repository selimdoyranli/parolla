<template lang="pug">
.page.gm-panel-page
  GmPanel(:date.sync="date" :description="$t('gmPanel.wordblock.description')")
    Loading(v-if="isLoading" color="var(--color-brand-02)")
    Empty(v-else-if="!anomalies.length" image="search" :description="$t('gmPanel.empty')")

    template(v-else)
      span.gm-panel__itemsTitle {{ $t('gmPanel.anomalyCount', { count: anomalies.length }) }}
      CellGroup.gm-panel__group(v-for="item in anomalies" :key="`${item.userId}-${item.gameLocale}`" inset)
        Cell(:label="item.user && item.user.email" icon="user-o" center :title="item.user && item.user.username")
          template(#right-icon)
            .gm-panel__tags
              Tag(type="primary" round plain) {{ item.gameLocale }}
              Tag(v-if="item.user && item.user.blocked" type="danger" round) {{ $t('gmPanel.blocked') }}
        Cell(icon="warning-o" title-class="gm-panel__meta" :title="$t('gmPanel.wordblock.anomaly')")
        .gm-panel__actions
          Button(type="danger" icon="cross" plain round size="small" :disabled="item.user && item.user.blocked" @click="blockUser(item)")
            | {{ $t('gmPanel.blockUser') }}
          Button(icon="delete-o" plain round size="small" @click="deleteScores(item)") {{ $t('gmPanel.deleteScores') }}
</template>

<script>
import { defineComponent, useContext, useStore, ref, watch } from '@nuxtjs/composition-api'
import { Loading, Empty, Button, Tag, CellGroup, Cell } from 'vant'

export default defineComponent({
  name: 'GmPanelWordblockPage',
  components: {
    Loading,
    Empty,
    Button,
    Tag,
    CellGroup,
    Cell
  },
  layout: 'Default/Default.layout',
  middleware: ['gm-control'],
  setup() {
    const { i18n } = useContext()
    const store = useStore()
    const { date, runAction } = useGmActions()

    const anomalies = ref([])
    const isLoading = ref(false)

    const fetchAnomalies = async () => {
      isLoading.value = true
      const { data } = await store.dispatch('gm/fetchWordblockAnomalies', { date: date.value })

      anomalies.value = data?.data || []
      isLoading.value = false
    }

    const blockUser = item =>
      runAction({
        action: 'block-user',
        data: { userId: item.userId },
        confirmMessage: i18n.t('gmPanel.confirmBlockUser', { username: item.user?.username }),
        confirmButtonText: i18n.t('gmPanel.blockUser'),
        onDone: fetchAnomalies
      })

    const deleteScores = item =>
      runAction({
        action: 'delete-wordblock-scores',
        data: { userId: item.userId, date: date.value, gameLocale: item.gameLocale },
        confirmMessage: i18n.t('gmPanel.confirmDeleteScores', { username: item.user?.username }),
        confirmButtonText: i18n.t('general.delete'),
        onDone: fetchAnomalies
      })

    watch(date, fetchAnomalies, { immediate: true })

    return {
      date,
      anomalies,
      isLoading,
      blockUser,
      deleteScores
    }
  },
  head() {
    return { title: this.$t('gmPanel.title') }
  }
})
</script>
