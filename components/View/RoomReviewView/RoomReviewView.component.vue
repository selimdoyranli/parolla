<template lang="pug">
.room-review-view(:class="{ 'room-review-view--comments-only': commentsOnly }")
  .room-review-view__rating(v-if="!commentsOnly")
    .room-review-view__rating-summary
      strong {{ ratings.average.toFixed(1) }}
      Rate(:value="ratings.average" color="var(--color-brand-02)" readonly allow-half void-color="var(--color-text-03)" :size="16")
      small {{ $t('comments.ratingCount', { count: ratings.count }) }}
    .room-review-view__rating-mine
      template(v-if="ratings.mine !== null")
        small {{ $t('comments.yourRating', { rating: ratings.mine }) }}
        Rate(:value="ratings.mine" color="var(--color-brand-02)" readonly allow-half void-color="var(--color-text-03)" :size="18")
      template(v-else)
        small {{ $t('comments.rateThisQuiz') }}
        //- vant 2 Rate has no hover state: preview the hovered star by overriding the shown value
        //- clicks handled here too: vant skips change when the clicked star equals the hover-shown value
        .room-review-view__rating-input(@click="handleRateClick" @mouseover="handleRateHover" @mouseleave="ratings.hover = 0")
          Rate(
            :value="ratings.hover || ratings.draft"
            color="var(--color-brand-02)"
            void-color="var(--color-text-03)"
            auth-control
            :size="22"
            :touchable="false"
            :disabled="ratings.pending"
          )

  .room-review-view__filter
    h4.room-review-view__filter-title
      | {{ filter === 'comments' ? $t('comments.filter.comments') : $t('comments.filter.ratings') }}
      span.room-review-view__filter-count ({{ filter === 'comments' ? room.reviewCount || 0 : ratings.count }})
    FilterDropdown(
      v-if="!commentsOnly"
      :options="filterOptions"
      :selected="filterOptions.find(o => o.value === filter)"
      @on-select-option="option => (filter = option.value)"
    )

  template(v-if="filter === 'comments'")
    CommentThreadView(
      :key="room.id"
      v-if="room.id"
      :room-id="room.id"
      :target-comment-id="targetCommentId"
      :inline="commentsOnly"
      @posted="store.commit('creator/INCREMENT_ROOM_REVIEW_COUNT')"
    )

  template(v-else)
    List(
      v-model="ratingList.loading"
      :finished="ratingList.finished"
      :error.sync="ratingList.error"
      :error-text="$t('comments.error')"
      @load="loadRatings"
    )
      .room-review-view__rating-row(
        v-for="item in ratingList.items"
        :key="item.documentId"
        :id="item.user ? `rating-${item.user.id}` : null"
      )
        PlayerAvatar(v-if="item.user" :size="32" :user="item.user")
        span.room-review-view__rating-user {{ item.user && item.user.username }}
        Timeago.room-review-view__rating-time(:datetime="item.createdAt" :auto-update="60" :locale="$i18n.locale")
        Rate(:value="item.rating" color="var(--color-brand-02)" readonly allow-half void-color="var(--color-text-03)" :size="14")
      Empty(v-if="ratingList.finished && !ratingList.items.length" :description="$t('comments.ratingsEmpty')")
</template>

<script>
import { defineComponent, useStore, useContext, ref, reactive, computed, watch, onMounted, nextTick } from '@nuxtjs/composition-api'
import { Rate, List, Empty, Toast, Dialog } from 'vant'

export default defineComponent({
  components: { Rate, List, Empty },
  props: {
    targetCommentId: { type: String, default: null },
    targetRatingUserId: { type: [String, Number], default: null },
    // comments list + composer only (play intro): no rating block, no comments/ratings filter
    commentsOnly: { type: Boolean, default: false }
  },
  setup(props) {
    const store = useStore()
    const { $auth, i18n } = useContext()

    const room = computed(() => store.getters['creator/room'])

    const filter = ref('comments')
    const filterOptions = computed(() => [
      { label: i18n.t('comments.filter.comments'), value: 'comments', icon: 'tabler:message-2' },
      { label: i18n.t('comments.filter.ratings'), value: 'ratings', icon: 'tabler:star' }
    ])

    const ratingList = reactive({ items: [], page: 0, loading: false, finished: false, error: false })
    const ratings = reactive({ average: 0, count: 0, mine: null, draft: 0, hover: 0, pending: false })
    const applyRatingMeta = data => {
      ratings.average = Number(data.average) || 0
      ratings.count = data.count || 0
      ratings.mine = data.mine
    }

    const loadRatings = async () => {
      if (!room.value?.id) {
        ratingList.loading = false

        return
      }

      const { data, error } = await store.dispatch('comment/fetchRatings', { roomId: room.value.id, page: ratingList.page + 1 })
      ratingList.loading = false

      if (error) {
        ratingList.error = true

        return
      }

      applyRatingMeta(data)
      ratingList.items.push(...data.items)
      ratingList.page += 1
      ratingList.finished = !data.hasMore
    }

    const loadRatingSummary = async () => {
      if (!room.value?.id) return

      const { data } = await store.dispatch('comment/fetchRatings', { roomId: room.value.id, page: 1 })

      if (data) applyRatingMeta(data)
    }

    const getStarIndex = e => {
      const item = e.target.closest('.van-rate__item')

      return item ? [...item.parentNode.children].indexOf(item) + 1 : 0
    }

    const handleRateHover = e => {
      if (!ratings.pending) ratings.hover = getStarIndex(e)
    }

    const handleRateClick = e => {
      if (!ratings.pending) submitRating(getStarIndex(e))
    }

    const submitRating = async value => {
      if (!$auth.loggedIn || !value) return

      ratings.hover = 0
      ratings.draft = value

      try {
        await Dialog.confirm({
          title: i18n.t('comments.rateThisQuiz'),
          message: i18n.t('comments.rateConfirm', { rating: value }),
          cancelButtonText: i18n.t('general.cancel'),
          confirmButtonText: i18n.t('comments.rateConfirmButton')
        })
      } catch {
        ratings.draft = 0

        return
      }

      ratings.pending = true
      const { error } = await store.dispatch('comment/postRating', { roomId: room.value.id, rating: value })
      ratings.pending = false

      if (error) {
        Toast(error.code === 409 ? i18n.t('comments.alreadyRated') : i18n.t('comments.error'))

        if (error.code !== 409) {
          ratings.draft = 0

          return
        }
      } else {
        Toast(i18n.t('comments.rated'))
      }

      await loadRatingSummary()
      ratingList.items = []
      ratingList.page = 0
      ratingList.finished = false
    }

    const flashElement = (elementId, className) =>
      nextTick(() => {
        const el = document.getElementById(elementId)

        if (!el) return

        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.remove(className)
        // restart the animation when the same element is targeted again
        void el.offsetWidth
        el.classList.add(className)
        setTimeout(() => el.classList.remove(className), 1600)
      })

    // rating notification: open Puanlar and page until the rater's row is loaded (max 5 pages)
    const focusRating = async () => {
      const userId = props.targetRatingUserId

      if (!userId || !room.value?.id) return

      // loading first so the filter watcher doesn't start a parallel first page
      Object.assign(ratingList, { items: [], page: 0, finished: false, error: false, loading: true })
      filter.value = 'ratings'

      for (let i = 0; i < 5; i++) {
        await loadRatings()

        const found = ratingList.items.some(r => String(r.user?.id) === String(userId))

        if (found || ratingList.finished || ratingList.error) break

        ratingList.loading = true
      }

      setTimeout(() => flashElement(`rating-${userId}`, 'room-review-view__rating-row--flash'), 150)
    }

    watch(() => props.targetRatingUserId, focusRating)

    // van-list mounted by the filter switch does not check itself, so kick the first ratings page
    watch(filter, value => {
      if (value === 'ratings' && room.value?.id && !ratingList.items.length && !ratingList.finished && !ratingList.loading) {
        ratingList.loading = true
        loadRatings()
      }
    })

    // room may arrive after mount: load the summary and let the lists retry
    watch(
      () => room.value?.id,
      id => {
        if (!id) return

        loadRatingSummary()
        Object.assign(ratingList, { items: [], page: 0, finished: false, error: false })

        if (props.targetRatingUserId) {
          focusRating()

          return
        }

        // van-list only re-checks on loading/finished changes, so load the visible list directly
        if (filter.value === 'ratings') {
          ratingList.loading = true
          loadRatings()
        }
      }
    )

    onMounted(() => {
      if (!props.commentsOnly) loadRatingSummary()
      focusRating()
    })

    return {
      room,
      filter,
      filterOptions,
      ratingList,
      ratings,
      pinned,
      loadRatings,
      submitRating,
      handleRateHover,
      handleRateClick,
      store
    }
  }
})
</script>

<style lang="scss" src="./RoomReviewView.component.scss"></style>
