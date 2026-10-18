<template lang="pug">
.scene.game-scene.creator-mode-game-scene(ref="rootRef" tabindex="1" :class="[gameSceneClasses]")
  // Scene Inner
  .scene__inner.game-scene__inner
    // Alphabet
    .alphabet.value.swiper.alphabet-carousel
      .alphabet__inner.swiper-wrapper
        .swiper-slide(v-for="(item, index) in alphabet.items")
          .alphabet__item(:class="[alphabetItemClasses(item, index)]") {{ alphabetItemLetter(item, index) }}

    // Countdown
    .countdown.game-scene__countdown(:class="{ 'd-none': !questions }")
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
      // Questions
      .questions(:class="{ 'questions--hidden': isQuestionHidden }")
        StartCountdown(:value="startCountdown")
        .question(v-for="(question, index) in questions" v-show="index === alphabet.activeIndex" :class="questionClasses(index)")
          strong.question__title(v-if="question.question?.length > 0 && question.questionType !== questionTypeEnum.MEDIA") {{ question.question }}

          .question-media.do-not-hide-keyboard(v-if="question.media")
            .question-media-image.do-not-hide-keyboard
              img.question-media-image__img.do-not-hide-keyboard(:src="question.media.url" :alt="question.media.name")

            span.question-media__note.do-not-hide-keyboard(v-if="question.mediaNote?.length > 0") {{ question.mediaNote }}

      // Field Section
      section.game-scene__fieldSection.game-scene__fieldSection--withStats(
        :class="{ 'game-scene__fieldSection--disabled': !isGameStarted }"
      )
        // Answer Field
        .answer-field(v-if="getActiveQuestionAnswerType() === answerTypeEnum.TEXT_FIELD")
          input.answer-field__input(
            type="text"
            :value="answer.field"
            :placeholder="answerFieldPlaceholder || $t('gameScene.answerField.placeholder')"
            tabindex="-1"
            spellcheck="false"
            autocomplete="off"
            :maxlength="ANSWER_CHAR_LENGTH"
            @input="handleAnswerField"
            @focus="answer.isFocused = true"
            @blur="answer.isFocused = false"
            @keypress.enter="handleAnswer"
            @keydown.tab.prevent="pass"
          )
          // Optional action buttons
          template(v-if="answer.field.length > 0")
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

        .answer-field(v-if="getActiveQuestionAnswerType() === answerTypeEnum.TRIVIA")
          Button.answer-field__button.answer-field__button--pass.do-not-hide-keyboard.do-not-hide-keyboard--pass(
            color="var(--color-warning-01)"
            icon="arrow"
            @click.stop="pass"
          ) {{ $t('gameScene.answerField.pass') }}
          TriviaOptionList(:options="getActiveQuestion().triviaOptions" @on-option-select="handleTriviaOptionSelect")

        // Stats
        .game-scene__fieldSection-stats
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

  // How To Play Dialog
  PlayIntroDialog(v-if="!isGameOver" mode="creator" :isOpen="dialog.howToPlay.isOpen" @closed="startGame")
  // Stats Dialog
  LazyCreatorModeStatsDialog(
    :cancelButtonText="$t('general.close')"
    :confirmButtonText="$t('general.playAgain')"
    :isOpen="creatorDialog.stats.isOpen"
    @onCancel="$store.commit('creator/SET_IS_OPEN_STATS_DIALOG', false)"
    @onConfirm="resetGame"
  )
  // Interstital Ad Dialog
  InterstitialAdDialog(:cancelButtonText="$t('gameScene.skipAdShowScore')" :isOpen="dialog.interstitialAd.isOpen")
</template>

<script>
import { defineComponent, useStore, useContext, ref, onMounted, onUnmounted, computed, watch, nextTick } from '@nuxtjs/composition-api'
import { ANSWER_CHAR_LENGTH } from '@/system/constant'
import { questionTypeEnum, answerTypeEnum } from '@/enums/quiz.enum'
import { Button, Field, Empty, CountDown } from 'vant'

export default defineComponent({
  components: {
    Button,
    Field,
    Empty,
    CountDown
  },
  setup() {
    const store = useStore()
    const { $ua, i18n } = useContext()

    const rootRef = ref(null)

    const {
      setRootRef,
      isGameStarted,
      startCountdown,
      isQuestionHidden,
      isGameOver,
      alphabet,
      alphabetItemClasses,
      questions,
      answer,
      countdown,
      countdownTimerRef,
      handleAnswer,
      handleAnswerField,
      handleTabKey,
      handleAnswerFieldAutoFocus,
      pass,
      initCarousels,
      dialog,
      startGame,
      listenCountdown,
      handleCountdownFinish,
      questionFitText,
      handleBeforeUnload,
      scrollTop,
      isTouchEnabled,
      handleDontHideKeyboard,
      checkUnsupportedHeight
    } = useGameScene({ inlineCountdown: true })

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
        resetGame()
      }
    )

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

    onMounted(() => {
      setRootRef(rootRef.value)
      resetGame()

      initCarousels()

      window.addEventListener('keyup', event => handleTabKey(event))
      window.addEventListener('keyup', event => handleAnswerFieldAutoFocus(event))

      window.addEventListener('resize', questionFitText)
      window.addEventListener('resize', fitMediaQuestion)
      window.visualViewport?.addEventListener('resize', fitMediaQuestion)
      window.addEventListener('beforeunload', event => handleBeforeUnload(event))

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
      window.removeEventListener('resize', fitMediaQuestion)
      window.visualViewport?.removeEventListener('resize', fitMediaQuestion)
      document.documentElement.classList.remove('creator-compact-header')
      window.removeEventListener('beforeunload', handleBeforeUnload)

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
        'game-scene--activeAnswerTypeTrivia': getActiveQuestionAnswerType?.() === answerTypeEnum.TRIVIA
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
      ANSWER_CHAR_LENGTH,
      isGameStarted,
      startCountdown,
      isQuestionHidden,
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
