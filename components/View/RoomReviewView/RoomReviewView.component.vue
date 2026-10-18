<template lang="pug">
.room-review-view
  .room-review-view__rating
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
        Rate(
          v-model="ratings.draft"
          color="var(--color-brand-02)"
          allow-half
          void-color="var(--color-text-03)"
          auth-control
          :size="22"
          :disabled="ratings.pending"
          @change="submitRating"
        )

  DropdownMenu.room-review-view__filter(:active-color="'var(--color-brand-02)'")
    DropdownItem(v-model="filter" :options="filterOptions")

  template(v-if="filter === 'comments'")
    RoomCommentComposer(v-if="room.id" :room-id="room.id" @posted="handleRootPosted")

    RoomCommentItem(
      :key="`pinned-${pinned.item.documentId}`"
      v-if="pinned.item"
      auto-expand-replies
      :comment="pinned.item"
      :room-id="room.id"
      :highlighted="pinned.targetDocumentId === pinned.item.documentId"
      :target-document-id="pinned.targetDocumentId"
      @deleted="pinned.item = null"
    )

    List(
      v-model="comments.loading"
      :finished="comments.finished"
      :error.sync="comments.error"
      :error-text="$t('comments.error')"
      @load="loadComments"
    )
      RoomCommentItem(
        v-for="comment in visibleComments"
        :key="comment.documentId"
        :comment="comment"
        :room-id="room.id"
        @deleted="handleRootDeleted"
      )
      Empty(v-if="comments.finished && !visibleComments.length && !pinned.item" :description="$t('comments.empty')")

  template(v-else)
    List(
      v-model="ratingList.loading"
      :finished="ratingList.finished"
      :error.sync="ratingList.error"
      :error-text="$t('comments.error')"
      @load="loadRatings"
    )
      .room-review-view__rating-row(v-for="item in ratingList.items" :key="item.documentId")
        PlayerAvatar(v-if="item.user" :size="32" :user="item.user")
        span.room-review-view__rating-user {{ item.user && item.user.username }}
        Rate(:value="item.rating" color="var(--color-brand-02)" readonly allow-half void-color="var(--color-text-03)" :size="14")
      Empty(v-if="ratingList.finished && !ratingList.items.length" :description="$t('comments.ratingsEmpty')")
</template>

<script>
import { defineComponent, useStore, useContext, ref, reactive, computed, watch, onMounted } from '@nuxtjs/composition-api'
import { Rate, DropdownMenu, DropdownItem, List, Empty, Toast } from 'vant'

export default defineComponent({
  components: { Rate, DropdownMenu, DropdownItem, List, Empty },
  props: {
    targetCommentId: { type: String, default: null }
  },
  setup(props) {
    const store = useStore()
    const { $auth, i18n } = useContext()

    const room = computed(() => store.getters['creator/room'])

    const filter = ref('comments')
    const filterOptions = computed(() => [
      { text: i18n.t('comments.filter.comments'), value: 'comments' },
      { text: i18n.t('comments.filter.ratings'), value: 'ratings' }
    ])

    const comments = reactive({ items: [], page: 0, loading: false, finished: false, error: false })
    const ratingList = reactive({ items: [], page: 0, loading: false, finished: false, error: false })
    const ratings = reactive({ average: 0, count: 0, mine: null, draft: 0, pending: false })
    const pinned = reactive({ item: null, targetDocumentId: null })

    // the pinned thread is rendered above the list; don't render it twice
    const visibleComments = computed(() => comments.items.filter(c => c.documentId !== pinned.item?.documentId))

    const loadComments = async () => {
      if (!room.value?.id) {
        comments.loading = false

        return
      }

      const { data, error } = await store.dispatch('comment/fetchComments', { roomId: room.value.id, page: comments.page + 1 })
      comments.loading = false

      if (error) {
        comments.error = true

        return
      }

      const known = new Set(comments.items.map(c => c.documentId))

      comments.items.push(...data.items.filter(c => !known.has(c.documentId)))
      comments.page += 1
      comments.finished = !data.hasMore
    }

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

    const submitRating = async value => {
      if (!$auth.loggedIn || !value) return

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

    const loadPinned = async () => {
      if (!props.targetCommentId) return

      const { data } = await store.dispatch('comment/fetchThread', { documentId: props.targetCommentId })

      if (data) {
        pinned.item = data.item
        pinned.targetDocumentId = data.targetDocumentId
        setTimeout(
          () => document.getElementById(`comment-${data.targetDocumentId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
          300
        )
        setTimeout(() => (pinned.targetDocumentId = null), 2500)
      }
    }

    const handleRootPosted = comment => {
      comments.items.unshift(comment)
      store.commit('creator/INCREMENT_ROOM_REVIEW_COUNT')
    }

    const handleRootDeleted = documentId => {
      comments.items = comments.items.filter(c => c.documentId !== documentId)
    }

    watch(() => props.targetCommentId, loadPinned)

    // room may arrive after mount: load the summary and let the lists retry
    watch(
      () => room.value?.id,
      id => {
        if (!id) return

        loadRatingSummary()
        loadPinned()
        Object.assign(comments, { items: [], page: 0, finished: false, error: false })
        Object.assign(ratingList, { items: [], page: 0, finished: false, error: false })
      }
    )

    onMounted(() => {
      loadRatingSummary()
      loadPinned()
    })

    return {
      room,
      filter,
      filterOptions,
      comments,
      visibleComments,
      ratingList,
      ratings,
      pinned,
      loadComments,
      loadRatings,
      submitRating,
      handleRootPosted,
      handleRootDeleted
    }
  }
})
</script>

<style lang="scss" src="./RoomReviewView.component.scss"></style>
