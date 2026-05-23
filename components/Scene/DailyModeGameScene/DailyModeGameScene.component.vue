<template lang="pug">
.scene.game-scene.daily-mode-game-scene(
  ref="rootRef"
  tabindex="1"
  :class="{ 'game-scene--isMobileDevice': $ua.isFromMobilephone(), 'game-scene--gameOver': isGameOver, 'game-scene--osk': answer.isFocused }"
)
  // Scene Inner
  .scene__inner.game-scene__inner
    // Alphabet
    .alphabet.value.swiper.alphabet-carousel
      .alphabet__inner.swiper-wrapper
        .swiper-slide(v-for="(item, index) in alphabet.items")
          .alphabet__item(:class="[alphabetItemClasses(item, index)]") {{ item.letter }}

    // Countdown
    .countdown.game-scene__countdown(:class="{ 'd-none': fetchState.pending || fetchState.error }")
      AppIcon.countdown__icon(name="tabler:clock" color="var(--color-icon-01)")
      CountDown.countdown__timer(
        ref="countdownTimerRef"
        format="mm:ss"
        :auto-start="false"
        :time="countdown.time"
        @change="listenCountdown"
        @finish="handleCountdownFinish"
      )

    // Fetch State
    template(v-if="fetchState.pending")
      Empty(:description="$t('gameScene.pendingQuestions')")

    template(v-else-if="fetchState.error")
      Empty(image="error" :description="$t('gameScene.error.fetchQuestions.description')")
        Button(@click="reFetch") {{ $t('gameScene.error.fetchQuestions.action') }}

    template(v-else)
      // Questions
      .questions
        .question(
          v-for="(question, index) in questions"
          v-show="index === alphabet.activeIndex"
          :class="{ 'question--active': index === alphabet.activeIndex, 'question--osk': answer.isFocused }"
        )
          strong.question__title {{ question.question }}

      // Field Section
      section.game-scene__fieldSection.game-scene__fieldSection--withStats(
        :class="{ 'game-scene__fieldSection--disabled': !isGameStarted }"
      )
        // Answer Field
        .answer-field
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
  HowToPlayDialog(v-if="!isGameOver" :isOpen="dialog.howToPlay.isOpen" @closed="startGame")
  // Stats Dialog
  DailyModeStatsDialog(
    :cancelButtonText="$t('general.close')"
    :isOpen="dailyDialog.stats.isOpen"
    @onCancel="$store.commit('daily/SET_IS_OPEN_STATS_DIALOG', false)"
  )
  // Interstital Ad Dialog
  InterstitialAdDialog(:cancelButtonText="$t('gameScene.skipAdShowScore')" :isOpen="dialog.interstitialAd.isOpen")
</template>

<script>
import { defineComponent, useStore, useFetch, ref, onMounted, onUnmounted, computed, useContext } from '@nuxtjs/composition-api'
import { ANSWER_CHAR_LENGTH } from '@/system/constant'
import { Button, Field, Empty, CountDown } from 'vant'

export default defineComponent({
  components: {
    Button,
    Field,
    Empty,
    CountDown
  },
  setup() {
    const rootRef = ref(null)
    const { i18n } = useContext()

    const store = useStore()
    const persistStore = JSON.parse(window.localStorage.getItem('persistStore'))

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
      endGame,
      listenCountdown,
      handleCountdownFinish,
      questionFitText,
      handleBeforeUnload,
      scrollTop,
      isTouchEnabled,
      handleDontHideKeyboard,
      checkUnsupportedHeight
    } = useGameScene()

    const dailyDialog = computed(() => store.getters['daily/dialog'])

    const answerFieldPlaceholder = computed(() => {
      const item = alphabet.value.items?.[alphabet.value.activeIndex]
      const letter = item?.letter

      if (!letter || letter === '?') return null

      return `${letter}... (${i18n.t('gameScene.answerField.placeholder')})`
    })

    const day = new Date().toLocaleDateString('tr').slice(0, 10)
    const storedDay = persistStore && persistStore.daily.currentDate

    if (process.browser) {
      if (day !== storedDay) {
        store.commit('daily/SET_IS_GAME_OVER', {
          isGameOver: false
        })
        store.commit('daily/SET_CURRENT_DATE', day)
        store.dispatch('daily/fetchQuestions')
      }
    }

    // Fetch Questions
    const { fetch, fetchState } = useFetch(async () => {
      await store.dispatch('daily/fetchQuestions')
    })

    const reFetch = async () => {
      await fetch()

      if (questions.value.length > 0) {
        startGame()
      }
    }

    onMounted(() => {
      setRootRef(rootRef.value)

      initCarousels()

      // Check game over
      if (isGameOver.value) {
        endGame()
        store.commit('daily/SET_IS_OPEN_STATS_DIALOG', true)
      }

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

    return {
      rootRef,
      ANSWER_CHAR_LENGTH,
      fetch,
      fetchState,
      reFetch,
      isGameStarted,
      isGameOver,
      alphabet,
      questions,
      answer,
      dialog,
      dailyDialog,
      answerFieldPlaceholder,
      countdown,
      countdownTimerRef,
      alphabetItemClasses,
      pass,
      handleAnswerField,
      handleAnswer,
      startGame,
      listenCountdown,
      handleCountdownFinish,
      isTouchEnabled
    }
  }
})
</script>

<style lang="scss" src="./DailyModeGameScene.component.scss"></style>
