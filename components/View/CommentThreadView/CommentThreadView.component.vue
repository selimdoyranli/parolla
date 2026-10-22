<template lang="pug">
//- comments list + pinned deep-link thread + single bottom composer for a quiz room OR a community post
.comment-thread-view(:class="{ 'comment-thread-view--inline': inline }")
  RoomCommentItem(
    :key="`pinned-${pinned.item.documentId}`"
    v-if="pinned.item"
    auto-expand-replies
    :comment="pinned.item"
    :room-id="roomId"
    :highlighted="pinned.targetDocumentId === pinned.item.documentId"
    :target-document-id="pinned.targetDocumentId"
    @deleted="handlePinnedDeleted"
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
      :room-id="roomId"
      @deleted="handleRootDeleted"
    )
    Empty(v-if="comments.finished && !visibleComments.length && !pinned.item" :description="$t('comments.empty')")

  .comment-thread-view__composer
    RoomCommentComposer(
      :key="replyTarget ? replyTarget.parent : 'root'"
      ref="composerRef"
      :room-id="roomId"
      :post-id="postId"
      :parent="replyTarget && replyTarget.parent"
      :reply-to="replyTarget && replyTarget.username"
      :autofocus="Boolean(replyTarget)"
      @posted="handlePosted"
      @cancel="cancelReply"
    )
</template>

<script>
import { defineComponent, useStore, ref, reactive, computed, watch, onMounted, provide, nextTick, toRef } from '@nuxtjs/composition-api'
import { List, Empty } from 'vant'

export default defineComponent({
  components: { List, Empty },
  props: {
    roomId: { type: Number, default: null },
    // documentId of a community post
    postId: { type: String, default: null },
    // slug of the post's community, for comment reports
    communitySlug: { type: String, default: null },
    targetCommentId: { type: String, default: null },
    // composer inline at the end of the list instead of pinned to the scroll area bottom
    inline: { type: Boolean, default: false }
  },
  // posted: a root comment was added; changed: any comment was added or removed
  emits: ['posted', 'changed'],
  setup(props, { emit }) {
    const store = useStore()

    const comments = reactive({ items: [], page: 0, loading: false, finished: false, error: false })
    const pinned = reactive({ item: null, targetDocumentId: null })

    // the pinned thread is rendered above the list; don't render it twice
    const visibleComments = computed(() => comments.items.filter(c => c.documentId !== pinned.item?.documentId))

    const loadComments = async () => {
      const { data, error } = await store.dispatch('comment/fetchComments', {
        roomId: props.roomId,
        postId: props.postId,
        page: comments.page + 1
      })
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

    const loadPinned = async () => {
      if (!props.targetCommentId) return

      const { data } = await store.dispatch('comment/fetchThread', { documentId: props.targetCommentId })

      // a stale ?comment from another quiz/post must not render here
      const sameTarget = props.postId ? data?.postDocumentId === props.postId : data?.roomId === props.roomId

      if (data && sameTarget) {
        pinned.item = data.item
        pinned.targetDocumentId = data.targetDocumentId
        setTimeout(
          () => document.getElementById(`comment-${data.targetDocumentId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
          300
        )
        setTimeout(() => (pinned.targetDocumentId = null), 2500)
      }
    }

    // Reply flow shared with every RoomCommentItem: the item asks to reply, the bottom composer posts,
    // and the root item of the thread picks the new reply up from lastReply.
    const replyTarget = ref(null)
    const lastReply = ref(null)
    const composerRef = ref(null)

    const flash = documentId =>
      nextTick(() => {
        const el = document.getElementById(`comment-${documentId}`)

        if (!el) return

        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.remove('room-comment-item--flash')
        // restart the animation when the same element is targeted again
        void el.offsetWidth
        el.classList.add('room-comment-item--flash')
        setTimeout(() => el.classList.remove('room-comment-item--flash'), 1600)
      })

    const startReply = target => {
      replyTarget.value = target
      // focus first, then scroll: a focus after the smooth scroll starts would cancel it
      nextTick(() => {
        composerRef.value?.focus()
        setTimeout(() => flash(target.parent), 50)
      })
    }

    const cancelReply = () => {
      replyTarget.value = null
    }

    const handlePosted = comment => {
      if (!comment.parentDocumentId) {
        comments.items.unshift(comment)
        emit('posted', comment)
      } else {
        lastReply.value = comment
        cancelReply()
      }

      emit('changed')
      setTimeout(() => flash(comment.documentId), 100)
    }

    // RoomCommentItem calls this after removing a reply
    const changed = () => emit('changed')

    provide('commentThread', {
      replyTarget,
      lastReply,
      startReply,
      cancelReply,
      changed,
      postId: toRef(props, 'postId'),
      communitySlug: toRef(props, 'communitySlug')
    })

    const handleRootDeleted = (documentId, replyCount) => {
      // a root with live replies stays as a placeholder, like the server list
      comments.items = comments.items.flatMap(c => {
        if (c.documentId !== documentId) return [c]

        return replyCount > 0 ? [{ ...c, isDeleted: true, content: null, user: null }] : []
      })
      emit('changed')
    }

    const handlePinnedDeleted = () => {
      pinned.item = null
      emit('changed')
    }

    watch(() => props.targetCommentId, loadPinned)
    onMounted(loadPinned)

    return {
      comments,
      visibleComments,
      pinned,
      loadComments,
      replyTarget,
      composerRef,
      handlePosted,
      cancelReply,
      handleRootDeleted,
      handlePinnedDeleted
    }
  }
})
</script>

<style lang="scss" src="./CommentThreadView.component.scss"></style>
