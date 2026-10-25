<template lang="pug">
Dialog.dialog.dialog--scene.play-intro(
  v-model="state.isOpen"
  transition="dialog-scene-bounce"
  :overlay="false"
  :show-cancel-button="inGame"
  :cancel-button-text="$t('general.close')"
  :show-confirm-button="false"
  :close-on-click-overlay="false"
  :close-on-popstate="false"
  @closed="$emit('closed')"
)
  QuizCover.play-intro__cover(
    :label="coverLabel"
    :class="{ 'play-intro__cover--photo': isCreator && room.coverPhoto?.url, 'play-intro__cover--compact': !isCreator }"
    :room="isCreator ? room : null"
    :seed="mode"
    :sublabel="coverSublabel"
  )
    h2.play-intro__title(v-if="isCreator") {{ room.title }}
    QuizTypeLabel.play-intro__type(v-if="isCreator" :room="room")
    //- daily / unlimited stats ride on the banner as pills
    ul.play-intro__stats.play-intro__stats--cover(v-else)
      li.play-intro__stat(v-for="stat in stats" :key="stat.key")
        AppIcon(:name="stat.icon" :width="14" :height="14")
        span {{ stat.text }}

  .play-intro__body
    p.play-intro__description(v-if="isCreator && room.description") {{ room.description }}

    ul.play-intro__stats(v-if="isCreator")
      li.play-intro__stat(v-for="stat in stats" :key="stat.key")
        AppIcon(:name="stat.icon" :width="16" :height="16")
        span {{ stat.text }}

    Button.play-intro__play(v-if="!inGame" block round @click="play")
      AppIcon(name="tabler:player-play-filled" :width="20" :height="20")
      span {{ $t('playIntro.play') }}

    .play-intro__actions(v-if="isCreator")
      Button.play-intro__action(round size="small" @click="shareRoom(room)")
        AppIcon(name="tabler:share" :width="16" :height="16")
        span {{ $t('playIntro.share') }}
      Button.play-intro__action(v-if="canShareToCommunity" round size="small" @click="communityShareOpen = true")
        AppIcon(name="tabler:users" :width="16" :height="16")
        span {{ $t('playIntro.shareToCommunity') }}
      Button.play-intro__action(round size="small" @click="openReviews")
        AppIcon(name="tabler:star" :width="16" :height="16")
        span {{ $t('playIntro.rate') }}
      Button.play-intro__action(v-if="isGm && room.documentId" round size="small" @click="gmModerationOpen = true")
        AppIcon(name="tabler:shield" :width="16" :height="16")
        span {{ $t('gmModeration.title') }}

    section.play-intro__creator(v-if="isCreator")
      CreatorByline(:user="creatorUser")

    hr.play-intro__divider(v-if="isCreator")

    //- creator rooms skip the rules; daily / unlimited keep them
    Collapse.play-intro__rules(v-if="!isCreator" v-model="rulesOpen" :border="false")
      CollapseItem(name="rules" icon="question-o" :title="$t('playIntro.howToPlay')")
        HowToPlayContent

    //- daily / unlimited: the ad sits above the leaderboard, not under it
    DialogAd.play-intro__ad(v-if="!isCreator")

    section.play-intro__leaderboard(v-if="isQa || mode === 'daily'")
      h3.play-intro__section-title
        AppIcon(name="tabler:crown" :width="18" :height="18")
        span {{ $t('playIntro.leaderboard') }}
      Loading(v-if="leaderboard.pending" color="var(--color-brand-02)" size="20")
      template(v-else-if="!leaderboard.failed")
        Leaderboard(v-if="leaderboard.items.length" :scorers="leaderboard.items")
        Empty.play-intro__empty(v-else :description="$t('playIntro.noScores')")
      //- the intro already lists the top 10; the full board is only worth a link when there's more
      Button.play-intro__more(
        v-if="isQa && !leaderboard.pending && leaderboard.total > leaderboard.items.length"
        round
        size="small"
        @click="openFullScoreboard"
      ) {{ $t('playIntro.fullScoreboard') }}
      NuxtLink.play-intro__more-link(
        v-if="mode === 'daily' && !leaderboard.pending && leaderboard.total > leaderboard.items.length"
        :to="localePath({ name: 'DailyMode-Leaderboard-period', params: { period: $t('period.daily.slug') } })"
      ) {{ $t('playIntro.dailyLeaderboard') }}

    DialogAd.play-intro__ad(v-if="isCreator")

    //- same comments UI as the reviews dialog (likes, replies, composer), without the rating block
    section.play-intro__comments(v-if="isCreator && room.id")
      RoomReviewView(:key="reviewsKey" comments-only)

    DialogAd.play-intro__ad(v-if="isCreator")

  footer.play-intro__footer
    i18n.d-flex(path="app.copyright")
      template(#logo)
        FooterBrandLogo

  LazyRoomReviewDialog(v-if="isCreator" :isOpen="reviewDialog.isOpen" @closed="onReviewClosed")
  LazyCommunityShareDialog(v-if="canShareToCommunity" :is-open.sync="communityShareOpen" :room="room")
  LazyGmModerationDialog(v-if="isGm && room.documentId" :is-open.sync="gmModerationOpen" :item="room" target="room")
</template>

<script>
import { defineComponent, reactive, ref, computed, watch, onBeforeUnmount, useStore, useContext } from '@nuxtjs/composition-api'
import { Dialog, Button, Collapse, CollapseItem, Loading, Empty } from 'vant'
import { GAME_TIME_LIMIT } from '@/system/constant'
import { quizTypeEnum } from '@/enums/quiz.enum'
import { isGmUser } from '@/helpers/chat-command'

export default defineComponent({
  components: {
    Dialog: Dialog.Component,
    Button,
    Collapse,
    CollapseItem,
    Loading,
    Empty
  },
  props: {
    isOpen: {
      type: Boolean,
      required: false,
      default: false
    },
    mode: {
      type: String,
      required: true,
      validator: value => ['creator', 'daily', 'unlimited'].includes(value)
    },
    // reopened from the header mid-game: no play button, a close button instead
    inGame: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  emits: ['closed'],
  setup(props) {
    const store = useStore()
    const { i18n, localePath } = useContext()
    const { formatMillions } = useFormatter()
    const { shareRoom } = useRoomShare()

    const state = reactive({ isOpen: props.isOpen })
    // desktop has room for the rules, so they start expanded there
    const rulesOpen = ref(window.matchMedia('(min-width: 992px)').matches ? ['rules'] : [])
    const reviewDialog = reactive({ isOpen: false })
    const reviewsKey = ref(0)

    watch(
      () => props.isOpen,
      value => {
        state.isOpen = value
      }
    )

    // the header's how-to-play button checks this so it doesn't stack a dialog on the intro;
    // the header's own in-game copy must not touch it
    if (!props.inGame) {
      watch(
        () => state.isOpen,
        value => store.commit('app/SET_IS_OPEN_INTRO_HOW_TO_PLAY', value),
        { immediate: true }
      )

      onBeforeUnmount(() => store.commit('app/SET_IS_OPEN_INTRO_HOW_TO_PLAY', false))
    }

    const room = computed(() => store.getters['creator/room'] || {})
    // owners always receive room.user, anonymous rooms included
    const creatorUser = computed(() => (room.value.isAnon ? null : room.value.user))
    const isCreator = computed(() => props.mode === 'creator')
    const me = computed(() => store.getters['auth/user'])
    const communityShareOpen = ref(false)
    const isGm = computed(() => isCreator.value && isGmUser(me.value))
    const gmModerationOpen = ref(false)
    // mirrors the server rule (canShareRoom); moderated quizzes never
    const canShareToCommunity = computed(
      () =>
        isCreator.value &&
        Boolean(me.value) &&
        Boolean(room.value.documentId) &&
        !room.value.isSystemRemovedFromPublic &&
        (store.getters['auth/postableCommunities'] || []).length > 0 &&
        // a listed quiz is shareable by anyone, even anonymous; an unlisted one only by its owner, and never when anonymous
        (room.value.isListed || (!room.value.isAnon && room.value.user?.id === me.value.id))
    )
    const isQa = computed(() => isCreator.value && (!room.value.quizType || room.value.quizType === quizTypeEnum.QA))
    const minutes = computed(() =>
      Math.round((isCreator.value && room.value.gameTimeLimit ? room.value.gameTimeLimit : GAME_TIME_LIMIT) / 60000)
    )

    const coverLabel = computed(() => {
      if (props.mode === 'daily') return i18n.t('playIntro.daily')

      return props.mode === 'unlimited' ? i18n.t('playIntro.unlimited') : null
    })

    const coverSublabel = computed(() =>
      props.mode === 'daily' ? new Date().toLocaleDateString(i18n.locale, { day: 'numeric', month: 'long', year: 'numeric' }) : null
    )

    const stats = computed(() => {
      const time = { key: 'time', icon: 'tabler:clock', text: i18n.t('playIntro.timeLimit', { minutes: minutes.value }) }

      if (props.mode === 'daily') {
        const letters = store.getters['daily/alphabet']?.items?.length || 0

        return [letters && { key: 'letters', icon: 'tabler:abc', text: i18n.tc('playIntro.letters', letters) }, time].filter(Boolean)
      }

      if (props.mode === 'unlimited') return [time]

      const r = room.value
      const countByType =
        r.quizType === quizTypeEnum.CHOICES
          ? i18n.tc('playIntro.choices', r.choices?.length || 0)
          : r.quizType === quizTypeEnum.FLASHCARDS
          ? i18n.tc('playIntro.flashcards', r.flashcardCount || 0)
          : i18n.tc('playIntro.questions', r.questionCount || 0)

      return [
        Number(r.rating) > 0 && {
          key: 'rating',
          icon: 'tabler:star',
          text: `${i18n.t('playIntro.rating', { rating: Number(r.rating || 0).toFixed(1) })} ${i18n.t('playIntro.raters', {
            count: r.ratingCount || 0
          })}`
        },
        {
          key: 'views',
          icon: 'tabler:eye',
          text: i18n.tc('playIntro.views', Number(r.viewCount) || 0, { count: formatMillions(r.viewCount || 0) })
        },
        { key: 'count', icon: 'tabler:list-numbers', text: countByType },
        { key: 'comments', icon: 'tabler:message-2', text: i18n.tc('playIntro.comments', r.reviewCount || 0) },
        time,
        r.createdAt && {
          key: 'date',
          icon: 'tabler:calendar',
          text: new Date(r.createdAt).toLocaleDateString(i18n.locale, { day: 'numeric', month: 'long', year: 'numeric' })
        }
      ].filter(Boolean)
    })

    // closing is what starts the game (scenes bind @closed="startGame")
    const play = () => {
      state.isOpen = false
    }

    const onReviewClosed = () => {
      reviewDialog.isOpen = false
      // the embedded comments list may be stale after posting in the dialog
      reviewsKey.value++
    }

    const openReviews = () => {
      reviewDialog.isOpen = true
    }

    const leaderboard = reactive({ items: [], total: 0, pending: false, failed: false })
    // the load watch re-runs on reopen / when room.id arrives; only the latest response may write
    let leaderboardRequest = 0

    const loadLeaderboard = async () => {
      const request = ++leaderboardRequest
      let items = []
      let total = 0
      let failed = false

      leaderboard.pending = true

      if (isQa.value && room.value.roomId) {
        const { error } = await store.dispatch('creator/fetchScoreboard', { roomId: room.value.roomId, limit: 10 })
        failed = Boolean(error)
        // the action returns the raw payload, so read the transformed list from the store; room-scores come back ranked and
        // Leaderboard wants flat users carrying their results
        items = failed
          ? []
          : (store.getters['creator/scoreboard'].list || [])
              .filter(item => item.user)
              .slice(0, 10)
              .map(item => ({ ...item.user, results: item.results }))
        total = failed ? 0 : store.getters['creator/scoreboard'].total || 0
      } else if (props.mode === 'daily') {
        const { error } = await store.dispatch('daily/fetchLeaderboard', { period: 'daily', limit: 10 })
        failed = Boolean(error)
        items = failed ? [] : (store.getters['daily/leaderboard']?.items || []).slice(0, 10)
        total = failed ? 0 : store.getters['daily/leaderboard']?.meta?.pagination?.total || 0
      }

      if (request !== leaderboardRequest) return

      leaderboard.items = items
      leaderboard.total = total
      leaderboard.failed = failed
      leaderboard.pending = false
    }

    // the stats dialog lands on the tab set here; it opens above the intro, so the game starts only when the intro closes
    const openFullScoreboard = () => {
      store.commit('creator/SET_STATS_DIALOG_TAB', 'scoreboard')
      store.commit('creator/SET_IS_OPEN_STATS_DIALOG', true)
    }

    watch(
      () => [state.isOpen, room.value.id],
      ([isOpen]) => {
        if (!isOpen) return

        loadLeaderboard()
      },
      { immediate: true }
    )

    return {
      state,
      isGm,
      gmModerationOpen,
      rulesOpen,
      reviewDialog,
      room,
      isCreator,
      isQa,
      coverLabel,
      coverSublabel,
      stats,
      play,
      openReviews,
      onReviewClosed,
      creatorUser,
      leaderboard,
      reviewsKey,
      openFullScoreboard,
      localePath,
      shareRoom,
      canShareToCommunity,
      communityShareOpen
    }
  }
})
</script>

<style lang="scss" src="./PlayIntroDialog.component.scss"></style>
