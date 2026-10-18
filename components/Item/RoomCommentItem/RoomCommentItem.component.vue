<template lang="pug">
.room-comment-item(
  :id="`comment-${comment.documentId}`"
  :class="{ 'room-comment-item--highlighted': highlighted, 'room-comment-item--reply': isReply }"
)
  .room-comment-item__avatar
    PlayerAvatar(v-if="comment.user" :user="comment.user" :size="36")
    .room-comment-item__avatar-placeholder(v-else)
  .room-comment-item__body
    template(v-if="comment.isDeleted")
      p.room-comment-item__deleted {{ $t('comments.deleted') }}
    template(v-else)
      .room-comment-item__meta
        NuxtLink.room-comment-item__username(:to="profilePath(comment.user)") {{ comment.user && comment.user.username }}
        Tag.room-comment-item__owner(v-if="comment.isQuizOwner" round) {{ $t('comments.quizOwner') }}
        Timeago.room-comment-item__time(:datetime="comment.createdAt" :auto-update="60" :locale="$i18n.locale")
      p.room-comment-item__content
        NuxtLink.room-comment-item__mention(v-if="mention" :to="profilePath(comment.replyToUser)") @{{ comment.replyToUser.username }}
        | {{ ' ' + contentWithoutMention }}
      .room-comment-item__actions
        button.room-comment-item__action(auth-control :class="{ 'is-active': state.likedByMe }" @click="toggleLike")
          AppIcon(:name="state.likedByMe ? 'tabler:thumb-up-filled' : 'tabler:thumb-up'")
          span {{ state.likeCount }}
        button.room-comment-item__action(v-if="!isReply" @click="toggleReplies")
          AppIcon(name="tabler:message")
          span {{ state.replyCount }}
        button.room-comment-item__action(auth-control @click="isReplying = !isReplying")
          AppIcon(name="tabler:arrow-back-up")
          span {{ $t('comments.reply') }}
        button.room-comment-item__action(@click="isOpenActions = true")
          AppIcon(name="tabler:dots")

    RoomCommentComposer(
      v-if="isReplying"
      autofocus
      :room-id="roomId"
      :parent="comment.documentId"
      :mention="isReply ? comment.user && comment.user.username : null"
      @posted="handleReplyPosted"
    )

    template(v-if="!isReply")
      button.room-comment-item__toggle(v-if="state.replyCount > 0 && !replies.isOpen" @click="toggleReplies")
        | {{ $t('comments.viewReplies', { count: state.replyCount }) }}
      .room-comment-item__replies(v-if="replies.isOpen")
        RoomCommentItem(
          v-for="reply in replies.items"
          :key="reply.documentId"
          :comment="reply"
          :room-id="roomId"
          :highlighted="reply.documentId === targetDocumentId"
          @deleted="removeReply"
          @replied="handleReplyPosted"
        )
        button.room-comment-item__toggle(v-if="replies.hasMore" @click="loadReplies") {{ $t('comments.loadMoreReplies') }}
        button.room-comment-item__toggle(v-else @click="replies.isOpen = false") {{ $t('comments.hideReplies') }}

  ActionSheet(v-model="isOpenActions" :actions="actionSheetItems" :cancel-text="$t('general.cancel')" @select="handleAction")
  LazyReportDialog(
    v-if="isOpenReportDialog"
    :is-open="isOpenReportDialog"
    :scope="reportTypeEnum.COMMENT"
    :additional="reportAdditional"
    @closed="isOpenReportDialog = false"
  )
</template>

<script>
import { defineComponent, ref, reactive, computed, onMounted, useStore, useContext } from '@nuxtjs/composition-api'
import { Tag, ActionSheet, Dialog, Toast } from 'vant'
import { reportTypeEnum } from '@/enums/report-type.enum'

export default defineComponent({
  name: 'RoomCommentItem',
  components: { Tag, ActionSheet },
  props: {
    comment: { type: Object, required: true },
    roomId: { type: Number, required: true },
    highlighted: { type: Boolean, default: false },
    autoExpandReplies: { type: Boolean, default: false },
    targetDocumentId: { type: String, default: null }
  },
  emits: ['deleted', 'replied'],
  setup(props, { emit }) {
    const store = useStore()
    const { $auth, i18n, localePath } = useContext()

    // local copy of the mutable counters so the prop object is never mutated
    const state = reactive({
      likedByMe: props.comment.likedByMe,
      likeCount: props.comment.likeCount,
      replyCount: props.comment.replyCount
    })

    const isReply = computed(() => Boolean(props.comment.parentDocumentId))
    const isReplying = ref(false)
    const isOpenActions = ref(false)
    const isOpenReportDialog = ref(false)
    const replies = reactive({ isOpen: false, items: [], page: 0, hasMore: true, pending: false })

    const mention = computed(() => props.comment.replyToUser && props.comment.content?.startsWith(`@${props.comment.replyToUser.username}`))
    const contentWithoutMention = computed(() =>
      mention.value ? props.comment.content.slice(props.comment.replyToUser.username.length + 1).trimStart() : props.comment.content
    )

    const isOwn = computed(() => $auth.loggedIn && props.comment.user && props.comment.user.id === $auth.user?.id)
    const actionSheetItems = computed(() =>
      isOwn.value
        ? [{ name: i18n.t('comments.delete'), key: 'delete', color: 'var(--color-danger-01)' }]
        : [{ name: i18n.t('comments.report'), key: 'report' }]
    )
    const reportAdditional = computed(() =>
      JSON.stringify({ commentDocumentId: props.comment.documentId, roomId: props.roomId, content: props.comment.content })
    )

    const profilePath = user => (user ? localePath({ name: 'Profile-username', params: { username: user.username } }) : '')

    const toggleLike = async () => {
      if (!$auth.loggedIn) return

      const prev = { likedByMe: state.likedByMe, likeCount: state.likeCount }
      // optimistic update
      state.likedByMe = !prev.likedByMe
      state.likeCount += prev.likedByMe ? -1 : 1
      const { data, error } = await store.dispatch('comment/toggleLike', { documentId: props.comment.documentId, liked: prev.likedByMe })

      if (error) {
        Object.assign(state, prev)

        return
      }

      Object.assign(state, { likedByMe: data.likedByMe, likeCount: data.likeCount })
    }

    const loadReplies = async () => {
      if (replies.pending) return

      replies.pending = true
      const { data } = await store.dispatch('comment/fetchReplies', { documentId: props.comment.documentId, page: replies.page + 1 })
      replies.pending = false

      if (data) {
        replies.items.push(...data.items.filter(i => !replies.items.some(r => r.documentId === i.documentId)))
        replies.page += 1
        replies.hasMore = data.hasMore
      }

      return Boolean(data)
    }

    const toggleReplies = async () => {
      replies.isOpen = !replies.isOpen

      if (replies.isOpen && replies.page === 0) await loadReplies()
    }

    const handleReplyPosted = reply => {
      isReplying.value = false

      if (isReply.value) {
        emit('replied', reply)

        return
      }

      replies.isOpen = true
      replies.items.push(reply)
      state.replyCount += 1
    }

    const removeReply = documentId => {
      replies.items = replies.items.filter(r => r.documentId !== documentId)
      state.replyCount = Math.max(0, state.replyCount - 1)
    }

    const handleAction = async action => {
      isOpenActions.value = false

      if (action.key === 'report') {
        isOpenReportDialog.value = true

        return
      }

      if (action.key === 'delete') {
        try {
          await Dialog.confirm({ message: i18n.t('comments.deleteConfirm') })
        } catch {
          return
        }

        const { error } = await store.dispatch('comment/deleteComment', { documentId: props.comment.documentId })

        if (error) {
          Toast(i18n.t('comments.error'))

          return
        }

        emit('deleted', props.comment.documentId, state.replyCount)
      }
    }

    onMounted(async () => {
      // deep link: open the thread and page replies until the target reply is loaded (max 5 pages)
      if (props.autoExpandReplies && state.replyCount > 0) {
        replies.isOpen = true
        await loadReplies()
        while (
          props.targetDocumentId &&
          replies.hasMore &&
          replies.page < 5 &&
          !replies.items.some(r => r.documentId === props.targetDocumentId)
        ) {
          // stop when a fetch fails, otherwise page/hasMore never change and the loop would spin
          if (!(await loadReplies())) break
        }
      }
    })

    return {
      reportTypeEnum,
      state,
      isReply,
      isReplying,
      isOpenActions,
      isOpenReportDialog,
      replies,
      mention,
      contentWithoutMention,
      actionSheetItems,
      reportAdditional,
      profilePath,
      toggleLike,
      toggleReplies,
      loadReplies,
      handleReplyPosted,
      removeReply,
      handleAction
    }
  }
})
</script>

<style lang="scss" src="./RoomCommentItem.component.scss"></style>
