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
        NuxtLink.room-card(
          :key="room.documentId || room.roomId"
          :to="localePath({ name: 'CreatorMode-CreatorModeRoom-slug', params: { slug: room.roomId } })"
          :title="room.title"
          :style="cardStyle(room)"
          :class="{ 'room-card--photo': hasCoverPhoto(room), 'room-card--placeholder': !hasCoverPhoto(room) }"
          :data-index="index"
        )
          .room-card__media
            template(v-if="hasCoverPhoto(room)")
              img.room-card__photo(:src="room.coverPhoto.url" loading="lazy" draggable="false" :alt="room.title")

            template(v-else)
              .room-card__placeholder
                .room-card__placeholder-grid
                .room-card__placeholder-glow

            .room-card__media-shade

            h3.room-card__placeholder-title(v-if="!hasCoverPhoto(room)") {{ room.title }}

            .room-card__media-top
              .room-card__media-top-left
                template(v-if="scoped && isOwner({ user: room.user })")
                  span.room-card__chip.room-card__chip--draft(v-if="!room.isVisible")
                    AppIcon.room-card__chip-icon(name="tabler:edit-circle" :width="11" :height="11")
                    | {{ $t('general.draft') }}
                  span.room-card__chip(v-if="room.isListed")
                    AppIcon.room-card__chip-icon(name="tabler:world" :width="11" :height="11")
                    | {{ $t('creatorModeMyRooms.listing.public') }}
                  span.room-card__chip(v-else)
                    AppIcon.room-card__chip-icon(name="tabler:eye-off" :width="11" :height="11")
                    | {{ $t('creatorModeMyRooms.listing.private') }}

              .room-card__media-top-right
                span.room-card__rating(v-if="hasRating(room)")
                  AppIcon.room-card__rating-star(name="tabler:star-filled" :width="11" :height="11")
                  span.room-card__rating-value {{ formatRating(room.rating) }}
                  span.room-card__rating-count(v-if="room.reviewsCount") ({{ room.reviewsCount }})

                span.room-card__crown(v-if="room.isFeatured" :title="$t('general.editorsChoice')")
                  AppIcon(name="tabler:crown" :width="12" :height="12")

            .room-card__media-bottom(v-if="hasCoverPhoto(room) && quizTypePill(room)")
              span.room-card__quiz-type(:class="`room-card__quiz-type--${quizTypePill(room).key}`")
                img.room-card__quiz-type-versus(
                  v-if="quizTypePill(room).key === 'choices'"
                  src="/img/elements/versus.webp"
                  alt
                  draggable="false"
                  width="14"
                  height="14"
                )
                AppIcon.room-card__quiz-type-icon(v-else :name="quizTypePill(room).icon" :width="13" :height="13")
                span.room-card__quiz-type-text {{ quizTypePill(room).label }}

          .room-card__body
            .room-card__title-slot
              template(v-if="hasCoverPhoto(room)")
                h3.room-card__title {{ room.title }}
              template(v-else-if="quizTypePill(room)")
                span.room-card__quiz-label(:class="`room-card__quiz-label--${quizTypePill(room).key}`")
                  img.room-card__quiz-label-versus(
                    v-if="quizTypePill(room).key === 'choices'"
                    src="/img/elements/versus.webp"
                    alt
                    draggable="false"
                    width="18"
                    height="18"
                  )
                  AppIcon.room-card__quiz-label-icon(v-else :name="quizTypePill(room).icon" :width="16" :height="16")
                  span.room-card__quiz-label-text {{ quizTypePill(room).label }}

            .room-card__meta
              PlayerAvatar.room-card__author(
                with-username
                :size="16"
                :user="room.isAnon ? null : room.user"
                :open-player-dialog-on-click="!room.isAnon && !!room.user"
              )

            .room-card__tags(v-if="room.tags && room.tags.length > 0")
              template(v-for="tag in room.tags.slice(0, 3)")
                span.room-card__tag(:key="tag.id") {{ tag.title }}
              span.room-card__tag.room-card__tag--more(v-if="room.tags.length > 3")
                | +{{ room.tags.length - 3 }}

            .room-card__footer
              .room-card__stats
                span.room-card__stat.room-card__stat--accent(v-if="room.viewCount && room.viewCount > 0")
                  AppIcon.room-card__stat-icon(name="tabler:player-play-filled" :width="13" :height="13")
                  span.room-card__stat-value {{ formatCount(room.viewCount) }}

                span.room-card__stat(v-if="room.questionCount")
                  AppIcon.room-card__stat-icon(name="tabler:help-square-rounded" :width="13" :height="13")
                  span.room-card__stat-value {{ room.questionCount }}

                span.room-card__stat(v-if="room.choices && room.choices.length > 0")
                  AppIcon.room-card__stat-icon(name="tabler:list-check" :width="13" :height="13")
                  span.room-card__stat-value {{ room.choices.length }}

                span.room-card__stat(v-if="room.flashcardCount > 0")
                  AppIcon.room-card__stat-icon(name="tabler:cards" :width="13" :height="13")
                  span.room-card__stat-value {{ room.flashcardCount }}

                span.room-card__stat(v-if="room.tags && room.tags.length > 0")
                  AppIcon.room-card__stat-icon(name="tabler:hash" :width="13" :height="13")
                  span.room-card__stat-value {{ room.tags.length }}

              .room-card__owner-actions(v-if="user && isOwner({ user: room.user })")
                button.room-card__owner-action.room-card__owner-action--edit(
                  type="button"
                  :title="$t('general.edit')"
                  :aria-label="$t('general.edit')"
                  @click.prevent.stop="handleEditRoom({ room })"
                )
                  AppIcon(name="tabler:pencil" :width="14" :height="14")
                button.room-card__owner-action.room-card__owner-action--delete(
                  type="button"
                  :title="$t('general.delete')"
                  :aria-label="$t('general.delete')"
                  @click.prevent.stop="handleDeleteRoom({ room })"
                )
                  AppIcon(name="tabler:trash" :width="14" :height="14")

        // Ad
        template(v-if="(index + 1) % 5 === 0")
          .room-card.room-card--ad(:key="`ad-${index}`")
            small.room-card__ad-label {{ $t('general.ad') }}
            AppAd(:data-ad-slot="6048083070")

  InfiniteLoading(v-if="isActiveInfiniteLoading && list.items.length >= 10" @infinite="handleInfiniteLoading")
</template>

<script>
import { defineComponent, useContext, useRouter, useStore, reactive, computed, watch } from '@nuxtjs/composition-api'
import { useDebounceFn } from '@vueuse/core'
import { Search, List, Cell, Button, Empty, Loading, Dialog, Notify, Tag, Toast } from 'vant'
import InfiniteLoading from 'vue-infinite-loading'
import { quizTypeEnum, questionTypeEnum, answerTypeEnum } from '@/enums/quiz.enum'

const PLACEHOLDER_PALETTES = [
  { from: '#ff7878', to: '#c83a5a', tint: 'rgba(255, 220, 220, 0.18)' },
  { from: '#7c5ce8', to: '#3a3da8', tint: 'rgba(225, 220, 255, 0.18)' },
  { from: '#1f9e8e', to: '#0c5a64', tint: 'rgba(200, 245, 240, 0.18)' },
  { from: '#d4a017', to: '#9b5b0a', tint: 'rgba(255, 235, 200, 0.18)' },
  { from: '#e85a8a', to: '#7a2d5a', tint: 'rgba(255, 220, 235, 0.18)' },
  { from: '#3b7dd8', to: '#163f7a', tint: 'rgba(210, 225, 255, 0.18)' }
]

const hashSeed = key => {
  const s = String(key || '')
  let h = 0

  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }

  return Math.abs(h)
}

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
    scoped: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  setup(props, { emit }) {
    const { i18n, localePath, route } = useContext()
    const router = useRouter()
    const store = useStore()
    const { isOwner } = useAuth()

    const paginationGetter = computed(() => (props.scoped ? 'creator/userRoomsPagination' : 'creator/roomsPagination'))
    const fetchActionName = computed(() => (props.scoped ? 'creator/fetchUserRooms' : 'creator/fetchRooms'))

    const pagination = computed(() => store.getters[paginationGetter.value])

    // Scoped (profile) lists honour owner-only filters when the auth user is
    // looking at their own quizzes — drafts and unlisted rooms come through.
    const authedUser = computed(() => store.getters['auth/user'])
    const isOwnUserFilter = computed(
      () => props.scoped && !!(authedUser.value?.id && props.user?.id && Number(authedUser.value.id) === Number(props.user.id))
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

    const hasCoverPhoto = room => Boolean(room?.coverPhoto?.url)

    const hasRating = room => {
      const n = Number(room?.rating)

      return Number.isFinite(n) && n > 0
    }

    const formatRating = rating => {
      const n = Number(rating)

      if (!Number.isFinite(n)) return '0.0'

      return n.toFixed(1)
    }

    const formatCount = count => {
      const n = Number(count) || 0

      if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`

      if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`

      return String(n)
    }

    const placeholderPalette = room => {
      const key = room?.roomId || room?.documentId || room?.title || ''
      const idx = hashSeed(key) % PLACEHOLDER_PALETTES.length

      return PLACEHOLDER_PALETTES[idx]
    }

    const cardStyle = room => {
      const palette = placeholderPalette(room)

      return {
        '--room-card-from': palette.from,
        '--room-card-to': palette.to,
        '--room-card-tint': palette.tint
      }
    }

    const quizTypePill = room => {
      if (!room) return { key: 'qa', icon: 'tabler:message-question', label: i18n.t('general.quiz') }

      if (room.quizType === quizTypeEnum.CHOICES) {
        return { key: 'choices', icon: null, label: i18n.t('general.thisOrThatQuiz') }
      }

      if (room.quizType === quizTypeEnum.FLASHCARDS) {
        return { key: 'flashcards', icon: 'streamline-color:cards-flat', label: i18n.t('general.flashcardsQuiz') }
      }

      if (room.questionTypeDominance === questionTypeEnum.MEDIA) {
        return { key: 'media', icon: 'streamline-flex-color:gallery-flat', label: i18n.t('general.photoQuiz') }
      }

      if (room.answerTypeDominance === answerTypeEnum.TRIVIA) {
        return { key: 'trivia', icon: 'streamline-flex-color:table-flat', label: i18n.t('general.triviaQuiz') }
      }

      return { key: 'qa', icon: 'tabler:message-question', label: i18n.t('general.quiz') }
    }

    return {
      quizTypeEnum,
      questionTypeEnum,
      answerTypeEnum,
      isOwner,
      list,
      pagination,
      handleInfiniteLoading,
      form,
      handleSearchRoom,
      handleEditRoom,
      handleDeleteRoom,
      searchFieldPlaceholder,
      hasCoverPhoto,
      hasRating,
      formatRating,
      formatCount,
      cardStyle,
      quizTypePill
    }
  }
})
</script>

<style lang="scss" src="./RoomList.component.scss"></style>
