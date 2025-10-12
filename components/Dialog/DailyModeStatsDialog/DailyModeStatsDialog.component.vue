<template lang="pug">
Dialog.dialog.stats-dialog.daily-mode-stats-dialog(
  v-model="state.isOpen"
  :title="$t('general.dailyStats')"
  :cancel-button-text="cancelButtonText || $t('general.close')"
  :confirm-button-text="confirmButtonText || $t('general.ok')"
  :show-cancel-button="true"
  :show-confirm-button="false"
  :close-on-click-overlay="false"
  @closed="$emit('closed')"
  @cancel="$emit('onCancel')"
  @confirm="$emit('onConfirm')"
)
  template(v-if="isGameOver")
    // Tabs
    Tabs.stats-dialog__tabs(v-model="activeTab")
      // Score Tab
      Tab(name="score" :title="$t('gameScene.scoreStats')")
        br
        // Scoreboard
        .scoreboard
          .score
            span.score__icon 🟩
            span.score__count {{ correctAnswers.length }}
            span.score__title {{ $t('gameScene.correct') }}

          .score
            span.score__icon 🟥
            span.score__count {{ wrongAnswers.length }}
            span.score__title {{ $t('gameScene.wrong') }}

          .score
            span.score__icon 🟨
            span.score__count {{ passedAnswers.length }}
            span.score__title {{ $t('gameScene.pass') }}

          p {{ $t('gameScene.remainTime') }}: <strong>{{ remainTime }}</strong>

        // Actions
        .stats-dialog__actions
          // Next Game Countdown
          .countdown.stats-dialog__countdown
            span.countdown__title {{ $t('dialog.stats.daily.nextGame') }}
            AppIcon.countdown__icon(name="tabler:clock" color="var(--color-icon-01)")
            CountDown.countdown__timer(ref="countdownTimerRef" format="HH:mm:ss" :auto-start="true" :time="nextGameDateMs")

          // Result Sharer
          .result-sharer
            Button.result-sharer__button(color="var(--color-success-01)" icon="share-o" icon-position="right" round @click="shareResults") PAYLAŞ

      Tab(name="answers" :title="$t('gameScene.answerKey')")
        // Answers
        .answers
          Collapse.answers__inner(v-model="toggledAnswer" accordion)
            // Answer
            CollapseItem.answer(
              v-for="question in questions"
              :key="question.letter.name"
              :value="question.letter.name"
              :class="[answerClasses(question)]"
              :name="question.letter.name"
              :title="question.answer"
            )
              p.answer__question
                strong {{ $t('general.question') }}:
                span &nbsp;{{ question.question }}
              p.answer__correctAnswer
                strong {{ $t('gameScene.correctAnswer') }}:
                span &nbsp;{{ question.answer.toLocaleUpperCase('tr') }}
              p.answer__myAnswer
                strong {{ $t('gameScene.yourAnswer') }}:
                span(v-if="myAnswer(question) && myAnswer(question).field.length > 0") &nbsp;{{ myAnswer(question).field.toLocaleUpperCase('tr') }}
                span(v-else) &nbsp;-

          // Ad
          AppAd(:data-ad-slot="9964323575")

    // Footer
    footer.stats-dialog__footer
      i18n.d-flex(path="app.copyright")
        template(#logo)
          SelimDoyranliLogo
        template(#spacer)
          span &nbsp;
        template(#text)
          span {{ $t('general.by') }}

  template(v-else)
    Empty.stats-dialog-empty
      p.stats-dialog-empty__title(v-html="$t('dialog.stats.empty.description')")
</template>

<script>
import { defineComponent, useContext, useStore, ref, reactive, watch, computed } from '@nuxtjs/composition-api'
import { APP_URL } from '@/system/constant'
import { Dialog, Tabs, Tab, CountDown, Button, Toast, Collapse, CollapseItem, Empty } from 'vant'

export default defineComponent({
  components: {
    Dialog: Dialog.Component,
    Tabs,
    Tab,
    CountDown,
    Button,
    Collapse,
    CollapseItem,
    Empty
  },
  props: {
    isOpen: {
      type: Boolean,
      required: false,
      default: false
    },
    cancelButtonText: {
      type: String,
      required: false,
      default: null
    },
    confirmButtonText: {
      type: String,
      required: false,
      default: null
    }
  },
  setup(props) {
    const { i18n } = useContext()
    const store = useStore()

    const { convertMsToTime } = useTime()

    const state = reactive({
      isOpen: props.isOpen
    })

    watch(
      () => props.isOpen,
      value => {
        state.isOpen = value
        setAnswers()
      }
    )

    const activeTab = ref('score')
    const toggledAnswer = ref(['A'])

    const isGameOver = computed(() => store.getters['daily/isGameOver'])

    const questions = computed(() => store.getters['daily/questions'])

    const correctAnswers = ref([])
    const wrongAnswers = ref([])
    const passedAnswers = ref([])

    const setAnswers = () => {
      correctAnswers.value = JSON.parse(window.localStorage.getItem('dailyCorrectAnswers')) || []
      wrongAnswers.value = JSON.parse(window.localStorage.getItem('dailyWrongAnswers')) || []
      passedAnswers.value = JSON.parse(window.localStorage.getItem('dailyPassedAnswers')) || []
    }

    const remainTime = computed(() => {
      if (isGameOver.value) {
        const { minutes, seconds } = convertMsToTime(window.localStorage.getItem('dailyRemainTime'))

        return `${minutes}:${seconds}`
      }
    })

    const today = new Date().toLocaleDateString('tr').slice(0, 10)

    const shareResults = async () => {
      const shareText = i18n.t('sharer.dailyModeStats.description', {
        day: today,
        correctAnswerCount: correctAnswers.value.length,
        wrongAnswerCount: wrongAnswers.value.length,
        passedAnswerCount: passedAnswers.value.length,
        remainTime: remainTime.value,
        url: APP_URL
      })

      window.postMessage({ type: 'sharer', data: shareText })

      try {
        await navigator.clipboard.writeText(shareText)
        await Toast({
          message: i18n.t('dialog.stats.clipboard.score.callback.success'),
          position: 'bottom'
        })
        await navigator.share({
          title: 'parolla',
          text: shareText
        })
      } catch {
        await navigator.clipboard.writeText(shareText)
        await Toast({
          message: i18n.t('dialog.stats.clipboard.score.callback.success'),
          position: 'bottom'
        })
      }
    }

    const nextGameDateMs = computed(() => {
      const midnight = new Date()

      midnight.setHours(24)
      midnight.setMinutes(0)
      midnight.setSeconds(0)
      midnight.setMilliseconds(0)

      return midnight.getTime() - new Date().getTime()
    })

    const answerClasses = question => {
      const correct = correctAnswers.value.some(item => question.letter.name === item.letter)
      const wrong = wrongAnswers.value.some(item => question.letter.name === item.letter)
      const passed = passedAnswers.value.some(item => question.letter.name === item.letter)

      if (correct) {
        return 'answer--correct'
      }

      if (wrong) {
        return 'answer--wrong'
      }

      if (passed) {
        return 'answer--passed'
      }
    }

    const myAnswer = question => {
      const storedAnswers = JSON.parse(window.localStorage.getItem('dailyMyAnswers'))

      if (storedAnswers && storedAnswers.length > 0) {
        return storedAnswers.filter(item => question.letter.name === item.letter).reverse()[0]
      } else {
        return {
          field: '-'
        }
      }
    }

    return {
      state,
      activeTab,
      toggledAnswer,
      remainTime,
      shareResults,
      correctAnswers,
      wrongAnswers,
      passedAnswers,
      isGameOver,
      questions,
      nextGameDateMs,
      answerClasses,
      myAnswer
    }
  }
})
</script>

<style lang="scss" src="./DailyModeStatsDialog.component.scss"></style>
