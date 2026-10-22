<template lang="pug">
.room-list
  Search.room-list__searchField(
    v-model="form.search.keyword"
    :placeholder="searchFieldPlaceholder"
    :clearable="false"
    @input="handleSearchRoom"
  )
    template(#right-icon)
      Loading(v-if="form.search.isBusy" color="var(--color-info-01)" size="16")
      //- own clear button: vant 2's clear icon only listens to touchstart, so a mouse click does nothing
      ActionButton(v-else-if="form.search.keyword" icon="tabler:x" :aria-label="$t('general.clear')" @click="clearSearch")

  template(v-if="items && items.length <= 0")
    Empty(:description="$t('creatorModeRooms.rooms.empty.description')")
      Button(
        type="info"
        icon="plus"
        native-type="button"
        round
        @click="$router.push(localePath({ name: 'CreatorMode-CreatorModeCompose' }))"
      ) {{ $t('creatorModeRooms.rooms.empty.action') }}

  template(v-else)
    .room-list__grid
      template(v-for="cell in cells")
        //- full-row horizontal ad after every 6 cells (three rows)
        InlineAd.room-list__banner(:key="cell.key" v-if="cell.type === 'banner'" lazy :data-ad-slot="4450666221")

        //- card-sized ad: every 5th cell, fills the quiz card's height
        .room-list__ad(:key="cell.key" v-else-if="cell.type === 'ad'")
          small.room-list__ad-label {{ $t('general.ad') }}
          AppAd(lazy format="rectangle" :data-ad-slot="6048083070")

        QuizCard(
          v-else
          :key="cell.key"
          :room="cell.room"
          :viewer="user"
          :userScoped="userScoped"
          :index="cell.index"
          @edit="handleEditRoom"
          @delete="handleDeleteRoom"
        )
          template(v-if="$scopedSlots['card-extra']" #extra)
            slot(name="card-extra" :room="cell.room")

  InfiniteLoading(v-if="isActiveInfiniteLoading && list.items.length >= 10" @infinite="handleInfiniteLoading")
</template>

<script>
import { defineComponent, useContext, useRouter, useStore, reactive, computed, watch } from '@nuxtjs/composition-api'
import { useDebounceFn } from '@vueuse/core'
import { Search, List, Cell, Button, Empty, Loading, Dialog, Notify, Tag, Toast } from 'vant'
import InfiniteLoading from 'vue-infinite-loading'
import { ROOM_FEATURED_TAGS } from '@/system/constant'

export default defineComponent({
  components: {
    Search,
    List,
    InfiniteLoading,
    Cell,
    Button,
    Empty,
    Loading,
    Dialog,
    Notify,
    Tag,
    Toast
  },
  props: {
    items: {
      type: Array,
      required: false,
      default: null
    },
    user: {
      type: Object,
      required: false,
      default: null
    },
    isActiveInfiniteLoading: {
      type: Boolean,
      required: false,
      default: true
    },
    userScoped: {
      type: Boolean,
      required: false,
      default: false
    },
    showAds: {
      type: Boolean,
      required: false,
      default: true
    }
  },
  setup(props, { emit }) {
    const { i18n, localePath, route } = useContext()
    const router = useRouter()
    const store = useStore()

    const paginationGetter = computed(() => (props.userScoped ? 'creator/userRoomsPagination' : 'creator/roomsPagination'))
    const fetchActionName = computed(() => (props.userScoped ? 'creator/fetchUserRooms' : 'creator/fetchRooms'))

    const pagination = computed(() => store.getters[paginationGetter.value])

    // Scoped (profile) lists honour owner-only filters when the auth user is
    // looking at their own quizzes — drafts and unlisted rooms come through.
    const authedUser = computed(() => store.getters['auth/user'])
    const isOwnUserFilter = computed(
      () => props.userScoped && !!(authedUser.value?.id && props.user?.id && Number(authedUser.value.id) === Number(props.user.id))
    )

    const list = reactive({
      items: props.items,
      originalItems: props.items
    })

    watch(
      () => props.items,
      value => {
        list.items = value
        list.originalItems = value
      }
    )

    const handleInfiniteLoading = async $state => {
      const { data, error } = await store.dispatch(fetchActionName.value, {
        isVisible: true,
        isLoadMore: true,
        page: pagination.value.page + 1,
        // with a tag filter the field only shows its label; the tags do the filtering
        keyword: route.value.query.tags ? '' : form.search.keyword,
        tags: route.value.query.tags ? route.value.query.tags.split(',') : [],
        user: props.user?.id,
        includeDrafts: isOwnUserFilter.value,
        includeUnlisted: isOwnUserFilter.value
      })

      $state.loaded()

      if (data?.data.length === 0) {
        $state.complete()

        return false
      }

      if (error) {
        $state.error()

        return false
      }
    }

    const form = reactive({
      search: {
        isBusy: false,
        keyword: ''
      }
    })

    const resetKeyword = () => {
      form.search.keyword = ''
    }

    // the field mirrors the active tag filter: the featured chip's title, else the raw tags as #hashtags
    const tagsLabel = tags => {
      const featured = ROOM_FEATURED_TAGS.find(
        tag => tag.tagsFilter?.toLocaleLowerCase(i18n.locale) === tags.toLocaleLowerCase(i18n.locale)
      )

      return featured ? featured.title : `#${tags.split(',').join(' #')}`
    }

    let tagKeyword = ''

    watch(
      () => route.value.query.tags,
      value => {
        if (props.user) {
          return
        }

        if (value) {
          tagKeyword = tagsLabel(value)
          form.search.keyword = tagKeyword
        } else {
          // keep what the user typed when that text is what dropped the tags
          if (form.search.keyword === tagKeyword) {
            resetKeyword()
          }

          tagKeyword = ''
        }
      },
      { immediate: true }
    )

    const runSearch = async () => {
      if (props.isActiveInfiniteLoading) {
        if (!props.user) {
          // field still shows the tag label: the tag-filtered list is already what it says
          if (route.value.query.tags && form.search.keyword === tagKeyword) {
            form.search.isBusy = false

            return
          }

          if (form.search.keyword.includes('#')) {
            const tag = form.search.keyword.replace('#', '')
            router.push(localePath({ name: 'CreatorMode-CreatorModeRooms', query: { tags: tag } }))
          } else if (route.value.query.tags) {
            // emptied or edited the tag label → leave the tag filter ("Tümü" when empty)
            router.push(localePath({ name: 'CreatorMode-CreatorModeRooms' }))
          }
        }

        await store.dispatch(fetchActionName.value, {
          isVisible: true,
          keyword: form.search.keyword,
          user: props.user?.id,
          includeDrafts: isOwnUserFilter.value,
          includeUnlisted: isOwnUserFilter.value
        })
      } else {
        if (form.search.keyword.trim() === '') {
          list.items = list.originalItems.slice()
        } else {
          list.items = list.originalItems.filter(room => {
            return room.title.toLowerCase().includes(form.search.keyword.toLowerCase())
          })
        }
      }

      form.search.isBusy = false
    }

    // empty keywords skip the debounce (handled at once below), so a late call can't reset the list again
    const fetchRooms = useDebounceFn(
      async () => {
        if (form.search.keyword) {
          await runSearch()
        }
      },
      1000,
      { maxWait: 5000 }
    )

    const handleSearchRoom = async () => {
      form.search.isBusy = true
      // emptied (clear button or deleted) → back to "Tümü" right away
      await (form.search.keyword ? fetchRooms() : runSearch())
    }

    const clearSearch = () => {
      form.search.keyword = ''
      handleSearchRoom()
    }

    const handleEditRoom = async ({ room }) => {
      router.push(localePath({ name: 'CreatorMode-CreatorModeEdit-slug', params: { slug: room.roomId } }))
    }

    const handleDeleteRoom = async ({ room }) => {
      Dialog.confirm({
        title: i18n.t('general.delete'),
        message: `${i18n.t('general.delete')}: ${room.title}`,
        cancelButtonText: i18n.t('general.cancel'),
        confirmButtonText: i18n.t('general.delete')
      }).then(() => {
        deleteRoom({ documentId: room.documentId })
      })
    }

    const deleteRoom = async ({ documentId }) => {
      Toast.loading({
        message: i18n.t('creatorModeMyRooms.delete.deleting'),
        duration: 0,
        forbidClick: true,
        overlay: true,
        closeOnClickOverlay: false
      })

      const { data, error } = await store.dispatch('creator/deleteRoom', { documentId })

      if (data) {
        Notify({
          message: i18n.t('creatorModeMyRooms.delete.callback.success'),
          color: 'var(--color-text-04)',
          background: 'var(--color-success-01)',
          duration: 3000
        })

        list.items = list.items.filter(room => room.documentId !== documentId)

        emit('on-delete-room', { documentId })
      }

      if (error) {
        Notify({
          message: error.message,
          color: 'var(--color-text-04)',
          background: 'var(--color-danger-01)',
          duration: 1000
        })
      }

      Toast.clear()
    }

    // grid cells: a card-sized ad after every 4 quizzes (every 5th cell), a full-row ad after every 6 cells
    // capped: infinite scroll stays one SPA page view, and AdSense leaves the extra slots unfilled
    const MAX_LIST_ADS = 4
    const cells = computed(() => {
      const result = []
      let count = 0
      let ads = 0
      const canAd = () => props.showAds && ads < MAX_LIST_ADS
      const push = cell => {
        if (canAd() && count > 0 && count % 6 === 0) {
          result.push({ type: 'banner', key: `banner-${count}` })
          ads++
        }

        result.push(cell)
        count++
      }

      ;(list.items || []).forEach((room, index) => {
        push({ type: 'room', room, index, key: room.documentId || room.roomId })

        if (canAd() && (index + 1) % 4 === 0) {
          ads++
          push({ type: 'ad', key: `ad-${index}` })
        }
      })

      return result
    })

    const searchFieldPlaceholder = computed(() => {
      if (props.user) {
        return i18n.t('creatorModeRooms.rooms.searchField.searchRoom.placeholder')
      }

      return i18n.t('creatorModeRooms.rooms.searchField.searchRoomOrTag.placeholder')
    })

    return {
      list,
      cells,
      pagination,
      handleInfiniteLoading,
      form,
      handleSearchRoom,
      clearSearch,
      handleEditRoom,
      handleDeleteRoom,
      searchFieldPlaceholder
    }
  }
})
</script>

<style lang="scss" src="./RoomList.component.scss"></style>
