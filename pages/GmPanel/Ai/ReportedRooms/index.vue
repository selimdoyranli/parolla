<template lang="pug">
.page.gm-panel-page
  GmPanel(:description="$t('gmPanel.ai.reportedRooms.description')")
    Loading(v-if="isLoading" color="var(--color-brand-02)")
    Empty(v-else-if="!rooms.length" image="search" :description="$t('gmPanel.ai.emptyRooms')")

    template(v-else)
      span.gm-panel__itemsTitle {{ $t('gmPanel.ai.roomCount', { count: total }) }}
      RoomList.gm-panel__rooms(:items="rooms" :is-active-infinite-loading="false" :show-ads="false")
        template(#card-extra="{ room }")
          .gm-panel__aiNote.gm-panel__aiNote--reported
            strong {{ $t('gmPanel.ai.reportedRooms.aiFlag') }}
            span {{ room.aiModerationFlag }}
            small {{ room.locale }} · {{ formatDate(room.aiFlaggedAt) }}
          .gm-panel__actions
            Button(v-bind="btn(room)" type="danger" @click.prevent.stop="askUnlist(room)") {{ $t('gmPanel.ai.reportedRooms.unlist') }}
            Button(v-bind="btn(room)" @click.prevent.stop="dismiss(room)") {{ $t('gmPanel.ai.reportedRooms.dismiss') }}
      Pagination(v-if="pageCount > 1" v-model="page" mode="simple" :page-count="pageCount")

    Dialog(
      v-model="unlistDialog.isOpen"
      show-cancel-button
      :title="$t('gmPanel.ai.reportedRooms.unlist')"
      :message="$t('gmPanel.ai.reportedRooms.confirmUnlist')"
      @confirm="unlist"
    )
      Field(
        v-model="unlistDialog.note"
        type="textarea"
        :placeholder="$t('gmPanel.ai.reportedRooms.notePlaceholder')"
        rows="2"
        autosize
        maxlength="1000"
      )
</template>

<script>
import { defineComponent, useContext, useStore, ref, reactive, watch } from '@nuxtjs/composition-api'
import { Loading, Empty, Pagination, Button, Field, Dialog } from 'vant'
import { roomTransformer } from '@/transformers'
import { showToast } from '@/helpers/toast'

export default defineComponent({
  name: 'GmPanelAiReportedRoomsPage',
  components: {
    Loading,
    Empty,
    Pagination,
    Button,
    Field,
    Dialog: Dialog.Component
  },
  layout: 'Default/Default.layout',
  middleware: ['gm-control'],
  setup() {
    const { i18n } = useContext()
    const store = useStore()

    const rooms = ref([])
    const isLoading = ref(false)
    const page = ref(1)
    const pageCount = ref(0)
    const total = ref(0)
    const busyId = ref(null)
    const unlistDialog = reactive({ isOpen: false, note: '', room: null })

    const pickAiFields = ({ documentId, aiModerationFlag, aiFlaggedAt, locale }) => ({
      documentId,
      aiModerationFlag,
      aiFlaggedAt,
      locale
    })

    const fetchRooms = async () => {
      isLoading.value = true
      const { data } = await store.dispatch('gm/fetchAiRooms', { kind: 'reported', page: page.value })

      // Keep the AI fields the card note and actions need next to the regular room shape
      rooms.value = (data?.data || []).map(room => ({ ...roomTransformer(room), ...pickAiFields(room) }))
      pageCount.value = data?.meta?.pagination?.pageCount || 0
      total.value = data?.meta?.pagination?.total || 0
      isLoading.value = false
    }

    const run = async (room, action, doneKey, payload = {}) => {
      busyId.value = room.documentId
      const { error } = await store.dispatch(`gm/${action}`, { documentId: room.documentId, locale: room.locale, ...payload })

      busyId.value = null

      if (error) {
        showToast.fail(error.message || i18n.t('error.anErrorOccurred'))

        return
      }

      showToast.success(i18n.t(doneKey))
      await fetchRooms()
    }

    // Opens with the AI's reason as the note, for the GM to keep or edit
    const askUnlist = room => Object.assign(unlistDialog, { isOpen: true, note: room.aiModerationFlag || '', room })
    const unlist = () => run(unlistDialog.room, 'unlistRoom', 'gmPanel.ai.reportedRooms.unlistedDone', { note: unlistDialog.note.trim() })
    const dismiss = room => run(room, 'dismissRoomAiFlag', 'gmPanel.ai.reportedRooms.dismissedDone')

    const btn = room => ({
      size: 'small',
      plain: true,
      round: true,
      nativeType: 'button',
      loading: busyId.value === room.documentId,
      disabled: !!busyId.value
    })

    const formatDate = value => (value ? new Date(value).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '')

    watch(page, fetchRooms, { immediate: true })

    return {
      rooms,
      isLoading,
      page,
      pageCount,
      total,
      unlistDialog,
      askUnlist,
      unlist,
      dismiss,
      btn,
      formatDate
    }
  },
  head() {
    return { title: this.$t('gmPanel.title') }
  }
})
</script>
