<template lang="pug">
article.community-post-card
  .community-post-card__head
    PlayerAvatar(open-player-dialog-on-click :size="40" :user="post.author")
    .community-post-card__byline
      strong.community-post-card__author {{ post.author?.username }}
        span.gm-username-extra(v-if="post.author?.role?.name === 'GM'") &nbsp;(GM)
      NuxtLink.community-post-card__time(:to="postLink") {{ relativeTime }}

    .community-post-card__menu.dropdown(v-if="hasMenu")
      DropdownMenu(
        withDropdownCloser
        direction="right"
        :overlay="false"
        :is-open="isMenuOpen"
        @opened="isMenuOpen = true"
        @closed="isMenuOpen = false"
      )
        template(#trigger)
          ActionButton(:label="$t('community.detail.menu.label')" icon="tabler:dots")
        template(#body)
          nav.community-post-card__menu-nav
            .community-post-card__menu-item(v-if="canReport" dropdown-closer @click="$emit('report', post)")
              AppIcon(name="tabler:flag" :width="18" :height="18")
              span {{ $t('community.post.report') }}
            .community-post-card__menu-item.is-danger(v-if="post.canDelete" dropdown-closer @click="handleDelete")
              AppIcon(name="tabler:trash" :width="18" :height="18")
              span {{ $t('community.post.delete') }}

  p.community-post-card__note(v-if="post.note" :class="{ 'is-text': !post.room }") {{ post.note }}

  //- the shared quiz: same link and stat icons as QuizCard; text posts have none
  NuxtLink.community-post-card__quiz(
    v-if="post.room"
    :to="localePath({ name: 'CreatorMode-CreatorModeRoom-slug', params: { slug: room.roomId } })"
    :title="room.title"
  )
    //- covers are 16:9: contain them in the square over a blurred copy of themselves
    .community-post-card__thumb.is-photo(v-if="room.coverPhoto?.url")
      .community-post-card__thumb-blur(aria-hidden="true" :style="{ backgroundImage: `url(${room.coverPhoto.url})` }")
      img.community-post-card__thumb-img(:src="room.coverPhoto.url" loading="lazy" draggable="false" :alt="room.title")
    QuizCover.community-post-card__thumb(v-else :room="room")
      span.community-post-card__initials {{ initials }}
    .community-post-card__quiz-body
      QuizTypeLabel(:room="room")
      h3.community-post-card__quiz-title {{ room.title }}
      CreatorByline(:user="room.isAnon ? null : room.user" :size="32")
      .community-post-card__stats
        span.community-post-card__stat
          AppIcon(name="tabler:player-play-filled" :width="14" :height="14")
          | {{ formatCount(room.viewCount) }}
        span.community-post-card__stat(v-if="room.questionCount")
          AppIcon(name="tabler:help-square-rounded" :width="14" :height="14")
          | {{ room.questionCount }}
        span.community-post-card__stat
          AppIcon(name="tabler:message-2" :width="14" :height="14")
          | {{ formatCount(room.reviewCount) }}
        span.community-post-card__stat(v-if="room.rating > 0")
          AppIcon(name="tabler:star-filled" :width="14" :height="14")
          | {{ Number(room.rating).toFixed(1) }}
    AppIcon.community-post-card__external(name="tabler:external-link" :width="18" :height="18")

  .community-post-card__footer
    button.community-post-card__pill.community-post-card__pill--like(
      type="button"
      :class="{ 'is-active': liked }"
      :aria-pressed="liked"
      :aria-label="$t('community.post.likes', { count: likeCount })"
      @click="handleLike"
    )
      AppIcon(:name="liked ? 'tabler:heart-filled' : 'tabler:heart'" :width="18" :height="18")
      span {{ likeCount || $t('community.post.likeAction') }}
    button.community-post-card__pill.community-post-card__pill--comment(
      v-if="withComments"
      type="button"
      :aria-label="$t('community.post.comments', { count: commentCount })"
      @click="$refs.thread.focus()"
    )
      AppIcon(name="tabler:message-2" :width="18" :height="18")
      span {{ commentCount || $t('community.post.commentAction') }}
    NuxtLink.community-post-card__pill.community-post-card__pill--comment(
      v-else
      :to="postLink"
      :aria-label="$t('community.post.comments', { count: commentCount })"
    )
      AppIcon(name="tabler:message-2" :width="18" :height="18")
      span {{ commentCount || $t('community.post.commentAction') }}

  CommentThreadView.community-post-card__comments(
    v-if="withComments"
    ref="thread"
    inline
    :preview-count="2"
    :is-empty="!post.commentCount"
    :post-id="post.documentId"
    :community-slug="post.community.slug"
    @changed="refreshCommentCount"
  )
</template>

<script>
import { defineComponent, computed, ref, watch, onBeforeUnmount, useStore, useContext } from '@nuxtjs/composition-api'
import DropdownMenu from 'v-dropdown-menu'
import 'v-dropdown-menu/dist/v-dropdown-menu.css'
import { Dialog, Notify } from 'vant'
import { getInitials } from '@/transformers/community.transformer'

const UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60]
]

export default defineComponent({
  name: 'CommunityPostCard',
  components: { DropdownMenu },
  props: {
    post: { type: Object, required: true },
    // feed: the first comments and a composer inside the card (the post page lists them itself)
    withComments: { type: Boolean, default: false }
  },
  // report: post to report; deleted: post removed on the server
  emits: ['report', 'deleted'],
  setup(props, { emit }) {
    const store = useStore()
    const { i18n, app, $auth } = useContext()

    const isMenuOpen = ref(false)
    const liked = ref(props.post.viewerLiked)
    const likeCount = ref(props.post.likeCount)
    // the library has no Escape support; closing the prop closes the menu
    const closeOnEscape = event => event.key === 'Escape' && (isMenuOpen.value = false)

    watch(isMenuOpen, open => document[`${open ? 'add' : 'remove'}EventListener`]('keydown', closeOnEscape))
    onBeforeUnmount(() => document.removeEventListener('keydown', closeOnEscape))
    const isLiking = ref(false)

    // a refetched post replaces the optimistic state
    watch(
      () => [props.post.viewerLiked, props.post.likeCount],
      ([isLiked, count]) => {
        liked.value = isLiked
        likeCount.value = count
      }
    )

    const commentCount = ref(props.post.commentCount)

    watch(
      () => props.post.commentCount,
      count => (commentCount.value = count)
    )

    // the server count also covers replies and deletions, so ask it instead of counting here
    const refreshCommentCount = async () => {
      const { data } = await store.dispatch('community/fetchPost', { documentId: props.post.documentId })

      if (data) commentCount.value = data.commentCount
    }

    const postLink = computed(() =>
      app.localePath({
        name: 'Community-CommunityPost-slug-postId',
        params: { slug: props.post.community.slug, postId: props.post.documentId }
      })
    )

    const relativeTime = computed(() => {
      const seconds = Math.round((new Date(props.post.createdAt).getTime() - Date.now()) / 1000)
      const formatter = new Intl.RelativeTimeFormat(i18n.locale, { numeric: 'auto' })
      const [unit, size] = UNITS.find(([, s]) => Math.abs(seconds) >= s) || ['minute', 60]

      return formatter.format(Math.round(seconds / size), unit)
    })

    const room = computed(() => props.post.room || {})
    const initials = computed(() => getInitials(room.value.title))

    const formatCount = count => {
      const n = Number(count) || 0

      if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`

      if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`

      return String(n)
    }

    const canReport = computed(() => $auth.loggedIn && !props.post.canDelete)
    const hasMenu = computed(() => canReport.value || props.post.canDelete)

    const notifyError = error =>
      Notify({
        message: error?.message || i18n.t('community.error.generic'),
        color: 'var(--color-text-04)',
        background: 'var(--color-danger-01)',
        duration: 3000
      })

    const handleLike = async () => {
      if (!$auth.loggedIn) return store.commit('auth/SET_AUTH_DIALOG_IS_OPEN', true)

      if (isLiking.value) return

      isLiking.value = true

      const previous = { liked: liked.value, likeCount: likeCount.value }

      liked.value = !previous.liked
      likeCount.value = Math.max(0, previous.likeCount + (liked.value ? 1 : -1))

      const { data, error } = await store.dispatch(`community/${liked.value ? 'likePost' : 'unlikePost'}`, {
        documentId: props.post.documentId
      })

      isLiking.value = false

      if (error) {
        liked.value = previous.liked
        likeCount.value = previous.likeCount

        return notifyError(error)
      }

      if (typeof data?.likeCount === 'number') likeCount.value = data.likeCount
    }

    const handleDelete = () =>
      Dialog.confirm({
        message: i18n.t(props.post.room ? 'community.post.confirmDelete' : 'community.post.confirmDeleteText'),
        cancelButtonText: i18n.t('general.cancel'),
        confirmButtonText: i18n.t('general.apply')
      })
        .then(async () => {
          const { error } = await store.dispatch('community/deletePost', { documentId: props.post.documentId })

          if (error) return notifyError(error)

          Notify({ type: 'success', message: i18n.t('community.post.deleted'), duration: 2000 })
          emit('deleted', props.post)
        })
        .catch(() => {})

    return {
      isMenuOpen,
      liked,
      likeCount,
      commentCount,
      refreshCommentCount,
      postLink,
      relativeTime,
      canReport,
      hasMenu,
      room,
      initials,
      formatCount,
      handleLike,
      handleDelete
    }
  }
})
</script>

<style lang="scss" src="./CommunityPostCard.component.scss"></style>
