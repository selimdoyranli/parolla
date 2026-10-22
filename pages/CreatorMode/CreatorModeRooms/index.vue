<template lang="pug">
.page.creator-mode-rooms-page
  .page.creator-mode-rooms-page__inner
    .creator-mode-rooms-page-header
      h2.creator-mode-rooms-page__title(align="center") {{ $t('creatorModeRooms.title') }}
      Button(color="#ff7878" icon="plus" round size="normal" @click="openCreateQuizSelectionDialog")
        | {{ $t('form.creatorModeCompose.title') }}

    br

    .creator-mode-rooms-page-rooms
      .creator-mode-rooms-page-rooms-head
        .creator-mode-rooms-page__title.creator-mode-rooms-page__title--rooms
          h3 {{ $t('creatorModeRooms.rooms.selectFromList') }} ({{ roomTotal }})
        .creator-mode-rooms-page-rooms-head__actions
          Button.creator-mode-rooms-page-rooms__refetchButton.me-1(icon="replay" size="small" round @click="fetch")
            | {{ $t('creatorModeRooms.rooms.refresh') }}
          FilterDropdown.creator-mode-rooms-page-rooms__kindFilter(
            :trigger-title="$t('creatorModeRooms.rooms.quizKind.title')"
            :selected="selectedQuizKindOption"
            :options="quizKindOptions"
            @on-select-option="handleQuizKindSelect"
          )
            template(#selected="{ option }")
              QuizTypeLabel(v-if="option.key" :kind="option.key")
              template(v-else)
                AppIcon.filter-dropdown-trigger-button__icon(:name="option.icon")
                span.filter-dropdown-trigger-button__title {{ option.label }}
            template(#option="{ option }")
              QuizTypeLabel(v-if="option.key" :kind="option.key")
              template(v-else)
                AppIcon.filter-dropdown-nav-item__icon(:name="option.icon" :width="20" :height="20")
                span.filter-dropdown-nav-item__title {{ option.label }}
          FilterDropdown.creator-mode-rooms-page-rooms__sortFilter.ms-1(
            :trigger-title="$t('creatorModeRooms.rooms.filters.title')"
            :options="filterOptions"
            @on-select-option="handleFilterOptionSelect"
          )

      template(v-if="fetchState.pending")
        Empty(:description="$t('creatorModeRooms.rooms.pendingRooms')")

      template(v-else-if="fetchState.error")
        Empty(image="error" :description="$t('creatorModeRooms.error.rooms.fetch.description')")
          Button(@click="fetch") {{ $t('creatorModeRooms.error.rooms.fetch.action') }}

      template(v-else)
        RoomFeaturedTagList(v-if="$i18n.locale === $i18n.defaultLocale" @on-tag-click="handleFeaturedTagClick")
        .creator-mode-rooms-page-rooms__list
          RoomList(ref="roomList" :items="rooms")
          //- a tag / type pick refetches page 1; cover the old list so the click visibly does something
          .creator-mode-rooms-page-rooms__loading(v-if="isListLoading")
            Loading(color="var(--color-brand-02)" size="32")
          //- sticks to the bottom-right while the list is on screen
          .creator-mode-rooms-page-rooms__toTop
            button.creator-mode-rooms-page-rooms__toTopButton(
              type="button"
              :class="{ 'is-visible': isToTopVisible }"
              :aria-label="$t('general.backToTop')"
              :aria-hidden="String(!isToTopVisible)"
              :tabindex="isToTopVisible ? 0 : -1"
              @click="scrollToTop"
            )
              AppIcon(name="tabler:chevron-up" :width="24" :height="24")

  CreateQuizSelectionDialog(:isOpen="isOpenCreateQuizSelectionDialog" @closed="isOpenCreateQuizSelectionDialog = false")
</template>

<script>
import {
  defineComponent,
  useFetch,
  useRouter,
  useContext,
  useStore,
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
  useMeta
} from '@nuxtjs/composition-api'
import { Button, Empty, Loading } from 'vant'

// outlives the page component: coming back from a quiz keeps the loaded pages and the scroll spot
const listMemory = { key: null, keyword: '', scrollTop: 0 }

export default defineComponent({
  components: {
    Button,
    Empty,
    Loading
  },
  beforeRouteLeave(to, from, next) {
    this.rememberListPosition()
    next()
  },
  layout: 'Default/Default.layout',
  setup() {
    const router = useRouter()
    const { localePath, i18n, route } = useContext()
    const store = useStore()

    const isOpenCreateQuizSelectionDialog = ref(false)

    const openCreateQuizSelectionDialog = () => {
      isOpenCreateQuizSelectionDialog.value = true
    }

    const closeCreateQuizSelectionDialog = () => {
      isOpenCreateQuizSelectionDialog.value = false
    }

    const roomList = ref(null)
    const scroller = () => document.querySelector('.layout__main')
    const listKey = () =>
      [route.value.query.tags || '', store.state.creator.room.sort, store.state.creator.room.quizKind, i18n.locale].join('|')

    // same list still in the store → skip the page-1 refetch and restore the scroll instead
    let restoreScrollTop = store.getters['creator/rooms'].length > 0 && listMemory.key === listKey() ? listMemory.scrollTop : null

    const restoreScroll = () => {
      if (restoreScrollTop === null || fetchState.pending) {
        return
      }

      const top = restoreScrollTop

      restoreScrollTop = null
      nextTick(() => {
        // RoomList keeps the search in local state; put it back so the field and the next pages match the list
        if (roomList.value) {
          roomList.value.form.search.keyword = listMemory.keyword
        }

        scroller()?.scrollTo(0, top)
      })
    }

    const rememberListPosition = () => {
      listMemory.key = listKey()
      listMemory.keyword = roomList.value?.form.search.keyword || ''
      listMemory.scrollTop = scroller()?.scrollTop || 0
    }

    // Fetch Rooms
    const { fetch, fetchState } = useFetch(async () => {
      if (restoreScrollTop !== null) {
        return
      }

      await store.dispatch('creator/fetchRooms', {
        tags: route.value.query.tags ? route.value.query.tags.split(',') : [],
        isVisible: true,
        isLoadMore: false
      })
    })

    onMounted(restoreScroll)

    // back-to-top shows once the player is about a screen down the list
    const isToTopVisible = ref(false)
    const updateToTop = () => {
      isToTopVisible.value = (scroller()?.scrollTop || 0) > window.innerHeight
    }
    const scrollToTop = () => scroller()?.scrollTo({ top: 0, behavior: 'smooth' })

    onMounted(() => {
      scroller()?.addEventListener('scroll', updateToTop, { passive: true })
      updateToTop()
    })
    onBeforeUnmount(() => scroller()?.removeEventListener('scroll', updateToTop))
    watch(() => fetchState.pending, restoreScroll)

    const rooms = computed(() => store.getters['creator/rooms'])
    const roomTotal = computed(() => store.getters['creator/roomTotal'])

    const filterOptions = computed(() => {
      return [
        {
          key: 'recently',
          label: i18n.t('creatorModeRooms.rooms.filters.recently'),
          icon: 'tabler:clock-up'
        },
        {
          key: 'byViewCount',
          label: i18n.t('creatorModeRooms.rooms.filters.byViewCount'),
          icon: 'tabler:chevrons-up'
        },
        {
          key: 'oldest',
          label: i18n.t('creatorModeRooms.rooms.filters.oldest'),
          icon: 'tabler:clock-down'
        }
      ]
    })

    const handleFilterOptionSelect = option => {
      store.commit('creator/SET_ROOMS_SORT', option.key)

      fetch()
    }

    const isListLoading = ref(false)

    const reloadRooms = async ({ tags, keyword }) => {
      isListLoading.value = true

      try {
        await store.dispatch('creator/fetchRooms', { tags, keyword, isVisible: true, isLoadMore: false })
      } finally {
        isListLoading.value = false
      }
    }

    const handleFeaturedTagClick = async ({ tagsFilter }) => {
      router.push(localePath({ name: 'CreatorMode-CreatorModeRooms', query: tagsFilter ? { tags: tagsFilter } : {} }))
      await reloadRooms({ tags: tagsFilter ? tagsFilter.split(',') : [] })
    }

    const quizKindOptions = computed(() => [
      { key: null, label: i18n.t('creatorModeRooms.rooms.quizKind.all'), icon: 'tabler:category' },
      ...['qa', 'media', 'choices', 'trivia', 'flashcards'].map(key => ({ key }))
    ])

    // always an option (null kind → "all"): with no selection FilterDropdown falls back to the first pick it saw
    const selectedQuizKindOption = computed(() => quizKindOptions.value.find(option => option.key === store.state.creator.room.quizKind))

    const handleQuizKindSelect = async ({ key }) => {
      store.commit('creator/SET_ROOMS_QUIZ_KIND', key)

      const tags = route.value.query.tags

      // keep the current tag filter, or the typed search when there is no tag
      await reloadRooms(tags ? { tags: tags.split(',') } : { tags: [], keyword: roomList.value?.form.search.keyword })
    }

    const isEmptyRoomList = computed(() => {
      if (rooms.value.length <= 0) {
        return true
      }
    })

    useMeta(() => ({
      title: `${i18n.t('seo.creatorModeQuizzes.title')} - ${i18n.t('seo.main.title')}`,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: i18n.t('seo.creatorModeQuizzes.description')
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content: `${i18n.t('seo.creatorModeQuizzes.title')} - ${i18n.t('seo.main.title')}`
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: `${i18n.t('seo.creatorModeQuizzes.title')} - ${i18n.t('seo.main.title')}`
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: i18n.t('seo.creatorModeQuizzes.description')
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: i18n.t('seo.creatorModeQuizzes.description')
        },
        {
          hid: 'keywords',
          name: 'keywords',
          content: i18n.t('seo.creatorModeQuizzes.keywords')
        }
      ]
    }))

    return {
      roomList,
      rememberListPosition,
      isOpenCreateQuizSelectionDialog,
      openCreateQuizSelectionDialog,
      closeCreateQuizSelectionDialog,
      fetch,
      fetchState,
      rooms,
      roomTotal,
      filterOptions,
      handleFilterOptionSelect,
      isListLoading,
      isToTopVisible,
      scrollToTop,
      handleFeaturedTagClick,
      quizKindOptions,
      selectedQuizKindOption,
      handleQuizKindSelect,
      isEmptyRoomList
    }
  },
  head: {}
})
</script>

<style lang="scss" src="./CreatorModeRooms.page.scss"></style>
