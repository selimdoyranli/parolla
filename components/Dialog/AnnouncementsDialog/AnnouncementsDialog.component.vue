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
import { defineComponent, useFetch, useContext, useStore, reactive, watch } from '@nuxtjs/composition-api'
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

          if (announcements.items.length > 0) {
            setAnnouncementsToLocalStorage(announcements.items)
          }
        }
      }
    )

    const { i18n } = useContext()
    const store = useStore()
    const { isoToHumanDate } = useFormatter()

    const announcements = reactive({
      items: [],
      meta: {},
      todaysAnnouncements: [],
      todaysAnnouncementsCount: 0
    })

    const setAnnouncementsToLocalStorage = announcements => {
      window.localStorage.setItem(`announcements_${i18n.locale}`, JSON.stringify(announcements))
    }

    const checkNewAnnouncements = announcements => {
      const storedAnnouncements = JSON.parse(window.localStorage.getItem(`announcements_${i18n.locale}`)) || []

      const newAnnouncements = announcements.filter(
        newAnnouncement => !storedAnnouncements.some(storedAnnouncement => storedAnnouncement.id === newAnnouncement.id)
      )

      return newAnnouncements.length
    }

    const { fetch, fetchState } = useFetch(async () => {
      const { data, error } = await store.dispatch('app/fetchAnnouncements')

      if (data) {
        announcements.items = data.data
        announcements.meta = data.meta

        let count = 0

        if (checkNewAnnouncements(data.data) > 0) {
          count = checkNewAnnouncements(data.data)
        } else {
          count = 0
        }
        emit('on-fetch-success', count)
      }
    })

    return { fetch, fetchState, state, announcements, isoToHumanDate }
  }
})
</script>

<style lang="scss" src="./AnnouncementsDialog.component.scss"></style>
