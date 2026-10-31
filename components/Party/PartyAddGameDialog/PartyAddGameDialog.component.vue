<template lang="pug">
Dialog.dialog.party-add(
  :value="value"
  show-cancel-button
  close-on-click-overlay
  get-container="body"
  :title="$t('party.add.title')"
  :show-confirm-button="false"
  :cancel-button-text="$t('general.close')"
  width="min(92vw, var(--layout-max-width))"
  @input="$emit('input', $event)"
)
  .party-add__toolbar
    span.party-pill {{ $t('party.add.inQueue', { count: queue.length }) }}

  //- the word-game sets (daily / unlimited) sit above the quiz list; the server loads them by these ids
  .party-add__modes
    button.party-add__mode(
      v-for="mode in modes"
      :key="mode.id"
      type="button"
      @click="add({ roomId: mode.id, title: $t(`party.add.modes.${mode.id}.title`) })"
    )
      span.party-add__mode-icon
        AppIcon(:name="mode.icon" :width="20" :height="20")
      span.party-add__mode-text
        strong {{ $t(`party.add.modes.${mode.id}.title`) }}
        small {{ $t(`party.add.modes.${mode.id}.text`) }}
      AppIcon.party-add__mode-plus(name="tabler:plus" :width="18" :height="18")

  //- same head as the quizzes page (no flashcards: the party engine only runs qa + choices)
  RoomListHead.party-add__head(:total="total" :kinds="kinds" :kind="kind" @refresh="reload" @kind="setKind" @sort="setSort")

  Search.party-add__search(v-model="keyword" :placeholder="$t('party.add.search')" shape="round" :clearable="false" @input="onSearch")

  //- infinite-wrapper: the dialog body scrolls, not the page
  .party-add__body(infinite-wrapper)
    .party-add__loading(v-if="loading && !rooms.length")
      Loading(color="var(--color-brand-02)")
    Empty(v-else-if="!rooms.length" :description="$t('party.add.empty')")
    template(v-else)
      //- same grid as the quiz list (RoomList)
      .party-add__grid
        //- the card is a router link whose own handler runs first: stop the click in the capture phase so it never navigates
        .party-add__item(v-for="room in rooms" :key="room.documentId || room.roomId" @click.capture.prevent.stop="add(room)")
          QuizCard(hide-owner-actions :room="room")
          span.party-add__added(v-if="addedIds.has(String(room.roomId))")
            AppIcon(name="tabler:check" :width="14" :height="14")
            | {{ $t('party.add.added') }}
      //- identifier resets the loader on a new tab/search (same pattern as the post composer picker)
      InfiniteLoading(v-if="hasMore" force-use-infinite-wrapper :identifier="seqId" @infinite="loadMore")
        template(#spinner)
          .party-add__loading
            Loading(color="var(--color-brand-02)" size="20")
        template(#no-more)
          span
        template(#no-results)
          span
        template(#error="{ trigger }")
          Button(size="small" round native-type="button" @click="trigger") {{ $t('error.tryAgain') }}
</template>

<script>
import { defineComponent, ref, computed, watch, inject, useContext, useStore } from '@nuxtjs/composition-api'
import { Dialog, Search, Loading, Empty, Button, Notify } from 'vant'
import InfiniteLoading from 'vue-infinite-loading'
import { useDebounceFn } from '@vueuse/core'
import { roomTransformer } from '@/transformers'
import { wsTypeEnum } from '@/enums/wsType.enum'
import { roomSortParam, applyQuizKindFilter } from '@/helpers/roomListQuery'

const MODES = [
  { id: 'daily', icon: 'tabler:calendar-event' },
  { id: 'unlimited', icon: 'tabler:infinity' }
]
const KINDS = ['qa', 'media', 'choices', 'trivia']
const PAGE_SIZE = 12

export default defineComponent({
  components: { Dialog: Dialog.Component, Search, Loading, Empty, Button, InfiniteLoading },
  props: { value: { type: Boolean, default: false } },
  emits: ['input'],
  setup(props, { emit }) {
    const { app, i18n } = useContext()
    const store = useStore()
    const send = inject('partySend')
    const queue = computed(() => store.getters['party/queue'])
    const addedIds = computed(() => new Set(queue.value.map(item => String(item.roomId))))

    // same defaults as the quizzes page: every kind, newest first
    const kind = ref(null)
    const sort = ref('recently')
    const total = ref(0)
    const keyword = ref('')
    const rooms = ref([])
    const page = ref(1)
    const hasMore = ref(false)
    const loading = ref(false)
    let seq = 0 // drops late responses from a tab/keyword that is no longer current
    const seqId = ref(0)

    // calls the API directly: creator/fetchRooms would overwrite the /quizler list in the store
    const load = async more => {
      const mine = ++seq

      if (!more) seqId.value = mine
      loading.value = true
      page.value = more ? page.value + 1 : 1

      const query = {
        'filters[isVisible][$eq]': true,
        'pagination[page]': page.value,
        'pagination[pageSize]': PAGE_SIZE,
        sort: roomSortParam(sort.value),
        'populate[user][populate][0]': 'diceBear',
        'populate[user][populate][1]': 'role',
        populate: 'roomTags',
        locale: i18n.locale
      }

      if (kind.value) {
        applyQuizKindFilter(query, kind.value)
      } else {
        // "all" = everything but flashcards; old rows have no quizType and count as plain qa quizzes
        query['filters[$or][0][quizType][$ne]'] = 'flashcards'
        query['filters[$or][1][quizType][$null]'] = true
      }

      const text = keyword.value.trim()

      if (text) query['filters[title][$containsi]'] = text

      try {
        const { data } = await app.$appFetch({
          method: 'GET',
          path: 'rooms',
          query,
          headers: { Authorization: `${app.$auth.strategy.token.get()}` }
        })

        // a late response from a tab/keyword that is no longer current
        if (mine !== seq || !data) return false

        const next = data.data.map(room => roomTransformer(room))
        rooms.value = more ? rooms.value.concat(next) : next
        hasMore.value = page.value < data.meta.pagination.pageCount
        total.value = data.meta.pagination.total

        return true
      } catch {
        // keeps what is on screen; the infinite loader shows its retry
        if (more) page.value -= 1

        return false
      } finally {
        if (mine === seq) loading.value = false
      }
    }

    const loadMore = async $state => {
      const mine = seq + 1
      const ok = await load(true)

      // a newer tab/search took over; its own loader instance carries on
      if (mine !== seq) return

      if (!ok) return $state.error()

      return hasMore.value ? $state.loaded() : $state.complete()
    }

    const onSearch = useDebounceFn(() => load(false), 500)

    const reload = () => {
      rooms.value = []
      hasMore.value = false
      load(false)
    }

    const setKind = key => {
      kind.value = key
      reload()
    }

    const setSort = key => {
      sort.value = key
      reload()
    }
    // lazy first load; reopening keeps the list
    watch(
      () => props.value,
      open => open && !rooms.value.length && load(false),
      { immediate: true }
    )

    // success is only claimed once the server's room state shows the entry; failures arrive as party_error toasts
    let pendingTitle = null
    let pendingTimer = null
    const settle = () => {
      clearTimeout(pendingTimer)
      pendingTitle = null
    }

    watch(
      () => queue.value.length,
      (now, before) => {
        if (pendingTitle && now > before) {
          Notify({ message: i18n.t('party.add.addedToast', { title: pendingTitle }), type: 'success', duration: 1500 })
          settle()
        }
      }
    )

    const add = room => {
      if (queue.value.length >= 20) {
        Notify({ message: i18n.t('party.add.full'), type: 'warning', duration: 2000 })

        return
      }

      // the server loads the quiz itself, so only the id and locale travel
      settle()
      pendingTitle = room.title
      pendingTimer = setTimeout(settle, 4000)
      send(wsTypeEnum.PARTY_QUEUE_ADD, { roomId: room.roomId, locale: i18n.locale })
      emit('input', false)
    }

    return {
      modes: MODES,
      kinds: KINDS,
      kind,
      total,
      queue,
      addedIds,
      keyword,
      rooms,
      hasMore,
      loading,
      seqId,
      loadMore,
      onSearch,
      reload,
      setKind,
      setSort,
      add
    }
  }
})
</script>

<style lang="scss" src="./PartyAddGameDialog.component.scss"></style>
