<template lang="pug">
.page.gm-panel-page
  GmPanel(:description="$t('gmPanel.ai.taggedRooms.description')")
    Loading(v-if="isLoading" color="var(--color-brand-02)")
    Empty(v-else-if="!rooms.length" image="search" :description="$t('gmPanel.ai.emptyRooms')")

    template(v-else)
      span.gm-panel__itemsTitle {{ $t('gmPanel.ai.roomCount', { count: total }) }}
      RoomList.gm-panel__rooms(:items="rooms" :is-active-infinite-loading="false" :show-ads="false")
        template(#card-extra="{ room }")
          .gm-panel__aiNote(:class="'gm-panel__aiNote--tagged'")
            strong {{ $t('gmPanel.ai.taggedRooms.aiTags') }}
            span {{ (room.aiTags || []).map(tag => `#${tag}`).join(' ') }}
            small {{ room.locale }} · {{ formatDate(room.aiTaggedAt) }}
      Pagination(v-if="pageCount > 1" v-model="page" mode="simple" :page-count="pageCount")
</template>

<script>
import { defineComponent, useStore, ref, watch } from '@nuxtjs/composition-api'
import { Loading, Empty, Pagination } from 'vant'
import { roomTransformer } from '@/transformers'

export default defineComponent({
  name: 'GmPanelAiTaggedRoomsPage',
  components: {
    Loading,
    Empty,
    Pagination
  },
  layout: 'Default/Default.layout',
  middleware: ['gm-control'],
  setup() {
    const store = useStore()

    const rooms = ref([])
    const isLoading = ref(false)
    const page = ref(1)
    const pageCount = ref(0)
    const total = ref(0)

    const fetchRooms = async () => {
      isLoading.value = true
      const { data } = await store.dispatch('gm/fetchAiRooms', { kind: 'tagged', page: page.value })

      // Keep the AI fields the card note shows next to the regular room shape
      rooms.value = (data?.data || []).map(room => ({ ...roomTransformer(room), ...pickAiFields(room) }))
      pageCount.value = data?.meta?.pagination?.pageCount || 0
      total.value = data?.meta?.pagination?.total || 0
      isLoading.value = false
    }

    const pickAiFields = ({ aiTags, aiTaggedAt, moderationNote, locale }) => ({ aiTags, aiTaggedAt, moderationNote, locale })

    const formatDate = value => (value ? new Date(value).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '')

    watch(page, fetchRooms, { immediate: true })

    return {
      rooms,
      isLoading,
      page,
      pageCount,
      total,
      formatDate
    }
  },
  head() {
    return { title: this.$t('gmPanel.title') }
  }
})
</script>
