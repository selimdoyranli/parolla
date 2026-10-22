<template lang="pug">
article.community-post-card
  .community-post-card__quote
    .community-post-card__head
      PlayerAvatar(with-username open-player-dialog-on-click :size="28" :user="post.author")
      NuxtLink.community-post-card__time(:to="postLink") {{ relativeTime }}

      .community-post-card__menu.dropdown(v-if="hasMenu")
        DropdownMenu(withDropdownCloser direction="left" :overlay="false" :is-open="isMenuOpen" @closed="isMenuOpen = false")
          template(#trigger)
            Button.community-post-card__menu-trigger(icon="ellipsis" size="mini" round :aria-label="$t('community.detail.menu.label')")
          template(#body)
            nav.community-post-card__menu-nav
              .community-post-card__menu-item(v-if="canReport" dropdown-closer @click="$emit('report', post)")
                AppIcon(name="tabler:flag" :width="18" :height="18")
                span {{ $t('community.report') }}
              .community-post-card__menu-item.is-danger(v-if="post.canDelete" dropdown-closer @click="handleDelete")
                AppIcon(name="tabler:trash" :width="18" :height="18")
                span {{ $t('community.post.delete') }}

    p.community-post-card__note(v-if="post.note") {{ post.note }}
    p.community-post-card__note.community-post-card__note--default(v-else) {{ sharedText }}

  QuizCard(:room="post.room" :viewer="$auth.user")

  .community-post-card__footer
    button.community-post-card__action(type="button" :class="{ 'is-active': liked }" :aria-pressed="liked" @click="handleLike")
      AppIcon(:name="liked ? 'tabler:heart-filled' : 'tabler:heart'" :width="18" :height="18")
      span {{ likeCount }}
    NuxtLink.community-post-card__action(:to="postLink")
      AppIcon(name="tabler:message-2" :width="18" :height="18")
      span {{ post.commentCount }}
</template>

<script>
import { defineComponent, computed, ref, watch, useStore, useContext } from '@nuxtjs/composition-api'
import DropdownMenu from 'v-dropdown-menu'
import 'v-dropdown-menu/dist/v-dropdown-menu.css'
import { Button, Dialog, Notify } from 'vant'

const UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60]
]

export default defineComponent({
  name: 'CommunityPostCard',
  components: { DropdownMenu, Button },
  props: {
    post: { type: Object, required: true }
  },
  // report: post to report; deleted: post removed on the server
  emits: ['report', 'deleted'],
  setup(props, { emit }) {
    const store = useStore()
    const { i18n, app, $auth } = useContext()

    const isMenuOpen = ref(false)
    const liked = ref(props.post.viewerLiked)
    const likeCount = ref(props.post.likeCount)
    const isLiking = ref(false)

    // a refetched post replaces the optimistic state
    watch(
      () => [props.post.viewerLiked, props.post.likeCount],
      ([isLiked, count]) => {
        liked.value = isLiked
        likeCount.value = count
      }
    )

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

    const sharedText = computed(() => i18n.t('community.post.sharedQuiz', { user: props.post.author?.username }))

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
        message: i18n.t('community.post.confirmDelete'),
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

    return { isMenuOpen, liked, likeCount, postLink, relativeTime, canReport, hasMenu, sharedText, handleLike, handleDelete }
  }
})
</script>

<style lang="scss" src="./CommunityPostCard.component.scss"></style>
