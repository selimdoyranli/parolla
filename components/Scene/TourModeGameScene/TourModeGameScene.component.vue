<template lang="pug">
.scene.game-scene.tour-mode-game-scene(
  ref="rootRef"
  tabindex="1"
  :class="{ 'game-scene--isMobileDevice': $ua.isFromMobilephone(), 'game-scene--osk': $ua.isFromIos() }"
)
  // Scene Inner
  .scene__inner.game-scene__inner
    // Countdown
    .tour-mode-game-scene-countdown
      Progress(color="var(--color-brand-02)" :pivot-text="String(tour.countdown.seconds)" :percentage="tour.countdown.percentage")

    template(v-if="tour.question")
      // Letter
      .letter
        .letter__value {{ tour.question.letter }}

      // Questions
      .questions
        .question.question--active(:class="{ 'question--osk': answer.isFocused }")
          strong.question__title {{ tour.question.question }}

      // Field Section
      section.game-scene__fieldSection(auth-control :class="{ 'game-scene__fieldSection--disabled': tour.isPlayerFinishedTheTour }")
        // Answer Field
        .answer-field
          Popover.answer-field-max-lives(
            v-model="tour.popover.maxLives.isOpen"
            placement="top-start"
            trigger="click"
            close-on-click-outside
          )
            template(#reference)
              .answer-field-max-lives__button(role="button")
                AppIcon(name="fluent-emoji:heart-suit" :label="String(tour.maxLives)" :width="32" :height="32")

            .answer-field-max-lives__content
              p {{ $t('tourMode.guessingChance.title') }}
          input.answer-field__input(
            type="text"
            :value="answer.field"
            :placeholder="$t('gameScene.answerField.placeholder')"
            tabindex="-1"
            spellcheck="false"
            autocomplete="off"
            :readonly="!$auth.loggedIn"
            :maxlength="ANSWER_CHAR_LENGTH"
            :disabled="tour.isPlayerFinishedTheTour"
            @input="handleAnswerField"
            @focus="answer.isFocused = true"
            @blur="answer.isFocused = false"
            @keypress.enter="handleAnswer"
          )
          Button.answer-field__button.answer-field__button--send.do-not-hide-keyboard.do-not-hide-keyboard--send(
            color="var(--color-brand-02)"
            icon="guide-o"
            :inert="answer.field.length <= 0"
            :disabled="answer.field.length <= 0"
            @click="handleAnswer"
          ) {{ $t('gameScene.answerField.submit') }}

  // Tour Results View
  transition(name="slide-fade")
    TourModeResultsView(v-if="tour.isTimeUp" :tour="tour")

  // Interstital Ad Dialog
  InterstitialAdDialog(:cancelButtonText="$t('gameScene.skipAdShowScore')" :isOpen="dialog.interstitialAd.isOpen")

  // Tour Mode Online Dialog
  LazyTourModeOnlineDialog(:isOpen="isTourModeOnlineDialogOpen" :tour="tour" @closed="closeTourModeOnlineDialog")

  // Chat Panel
  ChatPanel(:title="`${$t('chat.chat')} (${userList.totalPlayers})`")
    template(#content-prepend)
      .section-title {{ $t('tourMode.lastAnswers.title') }}
      .last-answers
        PlayerList(:items="tour.recentAnswers")
          template(#empty)
            Empty(:description="$t('tourMode.lastAnswers.empty.description')")
      .section-title {{ $t('chat.chat') }}
</template>

<script>
import { defineComponent, useContext, useStore, ref, onMounted, onUnmounted, computed, nextTick, watch } from '@nuxtjs/composition-api'
import { ANSWER_CHAR_LENGTH } from '@/system/constant'
import { wsTypeEnum } from '@/enums'
import { Button, Field, Empty, CountDown, Progress, Popover, Notify, Toast } from 'vant'

export default defineComponent({
  components: {
    Button,
    Field,
    Empty,
    CountDown,
    Progress,
    Popover,
    Notify,
    Toast
  },
  setup() {
    const rootRef = ref(null)

    const context = useContext()
    const store = useStore()

    const userList = computed(() => store.getters['tour/userList'])

    const {
      setRootRef,
      answer,
      dialog,
      handleBeforeUnload,
      scrollTop,
      isTouchEnabled,
      handleDontHideKeyboard,
      handleTabKey,
      checkUnsupportedHeight,
      formatAnswer,
      handleNotStartsWithActiveChar,
      wrongAnimateAnswerField,
      focusToAnswerFieldInput,
      resetAnswerField,
      soundFx,
      questionFitText
    } = useGameScene()

    const ws = store.getters['app/ws']

    const tour = computed(() => store.getters['tour/tour'])

    watch(
      () => tour.value.question,
      newQuestion => {
        if (newQuestion) {
          nextTick(() => {
            questionFitText({ originalContent: newQuestion.question })
          })
        }
      },
      { deep: true }
    )

    const handleKeyUp = event => {
      const activeElement = document.activeElement
      const isInputFocused =
        activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)

      if (!isInputFocused) {
        const pressedKey = event.key

        // Only process single character keys (excluding special keys)
        if (pressedKey && pressedKey.length === 1) {
          focusToAnswerFieldInput()
          // After focusing, add the pressed character to the input
          answer.field = pressedKey + answer.field
        } else {
          // Only focus for special keys
          focusToAnswerFieldInput()
        }
      }
    }

    const onQuestionGot = ({ question }) => {
      store.commit('tour/SET_TOUR', {
        question: {
          letter: question.letter,
          question: question.question
        }
      })

      setTimeout(() => {
        focusToAnswerFieldInput()
      }, 0)
    }

    const onTimeUpdate = ({ time }) => {
      const remainingTimeAsSeconds = Math.floor(time.remaining / 1000)

      store.commit('tour/SET_TOUR', {
        countdown: {
          seconds: remainingTimeAsSeconds,
          percentage: time.percentage + 4
        }
      })

      if (remainingTimeAsSeconds === 5) {
        soundFx.hurryUp.play()

        setTimeout(() => {
          soundFx.hurryUp.stop()
        }, 6000)
      }
    }

    const onTimeUp = ({ correctAnswer }) => {
      soundFx.countdownFinish.play()

      store.commit('tour/SET_TOUR', {
        isTimeUp: true,
        correctAnswer
      })

      // Focus out of all focused inputs and close the mobile keyboard
      document.activeElement.blur()

      resetAnswerField()

      Toast.clear()
    }

    const onWaitingNext = ({ time, correctAnswer, roundScore }) => {
      store.commit('tour/SET_TOUR', {
        isTimeUp: true,
        waitingNextSeconds: Math.floor(time.remaining / 1000),
        correctAnswer: tour.value.correctAnswer || correctAnswer,
        roundScores: tour.value.roundScores?.length > 0 ? tour.value.roundScores : roundScore ? mapRoundScores({ scores: roundScore }) : []
      })

      if (time.remaining <= 1000) {
        if (tour.value.isTimeUp) {
          setTimeout(() => {
            store.commit('tour/CLEAR_FOR_NEW_ROUND')

            soundFx.start.play()
          }, 1000)
        }
      }
    }

    const showCorrectToast = () => {
      Toast({
        type: 'html',
        className: 'toast-correct',
        forbidClick: false,
        overlay: false,
        transition: 'answer-result',
        closeOnClickOverlay: false,
        position: 'bottom',
        message: context.i18n.t('tourMode.correctAnswer.description'),
        duration: 0
      })
    }

    const showPlayerFinishedTheTourToast = () => {
      Toast({
        type: 'html',
        className: 'toast-wrong',
        forbidClick: false,
        overlay: false,
        transition: 'answer-result',
        closeOnClickOverlay: false,
        position: 'bottom',
        message: context.i18n.t('tourMode.playerFinishedTheTour.description'),
        duration: 0
      })
    }

    const onAnswerResult = params => {
      const { correct, lives, score } = params

      if (correct) {
        store.commit('tour/SET_TOUR', {
          isPlayerFinishedTheTour: true
        })

        showCorrectToast()

        soundFx.correct.play()
      } else {
        wrongAnimateAnswerField()

        Notify({
          message: context.i18n.t('tourMode.wrongAnswer.description'),
          color: 'var(--color-text-04)',
          background: 'var(--color-danger-01)',
          duration: 1500
        })

        soundFx.wrong.play()
      }

      store.commit('tour/SET_TOUR', {
        maxLives: lives
      })

      if (lives <= 0) {
        store.commit('tour/SET_TOUR', {
          isPlayerFinishedTheTour: true
        })

        showPlayerFinishedTheTourToast()
      }
    }

    const handleAnswer = () => {
      const answerField = formatAnswer(answer.field)

      resetAnswerField()

      if (!answerField.startsWith(formatAnswer(tour.value.question.letter))) {
        handleNotStartsWithActiveChar({ activeChar: tour.value.question.letter })

        return false
      }

      ws.send(JSON.stringify({ type: wsTypeEnum.TOUR_ANSWER, answer: answerField }))
    }

    const handleAnswerField = $event => {
      answer.field = $event.target.value
    }

    const onRecentAnswers = ({ answers }) => {
      const mappedAnswers = answers.map(answer => ({
        id: answer.playerId,
        username: answer.playerName,
        diceBear: answer.diceBear,
        isCorrect: answer.isCorrect
      }))

      store.commit('tour/SET_TOUR', {
        recentAnswers: mappedAnswers
      })
    }

    const formatTimestamp = ms => {
      if (ms === null || ms === undefined) return '00:00:000'

      const minutes = Math.floor(ms / 60000)
      const seconds = Math.floor((ms % 60000) / 1000)
      const milliseconds = ms % 1000

      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(3, '0')}`
    }

    const mapRoundScores = ({ scores }) => {
      const mappedScores = scores.map(scorer => ({
        id: scorer.playerId,
        username: scorer.playerName,
        diceBear: scorer.diceBear,
        score: `+${scorer.baseScore}`,
        time: formatTimestamp(scorer.responseTime),
        attemptCount: scorer.attemptCount,
        rank: scorer.rank
      }))

      return mappedScores
    }

    const onRoundScores = ({ scores }) => {
      store.commit('tour/SET_TOUR', {
        roundScores: mapRoundScores({ scores })
      })
    }

    const handleWsEvent = event => {
      const { type, data } = event.detail

      if (type === wsTypeEnum.TOUR_QUESTION) {
        onQuestionGot(data)
      }

      if (type === wsTypeEnum.TOUR_TIME_UPDATE) {
        onTimeUpdate(data)
      }

      if (type === wsTypeEnum.TOUR_TIME_UP) {
        onTimeUp(data)
      }

      if (type === wsTypeEnum.TOUR_WAITING_NEXT) {
        onWaitingNext(data)
      }

      if (type === wsTypeEnum.TOUR_ANSWER_RESULT) {
        onAnswerResult(data)
      }

      if (type === wsTypeEnum.TOUR_RECENT_ANSWERS) {
        onRecentAnswers(data)
      }

      if (type === wsTypeEnum.TOUR_ROUND_SCORES) {
        onRoundScores(data)
      }
    }

    onMounted(() => {
      window.addEventListener('ws-event', handleWsEvent)

      setRootRef(rootRef.value)

      window.addEventListener('keyup', handleKeyUp)
      window.addEventListener('resize', questionFitText)
      window.addEventListener('beforeunload', event => handleBeforeUnload(event))
      window.addEventListener('scroll', scrollTop)

      if (isTouchEnabled) {
        const tourModeHandlers = {
          handleSend: handleAnswer
        }
        rootRef.value?.addEventListener('touchend', event => handleDontHideKeyboard(event, tourModeHandlers))
      }

      // Unsupported screen height
      checkUnsupportedHeight()
    })

    onUnmounted(() => {
      store.commit('tour/CLEAR_FOR_NEW_ROUND')

      window.removeEventListener('ws-event', handleWsEvent)

      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('resize', questionFitText)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('scroll', scrollTop)

      if (isTouchEnabled) {
        const tourModeHandlers = {
          handleSend: handleAnswer
        }
        rootRef.value?.removeEventListener('touchend', event => handleDontHideKeyboard(event, tourModeHandlers))
      }

      Toast.clear()
    })

    const isTourModeOnlineDialogOpen = computed(() => store.getters['tour/dialog'].tourModeOnline.isOpen)

    const closeTourModeOnlineDialog = () => {
      store.commit('tour/SET_IS_OPEN_TOUR_MODE_ONLINE_DIALOG', false)
    }

    return {
      rootRef,
      ANSWER_CHAR_LENGTH,
      answer,
      dialog,
      handleAnswerField,
      handleAnswer,
      handleTabKey,
      isTouchEnabled,
      isTourModeOnlineDialogOpen,
      closeTourModeOnlineDialog,
      tour,
      userList
    }
  }
})
</script>

<style lang="scss" src="./TourModeGameScene.component.scss"></style>
