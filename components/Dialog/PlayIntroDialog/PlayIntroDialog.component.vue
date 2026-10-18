<template lang="pug">
Dialog.dialog.dialog--scene.play-intro(
  v-model="state.isOpen"
  transition="dialog-scene-bounce"
  :overlay="false"
  :show-cancel-button="false"
  :show-confirm-button="false"
  :close-on-click-overlay="false"
  :close-on-popstate="false"
  @closed="$emit('closed')"
)
  QuizCover.play-intro__cover(:label="coverLabel" :room="isCreator ? room : null" :seed="mode" :sublabel="coverSublabel")

  .play-intro__body
    template(v-if="isCreator")
      h2.play-intro__title {{ room.title }}
      p.play-intro__description(v-if="room.description") {{ room.description }}

    ul.play-intro__stats
      li.play-intro__stat(v-for="stat in stats" :key="stat.key")
        AppIcon(:name="stat.icon" :width="16" :height="16")
        span {{ stat.text }}

    Button.play-intro__play(block round @click="play")
      AppIcon(name="tabler:player-play-filled" :width="20" :height="20")
      span {{ $t('playIntro.play') }}

    .play-intro__actions(v-if="isCreator")
      Button.play-intro__action(round size="small" @click="shareRoom(room)")
        AppIcon(name="tabler:share" :width="16" :height="16")
        span {{ $t('playIntro.share') }}
      Button.play-intro__action(round size="small" @click="openReviews")
        AppIcon(name="tabler:star" :width="16" :height="16")
        span {{ $t('playIntro.rate') }}

    Collapse.play-intro__rules(v-model="rulesOpen" :border="false")
      CollapseItem(name="rules" icon="question-o" :title="$t('playIntro.howToPlay')")
        HowToPlayContent

    section.play-intro__creator(v-if="isCreator")
      small {{ $t('playIntro.creator') }}
      PlayerAvatar(v-if="room.user" with-username open-player-dialog-on-click :size="36" :user="room.user")
      strong(v-else) {{ $t('playIntro.anon') }}

    .play-intro__ad
      AppAd(v-if="isDesktop" :data-ad-slot="9964323575")
      AppAd(v-else :data-ad-slot="5200543400")

  footer.play-intro__footer
    i18n.d-flex(path="app.copyright")
      template(#logo)
        FooterBrandLogo

  LazyRoomReviewDialog(v-if="isCreator" :isOpen="reviewDialog.isOpen" @closed="reviewDialog.isOpen = false")
</template>

<script>
import { defineComponent, reactive, ref, computed, watch, onBeforeUnmount, useStore, useContext } from '@nuxtjs/composition-api'
import { Dialog, Button, Collapse, CollapseItem } from 'vant'
import { useMediaQuery } from '@vueuse/core'
import { GAME_TIME_LIMIT } from '@/system/constant'
import { quizTypeEnum } from '@/enums/quiz.enum'

const DATE_OPTIONS = { showHour: false, showMinute: false, showDay: true, showMonth: true }

export default defineComponent({
  components: {
    Dialog: Dialog.Component,
    Button,
    Collapse,
    CollapseItem
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
    }
  },
  emits: ['closed'],
  setup(props) {
    const store = useStore()
    const { i18n } = useContext()
    const { isoToHumanDate, formatMillions } = useFormatter()
    const { shareRoom } = useRoomShare()
    const isDesktop = useMediaQuery('(min-width: 992px)')

    const state = reactive({ isOpen: props.isOpen })
    const rulesOpen = ref([])
    const reviewDialog = reactive({ isOpen: false })

    watch(
      () => props.isOpen,
      value => {
        state.isOpen = value
      }
    )

    // the header's how-to-play button checks this so it doesn't stack a dialog on the intro
    watch(
      () => state.isOpen,
      value => store.commit('app/SET_IS_OPEN_INTRO_HOW_TO_PLAY', value),
      { immediate: true }
    )

    onBeforeUnmount(() => store.commit('app/SET_IS_OPEN_INTRO_HOW_TO_PLAY', false))

    const room = computed(() => store.getters['creator/room'] || {})
    const isCreator = computed(() => props.mode === 'creator')
    const isQa = computed(() => isCreator.value && (!room.value.quizType || room.value.quizType === quizTypeEnum.QA))
    const minutes = computed(() =>
      Math.round((isCreator.value && room.value.gameTimeLimit ? room.value.gameTimeLimit : GAME_TIME_LIMIT) / 60000)
    )

    const coverLabel = computed(() => {
      if (props.mode === 'daily') return i18n.t('playIntro.daily')

      return props.mode === 'unlimited' ? i18n.t('playIntro.unlimited') : null
    })

    const coverSublabel = computed(() => (props.mode === 'daily' ? isoToHumanDate(new Date().toISOString(), DATE_OPTIONS) : null))

    const stats = computed(() => {
      const time = { key: 'time', icon: 'tabler:clock', text: i18n.t('playIntro.timeLimit', { minutes: minutes.value }) }

      if (props.mode === 'daily') {
        const letters = store.getters['daily/alphabet']?.items?.length || 0

        return [letters && { key: 'letters', icon: 'tabler:abc', text: i18n.t('playIntro.letters', { count: letters }) }, time].filter(
          Boolean
        )
      }

      if (props.mode === 'unlimited') return [time]

      const r = room.value
      const countByType =
        r.quizType === quizTypeEnum.CHOICES
          ? i18n.t('playIntro.choices', { count: r.choices?.length || 0 })
          : r.quizType === quizTypeEnum.FLASHCARDS
          ? i18n.t('playIntro.flashcards', { count: r.flashcardCount || 0 })
          : i18n.t('playIntro.questions', { count: r.questionCount || 0 })

      return [
        {
          key: 'rating',
          icon: 'tabler:star',
          text: `${i18n.t('playIntro.rating', { rating: Number(r.rating || 0).toFixed(1) })} ${i18n.t('playIntro.raters', {
            count: r.ratingCount || 0
          })}`
        },
        { key: 'views', icon: 'tabler:eye', text: i18n.t('playIntro.views', { count: formatMillions(r.viewCount || 0) }) },
        { key: 'count', icon: 'tabler:list-numbers', text: countByType },
        { key: 'comments', icon: 'tabler:message-2', text: i18n.t('playIntro.comments', { count: r.reviewCount || 0 }) },
        time,
        r.createdAt && { key: 'date', icon: 'tabler:calendar', text: isoToHumanDate(r.createdAt, { ...DATE_OPTIONS, showYear: true }) }
      ].filter(Boolean)
    })

    // closing is what starts the game (scenes bind @closed="startGame")
    const play = () => {
      state.isOpen = false
    }

    const openReviews = () => {
      reviewDialog.isOpen = true
    }

    return {
      state,
      rulesOpen,
      reviewDialog,
      room,
      isCreator,
      isQa,
      isDesktop,
      coverLabel,
      coverSublabel,
      stats,
      play,
      openReviews,
      shareRoom
    }
  }
})
</script>

<style lang="scss" src="./PlayIntroDialog.component.scss"></style>
