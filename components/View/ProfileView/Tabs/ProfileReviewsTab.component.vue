<template lang="pug">
.profile-reviews-tab
  template(v-if="loading")
    .profile-reviews-tab__state
      Loading(color="var(--color-brand-02)")

  template(v-else-if="error")
    Empty(image="error" :description="$t(source === 'likes' ? 'activities.likesError' : 'profile.reviewsTab.error')")
      Button(@click="reload") {{ $t('error.tryAgain') }}

  template(v-else-if="items.length === 0")
    Empty(:description="$t(emptyKey)")

  template(v-else)
    .profile-reviews-tab__list
      .profile-reviews-tab__item(v-for="item in items" :key="item.documentId")
        //- quote header: which quiz the comment is on; opens the quiz with the thread pinned
        NuxtLink.profile-reviews-tab__quote(:to="roomLocation(item)")
          img.profile-reviews-tab__quote-cover(v-if="item.room.coverPhoto" :src="item.room.coverPhoto" alt loading="lazy")
          AppIcon.profile-reviews-tab__quote-icon(v-else name="tabler:quote" :width="16" :height="16")
          span.profile-reviews-tab__quote-title {{ item.room.title }}
          AppIcon.profile-reviews-tab__quote-arrow(name="tabler:chevron-right" :width="16" :height="16")
        //- a reply: label + short quote of the comment it answers, opening the quiz on that thread
        NuxtLink.profile-reviews-tab__parent(v-if="item.parent" :to="roomLocation(item)")
          span.profile-reviews-tab__parent-label
            AppIcon(name="tabler:corner-down-right" :width="14" :height="14")
            | {{ $t('activities.replyTo') }}
          span.profile-reviews-tab__parent-text(v-if="item.parent.isDeleted") {{ $t('comments.deleted') }}
          span.profile-reviews-tab__parent-text(v-else)
            b(v-if="item.parent.user") {{ item.parent.user.username }}:
            | {{ ' ' + item.parent.content }}
        RoomCommentItem(:comment="item" :room-id="item.room.id" @deleted="removeItem")

    InfiniteLoading(:key="`${source}-${playerId}`" v-if="hasMore" @infinite="handleInfinite")
      template(#spinner)
        Loading(color="var(--color-brand-02)" size="20")
      template(#no-more) {{ '' }}
      template(#no-results) {{ '' }}

  //- one composer for every comment on the tab, shown only while replying
  .profile-reviews-tab__composer(v-if="replyTarget")
    RoomCommentComposer(
      :key="replyTarget.parent"
      autofocus
      :room-id="replyTarget.roomId"
      :parent="replyTarget.parent"
      :reply-to="replyTarget.username"
      @posted="handlePosted"
      @cancel="cancelReply"
    )
</template>

<script>
import { defineComponent, inject, ref, computed, watch, provide, useStore, useContext } from '@nuxtjs/composition-api'
import { Loading, Empty, Button, Toast } from 'vant'
import InfiniteLoading from 'vue-infinite-loading'

export default defineComponent({
  components: {
    Loading,
    Empty,
    Button,
    InfiniteLoading
  },
  props: {
    // profile: top-level comments of the profile user; mine: own comments + replies; likes: own likes
    source: { type: String, default: 'profile' }
  },
  setup(props) {
    const shell = inject('profileShell', null)
    const store = useStore()
    const { localePath, i18n, $auth } = useContext()

    const items = ref([])
    const page = ref(0)
    const hasMore = ref(false)
    const loading = ref(false)
    const error = ref(null)

    const playerId = computed(() => (props.source === 'profile' ? shell?.player?.value?.id : $auth.user?.id) || null)
    const emptyKey = { profile: 'profile.reviewsTab.empty', mine: 'activities.commentsEmpty', likes: 'activities.likesEmpty' }[props.source]

    const roomLocation = item =>
      localePath({
        name: 'CreatorMode-CreatorModeRoom-slug',
        params: { slug: item.room.roomId },
        query: { comment: item.documentId }
      })

    const load = async (isLoadMore = false) => {
      if (!playerId.value) return null

      if (!isLoadMore) {
        loading.value = true
        page.value = 0
      }

      error.value = null

      const userId = playerId.value
      const nextPage = page.value + 1
      const { data, error: err } = await (props.source === 'likes'
        ? store.dispatch('comment/fetchMyLikes', { page: nextPage })
        : store.dispatch('comment/fetchByUser', { userId, page: nextPage, topLevel: props.source === 'profile' }))

      // The profile changed while loading: drop this response
      if (userId !== playerId.value) return { stale: true }

      // Load-more failures stay with the infinite loader so the loaded items remain
      if (err) {
        if (!isLoadMore) error.value = err
      } else {
        // the server only returns comments on rooms the viewer may see, so room is always set
        const fresh = data.items.filter(i => i.room && !items.value.some(c => c.documentId === i.documentId))

        items.value = isLoadMore ? [...items.value, ...fresh] : fresh
        page.value += 1
        hasMore.value = data.hasMore
      }

      loading.value = false

      return { error: err }
    }

    watch(
      playerId,
      (id, prev) => {
        if (id && id !== prev) load()
      },
      { immediate: true }
    )

    const reload = () => load()

    const handleInfinite = async $state => {
      const result = await load(true)

      if (result?.stale) return

      if (result?.error) {
        $state.error()

        return
      }

      $state.loaded()

      if (!hasMore.value) $state.complete()
    }

    // same reply flow as RoomReviewView: an item asks to reply, the composer posts,
    // and the root item of the thread picks the reply up from lastReply
    const replyTarget = ref(null)
    const lastReply = ref(null)

    const startReply = target => {
      replyTarget.value = target
    }

    const cancelReply = () => {
      replyTarget.value = null
    }

    const handlePosted = comment => {
      lastReply.value = comment
      cancelReply()
      Toast(i18n.t('profile.reviewsTab.replied'))
    }

    provide('commentThread', { replyTarget, lastReply, startReply, cancelReply })

    const removeItem = documentId => {
      items.value = items.value.filter(c => c.documentId !== documentId)
    }

    return {
      items,
      emptyKey,
      hasMore,
      playerId,
      loading,
      error,
      reload,
      handleInfinite,
      roomLocation,
      replyTarget,
      handlePosted,
      cancelReply,
      removeItem
    }
  }
})
</script>

<style lang="scss" src="./ProfileReviewsTab.component.scss"></style>
