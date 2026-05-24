<template lang="pug">
NuxtLink.quiz-card(
  :to="localePath({ name: 'CreatorMode-CreatorModeRoom-slug', params: { slug: room.roomId } })"
  :title="room.title"
  :style="cardStyle"
  :class="{ 'quiz-card--hasCoverPhoto': hasCoverPhoto }"
  :data-index="index"
)
  .quiz-card__media
    template(v-if="hasCoverPhoto")
      img.quiz-card__photo(:src="room.coverPhoto.url" loading="lazy" draggable="false" :alt="room.title")

    template(v-else)
      .quiz-card__placeholder
        .quiz-card__placeholder-grid
        .quiz-card__placeholder-glow

    .quiz-card__media-shade

    h3.quiz-card__placeholder-title {{ room.title }}

    .quiz-card__media-top
      .quiz-card__media-top-left
        template(v-if="userScoped && isOwner({ user: room.user })")
          span.quiz-card__chip.quiz-card__chip--draft(v-if="!room.isVisible")
            AppIcon.quiz-card__chip-icon(name="tabler:edit-circle" :width="11" :height="11")
            | {{ $t('general.draft') }}
          span.quiz-card__chip(v-if="room.isListed")
            AppIcon.quiz-card__chip-icon(name="tabler:world" :width="11" :height="11")
            | {{ $t('creatorModeMyRooms.listing.public') }}
          span.quiz-card__chip(v-else)
            AppIcon.quiz-card__chip-icon(name="tabler:eye-off" :width="11" :height="11")
            | {{ $t('creatorModeMyRooms.listing.private') }}

      .quiz-card__media-top-right
        span.quiz-card__rating(v-if="hasRating")
          AppIcon.quiz-card__rating-star(name="tabler:star-filled" :width="11" :height="11")
          span.quiz-card__rating-value {{ formatRating(room.rating) }}
          span.quiz-card__rating-count(v-if="room.reviewsCount") ({{ room.reviewsCount }})

        span.quiz-card__crown(v-if="room.isFeatured" :title="$t('general.editorsChoice')")
          AppIcon(name="tabler:crown" :width="12" :height="12")

  .quiz-card__body
    .quiz-card__title-slot.quiz-card__title-slot--inline(v-if="quizTypePill")
      PlayerAvatar.quiz-card__author.quiz-card__author--inline(
        with-username
        :size="24"
        :user="room.isAnon ? null : room.user"
        :open-player-dialog-on-click="!room.isAnon && !!room.user"
      )

      span.quiz-card__quiz-label(:class="`quiz-card__quiz-label--${quizTypePill.key}`")
        img.quiz-card__quiz-label-versus(
          v-if="quizTypePill.key === 'choices'"
          src="/img/elements/versus.webp"
          alt
          draggable="false"
          width="18"
          height="18"
        )
        AppIcon.quiz-card__quiz-label-icon(v-else :name="quizTypePill.icon" :width="16" :height="16")
        span.quiz-card__quiz-label-text {{ quizTypePill.label }}

    .quiz-card__tags
      template(v-if="room.tags && room.tags.length > 0")
        template(v-for="tag in room.tags.slice(0, 3)")
          span.quiz-card__tag(:key="tag.id") {{ tag.title }}
        span.quiz-card__tag.quiz-card__tag--more(v-if="room.tags.length > 3")
          | +{{ room.tags.length - 3 }}

    .quiz-card__footer
      .quiz-card__stats
        span.quiz-card__stat.quiz-card__stat--accent(v-if="room.viewCount && room.viewCount > 0")
          AppIcon.quiz-card__stat-icon(name="tabler:player-play-filled" :width="13" :height="13")
          span.quiz-card__stat-value {{ formatCount(room.viewCount) }}

        span.quiz-card__stat(v-if="room.questionCount")
          AppIcon.quiz-card__stat-icon(name="tabler:help-square-rounded" :width="13" :height="13")
          span.quiz-card__stat-value {{ room.questionCount }}

        span.quiz-card__stat(v-if="room.choices && room.choices.length > 0")
          AppIcon.quiz-card__stat-icon(name="tabler:list-check" :width="13" :height="13")
          span.quiz-card__stat-value {{ room.choices.length }}

        span.quiz-card__stat(v-if="room.flashcardCount > 0")
          AppIcon.quiz-card__stat-icon(name="tabler:cards" :width="13" :height="13")
          span.quiz-card__stat-value {{ room.flashcardCount }}

      .quiz-card__owner-actions(v-if="viewer && isOwner({ user: room.user })")
        button.quiz-card__owner-action.quiz-card__owner-action--edit(
          type="button"
          :title="$t('general.edit')"
          :aria-label="$t('general.edit')"
          @click.prevent.stop="onEdit"
        )
          AppIcon(name="tabler:pencil" :width="14" :height="14")
        button.quiz-card__owner-action.quiz-card__owner-action--delete(
          type="button"
          :title="$t('general.delete')"
          :aria-label="$t('general.delete')"
          @click.prevent.stop="onDelete"
        )
          AppIcon(name="tabler:trash" :width="14" :height="14")
</template>

<script>
import { defineComponent, useContext, computed } from '@nuxtjs/composition-api'
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
  name: 'QuizCard',
  props: {
    room: {
      type: Object,
      required: true
    },
    viewer: {
      type: Object,
      required: false,
      default: null
    },
    userScoped: {
      type: Boolean,
      required: false,
      default: false
    },
    index: {
      type: Number,
      required: false,
      default: 0
    }
  },
  emits: ['edit', 'delete'],
  setup(props, { emit }) {
    const { i18n } = useContext()
    const { isOwner } = useAuth()

    const hasCoverPhoto = computed(() => Boolean(props.room?.coverPhoto?.url))

    const hasRating = computed(() => {
      const n = Number(props.room?.rating)

      return Number.isFinite(n) && n > 0
    })

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

    const cardStyle = computed(() => {
      const key = props.room?.roomId || props.room?.documentId || props.room?.title || ''
      const palette = PLACEHOLDER_PALETTES[hashSeed(key) % PLACEHOLDER_PALETTES.length]

      return {
        '--quiz-card-from': palette.from,
        '--quiz-card-to': palette.to,
        '--quiz-card-tint': palette.tint
      }
    })

    const quizTypePill = computed(() => {
      const room = props.room

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
    })

    const onEdit = () => emit('edit', { room: props.room })
    const onDelete = () => emit('delete', { room: props.room })

    return {
      isOwner,
      hasCoverPhoto,
      hasRating,
      formatRating,
      formatCount,
      cardStyle,
      quizTypePill,
      onEdit,
      onDelete
    }
  }
})
</script>

<style lang="scss" src="./QuizCard.component.scss"></style>
