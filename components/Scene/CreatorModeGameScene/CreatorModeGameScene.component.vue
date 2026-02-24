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
      .questions
        .question(v-for="(question, index) in questions" v-show="index === alphabet.activeIndex" :class="questionClasses(index)")
          strong.question__title(v-if="question.question?.length > 0 && question.questionType !== questionTypeEnum.MEDIA") {{ question.question }}

          .question-media.do-not-hide-keyboard(v-if="question.media")
            .question-media-image.do-not-hide-keyboard
              img.question-media-image__img.do-not-hide-keyboard(:src="question.media.url" :alt="question.media.name")

            span.question-media__note.do-not-hide-keyboard(v-if="question.mediaNote?.length > 0") {{ question.mediaNote }}

      // Field Section
      section.game-scene__fieldSection(:class="{ 'game-scene__fieldSection--disabled': !isGameStarted }")
        // Answer Field
        .answer-field(v-if="getActiveQuestionAnswerType() === answerTypeEnum.TEXT_FIELD")
          input.answer-field__input(
            type="text"
            :value="answer.field"
            :placeholder="$t('gameScene.answerField.placeholder')"
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
              @click="pass"
            ) {{ $t('gameScene.answerField.pass') }}

        .answer-field(v-if="getActiveQuestionAnswerType() === answerTypeEnum.TRIVIA")
          Button.answer-field__button.answer-field__button--pass.do-not-hide-keyboard.do-not-hide-keyboard--pass(
            color="var(--color-warning-01)"
            icon="arrow"
            @click="pass"
          ) {{ $t('gameScene.answerField.pass') }}
          TriviaOptionList(:options="getActiveQuestion().triviaOptions" @on-option-select="handleTriviaOptionSelect")

  // How To Play Dialog
  HowToPlayDialog(v-if="!isGameOver" :isOpen="dialog.howToPlay.isOpen" @closed="startGame")
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
import { defineComponent, useStore, useContext, ref, onMounted, onUnmounted, computed, watch } from '@nuxtjs/composition-api'
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
    const { $ua } = useContext()

    const rootRef = ref(null)

    const {
      setRootRef,
      isGameStarted,
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
    } = useGameScene()

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

    onMounted(() => {
      setRootRef(rootRef.value)
      resetGame()

      initCarousels()

      window.addEventListener('keyup', event => handleTabKey(event))

      window.addEventListener('resize', questionFitText)
      window.addEventListener('beforeunload', event => handleBeforeUnload(event))

      window.addEventListener('scroll', scrollTop)

      if (isTouchEnabled) {
        rootRef.value?.addEventListener('touchend', event => handleDontHideKeyboard(event))
      }

      // Unsupported screen height
      checkUnsupportedHeight()
    })

    onUnmounted(() => {
      window.removeEventListener('resize', questionFitText)
      window.removeEventListener('beforeunload', handleBeforeUnload)

      window.removeEventListener('scroll', scrollTop)

      if (isTouchEnabled) {
        rootRef.value?.removeEventListener('touchend', handleDontHideKeyboard)
      }
    })

    const gameSceneClasses = computed(() => {
      return {
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
      gameSceneClasses,
      questionClasses
    }
  }
})
</script>

<style lang="scss" src="./CreatorModeGameScene.component.scss"></style>
