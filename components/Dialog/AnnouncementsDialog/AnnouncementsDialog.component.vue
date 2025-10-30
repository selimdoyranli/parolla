<template lang="pug">
Dialog.dialog.announcements-dialog(
  v-model="state.isOpen"
  :title="$t('dialog.announcements.title')"
  :cancel-button-text="cancelButtonText || $t('general.close')"
  :show-confirm-button="false"
  :show-cancel-button="true"
  :close-on-click-overlay="false"
  @closed="$emit('closed')"
  @opened="$emit('opened')"
)
  template(v-if="fetchState.pending")
    Loading(color="var(--color-brand-02)") {{ $t('general.loading') }}...

  template(v-else-if="fetchState.error")
    Empty(image="error" :description="$t('error.anErrorOccurred')")
      Button(@click="fetch") {{ $t('error.tryAgain') }}

  template(v-else)
    CellGroup.announcements(v-if="announcements.items.length > 0")
      Cell.announcement(v-for="announcement in announcements.items" :key="announcement.id" inset)
        template(#title)
          small {{ isoToHumanDate(announcement.createdAt, { showDay: true, showMonth: true, showYear: true }) }}
          p {{ announcement.content }}
    template(v-else)
      Empty(:description="$t('general.noData')")
        Button(color="var(--color-brand-02)" @click="fetch")
          span.d-flex
            AppIcon(name="tabler:refresh" :width="16" :height="16")
            | &nbsp;{{ $t('general.refresh') }}
</template>

<script>
import { defineComponent, useFetch, useStore, reactive, watch } from '@nuxtjs/composition-api'
import { Dialog, Loading, Empty, Button, Cell, CellGroup } from 'vant'

export default defineComponent({
  components: {
    Dialog: Dialog.Component,
    Loading,
    Empty,
    Button,
    Cell,
    CellGroup
  },
  props: {
    isOpen: {
      type: Boolean,
      required: false,
      default: false
    },
    cancelButtonText: {
      type: String,
      required: false,
      default: null
    }
  },
  setup(props, { emit }) {
    const state = reactive({
      isOpen: props.isOpen
    })

    watch(
      () => props.isOpen,
      value => {
        state.isOpen = value

        if (value) {
          fetch()
        }
      }
    )

    const store = useStore()
    const { isoToHumanDate } = useFormatter()

    const announcements = reactive({
      items: [],
      meta: {},
      todaysAnnouncements: [],
      todaysAnnouncementsCount: 0
    })

    const { fetch, fetchState } = useFetch(async () => {
      const { data, error } = await store.dispatch('app/fetchAnnouncements')

      if (data) {
        announcements.items = data.data
        announcements.meta = data.meta

        const todaysDate = new Date().setHours(0, 0, 0, 0)
        const todaysAnnouncements = data.data.filter(announcement => new Date(announcement.createdAt).setHours(0, 0, 0, 0) === todaysDate)

        announcements.todaysAnnouncements = todaysAnnouncements
        announcements.todaysAnnouncementsCount = todaysAnnouncements?.length || 0

        emit('on-fetch-success', announcements.todaysAnnouncementsCount)
      }
    })

    return { fetch, fetchState, state, announcements, isoToHumanDate }
  }
})
</script>

<style lang="scss" src="./AnnouncementsDialog.component.scss"></style>
