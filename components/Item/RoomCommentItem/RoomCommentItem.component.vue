<template lang="pug">
.room-comment-item(
  :id="`comment-${comment.documentId}`"
  :class="{ 'room-comment-item--highlighted': highlighted, 'room-comment-item--reply': isReply }"
)
  .room-comment-item__avatar
    PlayerAvatar(v-if="comment.user" open-player-dialog-on-click :user="comment.user" :size="36")
    .room-comment-item__avatar-placeholder(v-else)
  .room-comment-item__body
    template(v-if="comment.isDeleted")
      p.room-comment-item__deleted {{ $t('comments.deleted') }}
    template(v-else)
      .room-comment-item__meta
        button.room-comment-item__username(type="button" :style="usernameStyle" @click="openPlayer(comment.user)")
          | {{ comment.user && comment.user.username }}
        Tag.room-comment-item__owner(v-if="comment.isQuizOwner" round) {{ $t('comments.quizOwner') }}
        Timeago.room-comment-item__time(:datetime="comment.createdAt" :auto-update="60" :locale="$i18n.locale")
      p.room-comment-item__content
        button.room-comment-item__mention(v-if="mention" type="button" @click="openPlayer(comment.replyToUser)") @{{ comment.replyToUser.username }}
        | {{ ' ' + contentWithoutMention }}
      .room-comment-item__actions
        ActionButton.room-comment-item__action--like(
          :label="$t('comments.like')"
          icon="tabler:thumb-up"
          auth-control
          tone="brand"
          active-icon="tabler:thumb-up-filled"
          :active="state.likedByMe"
          :count="state.likeCount"
          @click="toggleLike"
        )
        //- targets the bottom composer at this comment
        ActionButton.room-comment-item__action--reply(
          :label="$t(isReply ? 'comments.reply' : 'comments.replies')"
          icon="tabler:message"
          tone="info"
          auth-control
          :count="isReply ? null : state.replyCount"
          @click="toggleThread"
        )
        ActionButton(:label="$t('comments.moreTitle')" icon="tabler:dots" @click="isOpenMore = true")

    //- the list ships the first replies of every thread; the rest load on demand
    template(v-if="!isReply")
      .room-comment-item__replies(v-if="replies.items.length")
        RoomCommentItem(
          v-for="reply in replies.items"
          :key="reply.documentId"
          :comment="reply"
          :room-id="roomId"
          :highlighted="reply.documentId === targetDocumentId"
          @deleted="removeReply"
        )
      button.room-comment-item__toggle(v-if="replies.items.length < state.replyCount" :disabled="replies.pending" @click="loadReplies")
        | {{ $t('comments.loadMoreReplies') }}

  // More dialog: comment preview + options; each option opens its own dialog on top
  VanDialog.dialog.room-comment-more-dialog(
    v-model="isOpenMore"
    get-container="body"
    :title="$t('comments.moreTitle')"
    :show-confirm-button="false"
    :show-cancel-button="true"
    :cancel-button-text="$t('general.close')"
    width="min(92vw, 440px)"
  )
    .room-comment-dialog-preview
      PlayerAvatar(v-if="comment.user" :user="comment.user" :size="32")
      .room-comment-dialog-preview__body
        strong.room-comment-dialog-preview__username {{ comment.user && comment.user.username }}
        p.room-comment-dialog-preview__content {{ comment.content }}
    nav.room-comment-more-dialog__options
      button.room-comment-more-dialog__option.room-comment-more-dialog__option--danger(v-if="isOwn" @click="isOpenDelete = true")
        AppIcon(name="tabler:trash")
        span {{ $t('comments.delete') }}
      button.room-comment-more-dialog__option(v-if="!isOwn" auth-control @click="openReport")
        AppIcon(name="tabler:flag")
        span {{ $t('comments.report') }}

  // Delete confirmation, opened over the more dialog
  VanDialog.dialog.room-comment-delete-dialog(
    v-model="isOpenDelete"
    get-container="body"
    :title="$t('comments.deleteConfirm')"
    :show-cancel-button="true"
    :cancel-button-text="$t('general.cancel')"
    :confirm-button-text="$t('comments.delete')"
    :before-close="handleDeleteBeforeClose"
  )
    .room-comment-dialog-preview
      PlayerAvatar(v-if="comment.user" :user="comment.user" :size="32")
      .room-comment-dialog-preview__body
        strong.room-comment-dialog-preview__username {{ comment.user && comment.user.username }}
        p.room-comment-dialog-preview__content {{ comment.content }}

  // teleported like the more dialog so it opens on top of it
  LazyReportDialog(
    v-if="isOpenReportDialog"
    get-container="body"
    :is-open="isOpenReportDialog"
    :scope="reportTypeEnum.COMMENT"
    :additional="reportAdditional"
    @closed="isOpenReportDialog = false"
  )
    template(#prepend)
      blockquote.room-comment-dialog-preview.room-comment-dialog-preview--quote
        PlayerAvatar(v-if="comment.user" :user="comment.user" :size="32")
        .room-comment-dialog-preview__body
          strong.room-comment-dialog-preview__username {{ comment.user && comment.user.username }}
          p.room-comment-dialog-preview__content {{ comment.content }}
</template>

<script>
import { defineComponent, ref, reactive, computed, watch, onMounted, inject, useStore, useContext } from '@nuxtjs/composition-api'
import { Tag, Dialog, Toast } from 'vant'
import { reportTypeEnum } from '@/enums/report-type.enum'

export default defineComponent({
  name: 'RoomCommentItem',
  components: { Tag, VanDialog: Dialog.Component },
  props: {
    comment: { type: Object, required: true },
    roomId: { type: Number, required: true },
    highlighted: { type: Boolean, default: false },
    autoExpandReplies: { type: Boolean, default: false },
    targetDocumentId: { type: String, default: null }
  },
  emits: ['deleted'],
  setup(props, { emit }) {
    const store = useStore()
    const { $auth, i18n } = useContext()

    // local copy of the mutable counters so the prop object is never mutated
    const state = reactive({
      likedByMe: props.comment.likedByMe,
      likeCount: props.comment.likeCount,
      replyCount: props.comment.replyCount
    })

    const isReply = computed(() => Boolean(props.comment.parentDocumentId))
    // reply state lives in RoomReviewView, which owns the single bottom composer
    const thread = inject('commentThread', null)
    const isReplyTarget = computed(() => thread?.replyTarget.value?.parent === props.comment.documentId)
    const isOpenMore = ref(false)
    const isOpenDelete = ref(false)
    const isOpenReportDialog = ref(false)
    const replies = reactive({ items: [...(props.comment.previewReplies || [])], page: 0, hasMore: true, pending: false })

    // the @mention comes from replyToUser (who actually gets notified), never from the typed text
    const mention = computed(() => Boolean(props.comment.replyToUser))
    // older replies were saved with an "@username " prefix in the text; strip it so it isn't shown twice
    const contentWithoutMention = computed(() => {
      const prefix = props.comment.replyToUser && `@${props.comment.replyToUser.username}`

      return prefix && props.comment.content?.startsWith(prefix)
        ? props.comment.content.slice(prefix.length).trimStart()
        : props.comment.content
    })

    const isOwn = computed(() => $auth.loggedIn && props.comment.user && props.comment.user.id === $auth.user?.id)
    const reportAdditional = computed(() =>
      JSON.stringify({ commentDocumentId: props.comment.documentId, roomId: props.roomId, content: props.comment.content })
    )

    const openPlayer = user => {
      if (!user) return

      store.commit('profile/SET_PLAYER_ID', user.id)
      store.commit('profile/SET_PLAYER_USERNAME', user.username)
      store.commit('profile/SET_PLAYER_DIALOG_IS_OPEN', true)
    }

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

    // guests only get the replies; the input needs an account
    const replyTargetOf = () => ({
      parent: props.comment.documentId,
      username: props.comment.user?.username
    })

    // replying needs an account (auth-control prompts guests to log in)
    const toggleThread = () => {
      if (!$auth.loggedIn || !thread) return

      isReplyTarget.value ? thread.cancelReply() : thread.startReply(replyTargetOf())
    }

    // the bottom composer posted a reply into this thread (server re-parents replies to the root)
    if (thread) {
      watch(thread.lastReply, reply => {
        if (isReply.value || !reply || reply.parentDocumentId !== props.comment.documentId) return

        if (!replies.items.some(r => r.documentId === reply.documentId)) {
          replies.items.push(reply)
          state.replyCount += 1
        }
      })
    }

    const removeReply = documentId => {
      replies.items = replies.items.filter(r => r.documentId !== documentId)
      state.replyCount = Math.max(0, state.replyCount - 1)
    }

    const openReport = () => {
      if (!$auth.loggedIn) return

      isOpenReportDialog.value = true
    }

    // keeps the delete dialog open (with a loading button) until the request finishes
    const handleDeleteBeforeClose = async (action, done) => {
      if (action !== 'confirm') {
        done()

        return
      }

      const { error } = await store.dispatch('comment/deleteComment', { documentId: props.comment.documentId })

      if (error) {
        Toast(i18n.t('comments.error'))
        done(false)

        return
      }

      done()
      isOpenMore.value = false
      emit('deleted', props.comment.documentId, state.replyCount)
    }

    onMounted(async () => {
      // deep link: open the thread and page replies until the target reply is loaded (max 5 pages)
      if (props.autoExpandReplies && state.replyCount > 0) {
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

    const { nameStyle } = useCosmetics()
    const loadout = computed(() => (props.comment.user && props.comment.user.loadout) || {})
    const usernameStyle = computed(() => nameStyle(loadout.value.nameColor))

    return {
      usernameStyle,
      reportTypeEnum,
      state,
      isReply,
      isReplyTarget,
      isOpenMore,
      isOpenDelete,
      isOpenReportDialog,
      replies,
      mention,
      contentWithoutMention,
      isOwn,
      reportAdditional,
      openPlayer,
      toggleLike,
      toggleThread,
      loadReplies,
      removeReply,
      openReport,
      handleDeleteBeforeClose
    }
  }
})
</script>

<style lang="scss" src="./RoomCommentItem.component.scss"></style>
