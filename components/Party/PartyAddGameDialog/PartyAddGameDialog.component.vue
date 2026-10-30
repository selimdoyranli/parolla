<template lang="pug">
Popup.party-add(:value="value" position="bottom" round get-container="body" :style="{ height: '88%' }" @input="$emit('input', $event)")
  .party-add__inner
    header.party-add__head
      h3.party-add__title {{ $t('party.add.title') }}
      span.party-pill {{ $t('party.add.inQueue', { count: queue.length }) }}
      button.party-add__close(type="button" :aria-label="$t('general.close')" @click="$emit('input', false)")
        AppIcon(name="tabler:x" :width="18" :height="18")

    .party-add__tabs(role="tablist")
      button.party-add__tab(
        v-for="tab in TABS"
        :key="tab"
        type="button"
        role="tab"
        :aria-selected="String(type === tab)"
        :class="{ 'party-add__tab--active': type === tab }"
        @click="type = tab"
      ) {{ $t(`party.lobby.types.${tab}`) }}

    Search.party-add__search(v-model="keyword" :placeholder="$t(`party.add.search.${type}`)" :clearable="false" @input="onSearch")

    .party-add__body
      .party-add__loading(v-if="loading && !rooms.length")
        Loading(color="var(--color-brand-02)")
      Empty(v-else-if="!rooms.length" :description="$t('party.add.empty')")
      template(v-else)
        .party-add__grid
          .party-add__item(v-for="room in rooms" :key="room.documentId || room.roomId")
            //- the card is a router link: swallow the navigation, the click picks the quiz
            QuizCard(hide-owner-actions :room="room" @click.native.prevent="add(room)")
            span.party-add__added(v-if="addedIds.has(String(room.roomId))")
              AppIcon(name="tabler:check" :width="14" :height="14")
              | {{ $t('party.add.added') }}
        Button.party-add__more(v-if="hasMore" round block plain :loading="loading" @click="load(true)") {{ $t('party.add.more') }}
</template>

<script>
import { defineComponent, ref, computed, watch, inject, useContext, useStore } from '@nuxtjs/composition-api'
import { Popup, Search, Loading, Empty, Button, Notify } from 'vant'
import { useDebounceFn } from '@vueuse/core'
import { roomTransformer } from '@/transformers'
import { wsTypeEnum } from '@/enums/wsType.enum'

// flashcards are deliberately absent: the party engine only runs qa + choices
const TABS = ['qa', 'choices']
const PAGE_SIZE = 12

export default defineComponent({
  components: { Popup, Search, Loading, Empty, Button },
  props: { value: { type: Boolean, default: false } },
  emits: ['input'],
  setup(props, { emit }) {
    const { app, i18n } = useContext()
    const store = useStore()
    const send = inject('partySend')
    const queue = computed(() => store.getters['party/queue'])
    const addedIds = computed(() => new Set(queue.value.map(item => String(item.roomId))))

    const type = ref(TABS[0])
    const keyword = ref('')
    const rooms = ref([])
    const page = ref(1)
    const hasMore = ref(false)
    const loading = ref(false)
    let seq = 0 // drops late responses from a tab/keyword that is no longer current

    // calls the API directly: creator/fetchRooms would overwrite the /quizler list in the store
    const load = async more => {
      const mine = ++seq
      loading.value = true
      page.value = more ? page.value + 1 : 1

      const query = {
        'filters[isVisible][$eq]': true,
        'pagination[page]': page.value,
        'pagination[pageSize]': PAGE_SIZE,
        sort: 'viewCount:desc',
        'populate[user][populate][0]': 'diceBear',
        'populate[user][populate][1]': 'role',
        populate: 'roomTags',
        locale: i18n.locale
      }

      if (type.value === 'choices') {
        query['filters[quizType][$eq]'] = 'choices'
      } else {
        // old rows have no quizType and count as plain qa quizzes
        query['filters[$or][0][quizType][$eq]'] = 'qa'
        query['filters[$or][1][quizType][$null]'] = true
      }

      const text = keyword.value.trim()

      if (text) query['filters[title][$containsi]'] = text

      const { data } = await app.$appFetch({
        method: 'GET',
        path: 'rooms',
        query,
        headers: { Authorization: `${app.$auth.strategy.token.get()}` }
      })

      if (mine !== seq) return

      loading.value = false

      if (!data) return

      const next = data.data.map(room => roomTransformer(room))
      rooms.value = more ? rooms.value.concat(next) : next
      hasMore.value = page.value < data.meta.pagination.pageCount
    }

    const onSearch = useDebounceFn(() => load(false), 500)

    watch(type, () => load(false))
    // lazy first load; reopening keeps the list
    watch(
      () => props.value,
      open => open && !rooms.value.length && load(false),
      { immediate: true }
    )

    const add = room => {
      if (queue.value.length >= 20) {
        Notify({ message: i18n.t('party.add.full'), type: 'warning', duration: 2000 })

        return
      }

      // the server loads the quiz itself, so only the id and locale travel
      send(wsTypeEnum.PARTY_QUEUE_ADD, { roomId: room.roomId, locale: i18n.locale })
      Notify({ message: i18n.t('party.add.addedToast', { title: room.title }), type: 'success', duration: 1500 })
    }

    return { TABS, queue, addedIds, type, keyword, rooms, hasMore, loading, load, onSearch, add }
  }
})
</script>

<style lang="scss" src="./PartyAddGameDialog.component.scss" scoped></style>
