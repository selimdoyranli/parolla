<template lang="pug">
.scene.game-scene.creator-mode-game-scene(ref="rootRef" tabindex="1" :class="[gameSceneClasses]")
  // Scene Inner
  .scene__inner.game-scene__inner
    // Alphabet
    .alphabet.value.swiper.alphabet-carousel(v-if="!party")
      .alphabet__inner.swiper-wrapper
        .swiper-slide(v-for="(item, index) in alphabet.items")
          .alphabet__item(:class="[alphabetItemClasses(item, index)]") {{ alphabetItemLetter(item, index) }}

    //- party: round progress, answered count and a per-round ring instead of the game clock
    .countdown.game-scene__countdown.countdown--party(v-if="party")
      span.countdown__progress {{ partyRound.index + 1 }}/{{ partyRound.total }}
      span.countdown__answered
        AppIcon(name="tabler:users" :width="14" :height="14")
        | {{ $t('party.game.answered', partyAnswered) }}
      span.countdown__ring
        svg(viewBox="0 0 36 36" aria-hidden="true")
          circle.countdown__ring-track(cx="18" cy="18" r="16")
          circle.countdown__ring-fill(cx="18" cy="18" r="16" pathLength="100" :stroke-dashoffset="100 - partyRemainFraction * 100")
        strong.countdown__ring-text {{ partyRemainSec }}

    // Countdown
    .countdown.game-scene__countdown(v-else :class="{ 'd-none': !questions }")
      // Compact mode replaces the hidden alphabet with a progress chip
      span.countdown__progress {{ alphabet.activeIndex + 1 }}/{{ alphabet.items.length }}
      AppIcon.countdown__icon(name="tabler:clock" color="var(--color-icon-01)")
      CountDown.countdown__timer(
        ref="countdownTimerRef"
        format="mm:ss"
        :auto-start="false"
        :time="countdown.time"
        @change="listenCountdown"
        @finish="handleCountdownFinish"
      )

    template
      //- presentation mode: players answer here, the question is on the presenter's screen
      .party-on-screen(v-if="isPartyAnswerOnly")
        AppIcon(name="tabler:presentation" color="var(--color-brand-02)" :width="40" :height="40")
        strong.party-on-screen__title {{ $t('party.game.onScreen') }}
        span.party-on-screen__sub {{ $t('party.game.onScreenSub') }}

      // Questions
      .questions(v-else :class="{ 'questions--hidden': isQuestionHidden }")
        StartCountdown(:value="startCountdown")
        .question(v-for="(question, index) in questions" v-show="index === alphabet.activeIndex" :class="questionClasses(index)")
          strong.question__title(v-if="question.question?.length > 0 && question.questionType !== questionTypeEnum.MEDIA") {{ question.question }}

          .question-media.do-not-hide-keyboard(v-if="question.media")
            .question-media-image.do-not-hide-keyboard
              img.question-media-image__img.do-not-hide-keyboard(:src="question.media.url" :alt="question.media.name")

            span.question-media__note.do-not-hide-keyboard(v-if="question.mediaNote?.length > 0") {{ question.mediaNote }}

      // Field Section
      section.game-scene__fieldSection.game-scene__fieldSection--withStats(
        v-if="!isPartyPresenter"
        :class="{ 'game-scene__fieldSection--disabled': !isGameStarted }"
      )
        // Answer Field
        .answer-field(v-if="getActiveQuestionAnswerType() === answerTypeEnum.TEXT_FIELD")
          input.answer-field__input(
            type="text"
            :value="isPartyLocked ? partyMyAnswer : answer.field"
            :placeholder="answerFieldPlaceholder || $t('gameScene.answerField.placeholder')"
            tabindex="-1"
            spellcheck="false"
            autocomplete="off"
            :maxlength="ANSWER_CHAR_LENGTH"
            :disabled="isPartyLocked"
            @input="handleAnswerField"
            @focus="answer.isFocused = true"
            @blur="answer.isFocused = false"
            @keypress.enter="handleAnswer"
            @keydown.tab.prevent="pass"
          )
          //- party: no pass, the send button is always there; it turns into a check once the answer is in
          Button.answer-field__button.answer-field__button--send.do-not-hide-keyboard.do-not-hide-keyboard--send(
            v-if="party"
            :color="isPartyLocked ? 'var(--color-success-01)' : 'var(--color-brand-02)'"
            :icon="isPartyLocked ? 'success' : 'guide-o'"
            :disabled="isPartyLocked"
            @click="handleAnswer"
          ) {{ $t('gameScene.answerField.submit') }}

          // Optional action buttons
          template(v-else-if="answer.field.length > 0")
            Button.answer-field__button.answer-field__button--send.do-not-hide-keyboard.do-not-hide-keyboard--send(
              color="var(--color-brand-02)"
              icon="guide-o"
              @click="handleAnswer"
            ) {{ $t('gameScene.answerField.submit') }}

          template(v-else)
            Button.answer-field__button.answer-field__button--pass.do-not-hide-keyboard.do-not-hide-keyboard--pass(
              color="var(--color-warning-01)"
              icon="arrow"
              @click.stop="pass"
            ) {{ $t('gameScene.answerField.pass') }}

        //- trivia options stay out of sight until the countdown is over, like the question
        .answer-field(
          v-if="getActiveQuestionAnswerType() === answerTypeEnum.TRIVIA"
          :class="{ 'answer-field--pending': isQuestionHidden, 'answer-field--locked': isPartyLocked }"
        )
          Button.answer-field__button.answer-field__button--pass.do-not-hide-keyboard.do-not-hide-keyboard--pass(
            v-if="!party"
            color="var(--color-warning-01)"
            icon="arrow"
            @click.stop="pass"
          ) {{ $t('gameScene.answerField.pass') }}
          TriviaOptionList(
            :options="getActiveQuestion().triviaOptions"
            :selected="partyMyAnswer"
            @on-option-select="handleTriviaOptionSelect"
          )

        //- party: the stats row's slot carries the round state instead (same height, so nothing jumps)
        .game-scene__fieldSection-stats.game-scene__fieldSection-stats--party(v-if="party")
          span.game-scene__fieldSection-stats__item.game-scene__fieldSection-stats__item--correct(v-if="isPartyLocked")
            AppIcon(name="tabler:check" color="var(--color-success-01)" :width="14" :height="14")
            span {{ $t('party.game.sent') }}
          span.game-scene__fieldSection-stats__item(v-else)
            AppIcon(name="tabler:users" :width="14" :height="14")
            span {{ $t('party.game.answered', partyAnswered) }}

        // Stats
        .game-scene__fieldSection-stats(v-else)
          span.game-scene__fieldSection-stats__item.game-scene__fieldSection-stats__item--correct
            AppIcon(name="tabler:check" color="var(--color-success-01)" :width="14" :height="14")
            strong {{ alphabet.items.filter(i => i.isCorrect).length }}
            span {{ $t('gameScene.correct') }}
          span.game-scene__fieldSection-stats__item.game-scene__fieldSection-stats__item--wrong
            AppIcon(name="tabler:x" color="var(--color-danger-01)" :width="14" :height="14")
            strong {{ alphabet.items.filter(i => i.isWrong).length }}
            span {{ $t('gameScene.wrong') }}
          span.game-scene__fieldSection-stats__item.game-scene__fieldSection-stats__item--passed
            AppIcon(name="tabler:player-skip-forward" color="var(--color-warning-01)" :width="14" :height="14")
            strong {{ alphabet.items.filter(i => i.isPassed).length }}
            span {{ $t('gameScene.pass') }}

  transition(name="quiz-intro-splash-fade")
    QuizIntroSplash(v-if="isIntroSplashVisible && room" :room="room" :playing="isIntroSplash")

  // How To Play Dialog
  PlayIntroDialog(v-if="!isGameOver && !party" mode="creator" :isOpen="dialog.howToPlay.isOpen" @closed="startGame")
  // Stats Dialog
  LazyCreatorModeStatsDialog(
    v-if="!party"
    :cancelButtonText="$t('general.close')"
    :confirmButtonText="$t('general.playAgain')"
    :isOpen="creatorDialog.stats.isOpen"
    @onCancel="$store.commit('creator/SET_IS_OPEN_STATS_DIALOG', false)"
    @onConfirm="resetGame"
  )
  // Interstital Ad Dialog
  InterstitialAdDialog(v-if="!party" :cancelButtonText="$t('gameScene.skipAdShowScore')" :isOpen="dialog.interstitialAd.isOpen")
</template>

<script>
import {
  defineComponent,
  useStore,
  useContext,
  ref,
  onMounted,
  onUnmounted,
  computed,
  watch,
  nextTick,
  inject
} from '@nuxtjs/composition-api'
import { ANSWER_CHAR_LENGTH } from '@/system/constant'
import { questionTypeEnum, answerTypeEnum } from '@/enums/quiz.enum'
import { Button, Field, Empty, CountDown } from 'vant'
import { wsTypeEnum } from '@/enums/wsType.enum'

export default defineComponent({
  components: {
    Button,
    Field,
    Empty,
    CountDown
  },
  props: {
    // party room round (pages/Party/_code feeds the creator store); everything party-only hangs off this
    party: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const store = useStore()
    const { $ua, i18n } = useContext()

    const rootRef = ref(null)

    const partySend = inject('partySend', null)
    const isPartyPresenter = computed(() => props.party && store.getters['party/isPresenter'])

    const {
      setRootRef,
      isGameStarted,
      startCountdown,
      isQuestionHidden,
      isIntroSplash,
      isIntroSplashVisible,
      isGameOver,
      alphabet,
      alphabetItemClasses,
      questions,
      answer,
      countdown,
      countdownTimerRef,
      handleAnswer,
      handleAnswerField,
      handleNotStartsWithActiveChar,
      resetAnswerField,
      handleTabKey,
      handleAnswerFieldAutoFocus,
      pass,
      initCarousels,
      dialog,
      startGame,
      listenCountdown,
      handleCountdownFinish,
      questionFitText,
      refitQuestionOnViewportResize,
      handleBeforeUnload,
      scrollTop,
      isTouchEnabled,
      handleDontHideKeyboard,
      checkUnsupportedHeight
    } = useGameScene(
      props.party
        ? {
            party: {
              // locked = the server already took this round's answer (it would ignore a second one anyway)
              submit: text => !isPartyLocked.value && partySend(wsTypeEnum.PARTY_ANSWER, { text }),
              // the presenter's screen is the big one everybody reads
              fitMax: () => (isPartyPresenter.value ? 72 : 30)
            }
          }
        : { inlineCountdown: true, introSplash: true }
    )

    const creatorDialog = computed(() => store.getters['creator/dialog'])

    const room = computed(() => store.getters['creator/room'])

    const resetGame = async () => {
      await store.commit('creator/SET_IS_GAME_OVER', {
        isGameOver: false
      })
      await store.commit('creator/RESET_COUNTDOWN_TIMER', room.value.gameTimeLimit)
      await store.commit('creator/RESET_ALPHABET')
      await store.commit('creator/SET_IS_OPEN_STATS_DIALOG', false)

      dialog.howToPlay.isOpen = true
    }

    watch(
      () => room.value,
      () => {
        if (!props.party) resetGame()
      }
    )

    // Party round state (store/party); the page has already put the question into the creator store
    const partyRound = computed(() => store.state.party.round || { index: 0, total: 0, durationMs: 1, remainingMs: 0 })
    // no progress frame until the first answer comes in: count who can answer from the room until then
    const partyAnswered = computed(() => {
      const { answered, total } = store.state.party.answered
      const presenterId = store.getters['party/game']?.presenterId

      return { answered, total: total || store.getters['party/players'].filter(p => p.connected && p.id !== presenterId).length }
    })
    const partyMyAnswer = computed(() => (props.party ? store.state.party.myAnswer : null))
    const isPartyLocked = computed(() => Boolean(partyMyAnswer.value))
    const isPartyAnswerOnly = computed(() => props.party && Boolean(store.getters['party/game']?.presenterId) && !isPartyPresenter.value)
    const partyNow = ref(Date.now())
    let partyTicker = null

    const partyRemainMs = computed(() => {
      const round = partyRound.value

      return Math.max(0, round.remainingMs - (partyNow.value - (round.receivedAt || partyNow.value)))
    })
    const partyRemainSec = computed(() => Math.ceil(partyRemainMs.value / 1000))
    const partyRemainFraction = computed(() => Math.min(1, partyRemainMs.value / (partyRound.value.durationMs || 1)))

    if (props.party) {
      // new round (or reconnect snapshot): fresh field, refit the new question
      watch(
        () => store.state.party.round,
        async () => {
          resetAnswerField()
          await nextTick()
          questionFitText()
        }
      )

      // the server only re-asks when the client check let a wrong letter through; same hint as solo
      watch(
        () => store.state.party.retry,
        retry => retry && handleNotStartsWithActiveChar({ activeChar: retry.letter })
      )

      // round over: drop the keyboard so the result card gets the screen
      watch(
        () => store.state.party.roundEnd,
        roundEnd => {
          if (!roundEnd) return

          document.activeElement?.blur()
          answer.isFocused = false
        }
      )
    }

    const getActiveQuestion = () => {
      return questions.value[alphabet.value.activeIndex]
    }

    const getActiveQuestionAnswerType = () => {
      return getActiveQuestion()?.answerType || answerTypeEnum.TEXT_FIELD
    }

    const alphabetItemLetter = (item, index) => {
      const question = questions.value[index]
      const isTrivia = question?.answerType === answerTypeEnum.TRIVIA
      const isAnswered = item.isCorrect || item.isWrong

      if (isTrivia && !isAnswered) {
        return '?'
      }

      return item.letter
    }

    const handleTriviaOptionSelect = option => {
      if (isPartyLocked.value) return

      handleAnswer(option.text)
    }

    const answerFieldPlaceholder = computed(() => {
      const activeIndex = alphabet.value.activeIndex
      const item = alphabet.value.items?.[activeIndex]

      if (!item) return null

      const letter = alphabetItemLetter(item, activeIndex)

      if (!letter || letter === '?') return null

      return `${letter}... (${i18n.t('gameScene.answerField.placeholder')})`
    })

    // named, so unmount can remove them (a party room mounts this scene once per game)
    const handleKeyup = event => {
      handleTabKey(event)
      handleAnswerFieldAutoFocus(event)
    }

    onMounted(() => {
      setRootRef(rootRef.value)

      if (props.party) {
        // no intro / 3-2-1: the round is already running on the server
        isGameStarted.value = true
        partyTicker = setInterval(() => (partyNow.value = Date.now()), 250)
        nextTick(questionFitText)
      } else {
        resetGame()
        initCarousels()
      }

      window.addEventListener('keyup', handleKeyup)

      window.addEventListener('resize', questionFitText)
      window.visualViewport?.addEventListener('resize', refitQuestionOnViewportResize)
      window.addEventListener('resize', fitMediaQuestion)
      window.visualViewport?.addEventListener('resize', fitMediaQuestion)
      window.addEventListener('beforeunload', handleBeforeUnload)

      window.addEventListener('scroll', scrollTop)

      if (isTouchEnabled) {
        rootRef.value?.addEventListener('touchend', event => handleDontHideKeyboard(event))
      }

      // Unsupported screen height
      checkUnsupportedHeight()

      // Watchers only fire on change; a quiz opening on a compact question needs a first fit
      fitMediaQuestion()
    })

    onUnmounted(() => {
      window.removeEventListener('resize', questionFitText)
      window.visualViewport?.removeEventListener('resize', refitQuestionOnViewportResize)
      window.removeEventListener('resize', fitMediaQuestion)
      window.visualViewport?.removeEventListener('resize', fitMediaQuestion)
      document.documentElement.classList.remove('creator-compact-header')
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('keyup', handleKeyup)
      clearInterval(partyTicker)

      // the party room goes back to its lobby with this scene gone; don't leave the keyboard class behind
      if (props.party) document.documentElement.classList.remove('osk')

      window.removeEventListener('scroll', scrollTop)

      if (isTouchEnabled) {
        rootRef.value?.removeEventListener('touchend', handleDontHideKeyboard)
      }
    })

    const isActiveQuestionMedia = computed(() => questions.value?.[alphabet.value.activeIndex]?.questionType === questionTypeEnum.MEDIA)

    // Media question + (keyboard open or trivia options) leaves little room; hide alphabet and fit image + note to what's left
    const isCompactMedia = computed(
      () => isActiveQuestionMedia.value && (answer.isFocused || getActiveQuestionAnswerType() === answerTypeEnum.TRIVIA)
    )

    // Sizes the active media question to the gap between its top and the fixed field section, so image + note always fit
    const fitMediaQuestion = () => {
      requestAnimationFrame(() => {
        const question = rootRef.value?.querySelector('.question--active')
        const fieldSection = rootRef.value?.querySelector('.game-scene__fieldSection')

        if (!question || !fieldSection) return

        // .game-scene gets `zoom` on short screens; rects are zoomed, the vars we set are not
        const zoom = parseFloat(getComputedStyle(rootRef.value).zoom) || 1
        const height = (fieldSection.getBoundingClientRect().top - question.getBoundingClientRect().top) / zoom - 8

        rootRef.value.style.setProperty('--media-question-height', `${Math.max(height, 0)}px`)

        // Center the countdown chip in the free header gap between the icon logo and the right nav
        const logo = document.querySelector('.app-header .app-logo--osk img')?.getBoundingClientRect()
        const nav = document.querySelector('.app-header menu:last-of-type')?.getBoundingClientRect()

        if (logo?.width && nav) {
          rootRef.value.style.setProperty('--compact-countdown-x', `${(logo.right + nav.left) / 2 / zoom}px`)
          rootRef.value.style.setProperty('--compact-countdown-y', `${(logo.top + logo.bottom) / 2 / zoom}px`)

          // Shrink the chip when the gap is narrower than it (avatar / review count widen the nav); 8px clearance per side
          const countdown = rootRef.value.querySelector('.game-scene__countdown')?.getBoundingClientRect()
          const scale = parseFloat(rootRef.value.style.getPropertyValue('--compact-countdown-scale')) || 1

          if (countdown?.width) {
            const fitScale = (nav.left - logo.right - 16) / (countdown.width / scale)

            rootRef.value.style.setProperty('--compact-countdown-scale', Math.min(1, fitScale))
          }
        }
      })
    }

    // Header swaps to the icon logo only in this scene (html.osk is set by every game mode); trivia never opens the keyboard
    const isCompactHeader = computed(
      () => isCompactMedia.value || (answer.isFocused && getActiveQuestionAnswerType() !== answerTypeEnum.TRIVIA)
    )

    watch(isCompactHeader, value => document.documentElement.classList.toggle('creator-compact-header', value), { immediate: true })

    watch(
      () => [alphabet.value.activeIndex, answer.isFocused, questions.value, isCompactMedia.value, isGameStarted.value],
      async () => {
        await nextTick()
        fitMediaQuestion()
      }
    )

    const gameSceneClasses = computed(() => {
      return {
        'game-scene--compactMedia': isCompactMedia.value,
        'game-scene--isMobileDevice': $ua.isFromMobilephone(),
        'game-scene--gameOver': isGameOver.value,
        'game-scene--osk': answer.isFocused && getActiveQuestionAnswerType() !== answerTypeEnum.TRIVIA,
        'game-scene--activeQuestionTypeMedia': questions.value[alphabet.value.activeIndex]?.questionType === questionTypeEnum.MEDIA,
        'game-scene--hasMedia': room.value.hasMedia,
        'game-scene--activeQuestionTypeText': questions.value[alphabet.value.activeIndex]?.questionType === questionTypeEnum.TEXT,
        'game-scene--activeAnswerTypeTextField': getActiveQuestionAnswerType?.() === answerTypeEnum.TEXT_FIELD,
        'game-scene--activeAnswerTypeTrivia': getActiveQuestionAnswerType?.() === answerTypeEnum.TRIVIA,
        'game-scene--party': props.party,
        'game-scene--partyPresenter': isPartyPresenter.value,
        'game-scene--partyAnswerOnly': isPartyAnswerOnly.value
      }
    })

    const questionClasses = index => {
      return {
        'question--active': index === alphabet.value.activeIndex,
        'question--osk': answer.isFocused && getActiveQuestionAnswerType() !== answerTypeEnum.TRIVIA
      }
    }

    return {
      questionTypeEnum,
      answerTypeEnum,
      rootRef,
      isPartyPresenter,
      isPartyAnswerOnly,
      isPartyLocked,
      partyRound,
      partyAnswered,
      partyMyAnswer,
      partyRemainSec,
      partyRemainFraction,
      ANSWER_CHAR_LENGTH,
      isGameStarted,
      startCountdown,
      isQuestionHidden,
      isIntroSplash,
      isIntroSplashVisible,
      room,
      isGameOver,
      alphabet,
      questions,
      answer,
      dialog,
      creatorDialog,
      countdown,
      countdownTimerRef,
      alphabetItemClasses,
      pass,
      handleAnswerField,
      handleAnswer,
      startGame,
      listenCountdown,
      handleCountdownFinish,
      isTouchEnabled,
      resetGame,
      getActiveQuestion,
      getActiveQuestionAnswerType,
      alphabetItemLetter,
      handleTriviaOptionSelect,
      answerFieldPlaceholder,
      gameSceneClasses,
      questionClasses
    }
  }
})
</script>

<style lang="scss" src="./CreatorModeGameScene.component.scss"></style>
