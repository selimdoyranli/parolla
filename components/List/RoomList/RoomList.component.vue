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
      template(v-for="(room, index) in list.items")
        QuizCard(
          :key="room.documentId || room.roomId"
          :room="room"
          :viewer="user"
          :userScoped="userScoped"
          :index="index"
          @edit="handleEditRoom"
          @delete="handleDeleteRoom"
        )

        // Ad
        template(v-if="(index + 1) % 4 === 0")
          .room-list__ad(:key="`ad-${index}`")
            small.room-list__ad-label {{ $t('general.ad') }}
            AppAd(:data-ad-slot="6048083070")

  InfiniteLoading(v-if="isActiveInfiniteLoading && list.items.length >= 10" @infinite="handleInfiniteLoading")
</template>

<script>
import { defineComponent, useContext, useRouter, useStore, reactive, computed, watch } from '@nuxtjs/composition-api'
import { useDebounceFn } from '@vueuse/core'
import { Search, List, Cell, Button, Empty, Loading, Dialog, Notify, Tag, Toast } from 'vant'
import InfiniteLoading from 'vue-infinite-loading'

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
        keyword: form.search.keyword,
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

    watch(
      () => route.value.query.tags,
      value => {
        if (!value) {
          resetKeyword()
        }
      }
    )

    const fetchRooms = useDebounceFn(
      async () => {
        if (props.isActiveInfiniteLoading) {
          if (!props.user) {
            if (form.search.keyword.includes('#')) {
              const tag = form.search.keyword.replace('#', '')
              router.push(localePath({ name: 'CreatorMode-CreatorModeRooms', query: { tags: tag } }))
            }

            if (form.search.keyword.length === 0) {
              if (route.value.query.tags) {
                router.push(localePath({ name: 'CreatorMode-CreatorModeRooms' }))
              }
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
      },
      1000,
      { maxWait: 5000 }
    )

    const handleSearchRoom = async () => {
      form.search.isBusy = true
      await fetchRooms()
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

    const searchFieldPlaceholder = computed(() => {
      if (props.user) {
        return i18n.t('creatorModeRooms.rooms.searchField.searchRoom.placeholder')
      }

      return i18n.t('creatorModeRooms.rooms.searchField.searchRoomOrTag.placeholder')
    })

    return {
      list,
      pagination,
      handleInfiniteLoading,
      form,
      handleSearchRoom,
      handleEditRoom,
      handleDeleteRoom,
      searchFieldPlaceholder
    }
  }
})
</script>

<style lang="scss" src="./RoomList.component.scss"></style>
