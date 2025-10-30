<template lang="pug">
Dialog.dialog.stats-dialog.creator-mode-stats-dialog(
  v-model="state.isOpen"
  :title="$t('general.stats')"
  :cancel-button-text="cancelButtonText || $t('general.close')"
  :confirm-button-text="confirmButtonText || $t('general.ok')"
  :show-cancel-button="true"
  :show-confirm-button="true"
  :close-on-click-overlay="false"
  @closed="$emit('closed')"
  @cancel="$emit('onCancel')"
  @confirm="$emit('onConfirm')"
)
  template(v-if="isGameOver")
    // Tabs
    Tabs.stats-dialog__tabs(v-model="activeTab")
      // Score Tab
      Tab(name="score")
        template(#title)
          .stats-dialog-tab-title
            AppIcon.stats-dialog-tab-title__icon(name="tabler:chart-bar" :width="20" :height="20")
            span.stats-dialog-tab-title__value {{ $t('gameScene.scoreStats') }}
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
          // Result Sharer
          .result-sharer
            Button.result-sharer__button(color="var(--color-success-01)" icon="share-o" icon-position="right" round @click="shareResults")
              | {{ $t('general.share').toLocaleUpperCase($i18n.locale) }}

      Tab(name="answers")
        template(#title)
          .stats-dialog-tab-title
            AppIcon.stats-dialog-tab-title__icon(name="tabler:list-check" :width="20" :height="20")
            span.stats-dialog-tab-title__value {{ $t('gameScene.answerKey') }}
        // Answers
        .answers
          Collapse.answers__inner(v-model="toggledAnswer" accordion)
            // Answer
            CollapseItem.answer(
              v-for="(question, index) in questions"
              :key="index"
              :value="question.letter"
              :class="[answerClasses({ questionIndex: index })]"
              :name="index"
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
                span(v-if="myAnswer({ questionIndex: index }) && myAnswer({ questionIndex: index }).field.length > 0")
                  | &nbsp;{{ myAnswer({ questionIndex: index }).field.toLocaleUpperCase('tr') }}
                span(v-else) &nbsp;-
          // Ad
          AppAd(:data-ad-slot="9964323575")

      Tab(name="scoreboard")
        template(#title)
          .stats-dialog-tab-title
            AppIcon.stats-dialog-tab-title__icon(name="tabler:trophy" :width="20" :height="20")
            span.stats-dialog-tab-title__value {{ $t('scoreboard.scoreboard') }}
        template(v-if="pendingScoreboard")
          Empty(:description="$t('scoreboard.pendingScoreboard')")
        template(v-else)
          NoticeBar.mb-2.mt-2.cursor-pointer(v-if="!$auth.loggedIn && !$auth.user" auth-control wrapable)
            small(v-html="$t('scoreboard.loginToBeInScoreboard')")

          ScoreboardList(:items="scoreboard.list" @on-infinite-loading="handleInfiniteLoading")

      Tab(name="reviews")
        template(#title)
          .stats-dialog-tab-title
            AppIcon.stats-dialog-tab-title__icon(name="tabler:message-2" :width="20" :height="20")
            span.stats-dialog-tab-title__value {{ $t('general.comments') }}
        RoomReviewView(v-if="activeTab === 'reviews'")

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
import { defineComponent, useRoute, useContext, useStore, ref, reactive, watch, computed } from '@nuxtjs/composition-api'
import { APP_URL } from '@/system/constant'
import { Dialog, Tabs, Tab, CountDown, Button, Toast, Collapse, CollapseItem, Empty, NoticeBar } from 'vant'

export default defineComponent({
  components: {
    Dialog: Dialog.Component,
    Tabs,
    Tab,
    CountDown,
    Button,
    Collapse,
    CollapseItem,
    Empty,
    NoticeBar
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
    const route = useRoute()
    const { localePath, i18n } = useContext()
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
    const toggledAnswer = ref([0])

    const room = computed(() => store.getters['creator/room'])

    const isGameOver = computed(() => store.getters['creator/isGameOver'])

    const questions = computed(() => store.getters['creator/questions'])

    const correctAnswers = ref([])
    const wrongAnswers = ref([])
    const passedAnswers = ref([])

    const setAnswers = () => {
      correctAnswers.value = JSON.parse(window.localStorage.getItem('creatorCorrectAnswers')) || []
      wrongAnswers.value = JSON.parse(window.localStorage.getItem('creatorWrongAnswers')) || []
      passedAnswers.value = JSON.parse(window.localStorage.getItem('creatorPassedAnswers')) || []
    }

    const remainTime = computed(() => {
      if (isGameOver.value) {
        const { minutes, seconds } = convertMsToTime(store.getters['creator/countdown'].time)

        return `${minutes}:${seconds}`
      }
    })

    const shareResults = async () => {
      const shareText = i18n.t('sharer.creatorModeStats.description', {
        roomTitle: room.value.title,
        questionCount: questions.value.length,
        correctAnswerCount: correctAnswers.value.length,
        wrongAnswerCount: wrongAnswers.value.length,
        passedAnswerCount: passedAnswers.value.length,
        remainTime: remainTime.value,
        url: `${APP_URL}${localePath({ name: 'CreatorMode-CreatorModeRoom-slug', params: { slug: route.value.params.slug } })}`
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

    const answerClasses = ({ questionIndex }) => {
      const correct = correctAnswers.value.some(item => questionIndex === item.index)
      const wrong = wrongAnswers.value.some(item => questionIndex === item.index)
      const passed = passedAnswers.value.some(item => questionIndex === item.index)

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

    const myAnswer = ({ questionIndex }) => {
      const storedAnswers = JSON.parse(window.localStorage.getItem('creatorMyAnswers'))

      if (storedAnswers && storedAnswers.length > 0) {
        return storedAnswers.filter(item => questionIndex === item.index).reverse()[0]
      } else {
        return {
          field: '-'
        }
      }
    }

    const scoreboard = computed(() => store.getters['creator/scoreboard'])

    const pendingScoreboard = ref(false)

    watch(
      () => activeTab.value,
      async value => {
        if (value) {
          if (value === 'scoreboard') {
            pendingScoreboard.value = true

            await store.dispatch('creator/fetchScoreboard', {
              roomId: room.value.id
            })

            pendingScoreboard.value = false
          }
        }
      }
    )

    const pagination = computed(() => store.getters['creator/scoreboardPagination'])

    const handleInfiniteLoading = async $state => {
      const { data, error } = await store.dispatch('creator/fetchScoreboard', {
        isLoadMore: true,
        page: pagination.value.page + 1,
        roomId: room.value.id
      })

      $state.loaded()

      if (data?.data.length === 0) {
        $state.complete()

        return false
      }

      if (error) {
        $state.error()

        return false
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
      answerClasses,
      myAnswer,
      scoreboard,
      pendingScoreboard,
      handleInfiniteLoading
    }
  }
})
</script>

<style lang="scss" src="./CreatorModeStatsDialog.component.scss"></style>
