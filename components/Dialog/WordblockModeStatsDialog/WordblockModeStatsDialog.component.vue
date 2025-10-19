<template lang="pug">
Dialog.dialog.stats-dialog.wordblock-mode-stats-dialog(
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
    .results
      template(v-if="gameResult.status === 'won'")
        .status-card.status-card--won
          .status-card-title
            .status-card-title__icon
              AppIcon(name="tabler:trophy")
            span.status-card-title__value {{ $t('dialog.stats.won.title') }}
          .status-card-description(
            v-html="$t('dialog.stats.won.description', { attempts: gameResult.attempts, targetWord: gameResult.word })"
          )

      template(v-else)
        .status-card.status-card--lost
          .status-card-title
            .status-card-title__icon
              AppIcon(name="tabler:x")
            span.status-card-title__value {{ $t('dialog.stats.lost.title') }}
          .status-card-description(v-html="$t('dialog.stats.lost.description', { targetWord: gameResult.word })")

      p {{ $t('gameScene.elapsedTime') }}: <strong>{{ elapsedTime }}</strong>

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

    const getCellEmojis = () => {
      if (!gameResult.value || !gameResult.value.guesses) {
        return ''
      }

      const emojiMap = {
        absent: '⬛',
        present: '🟨',
        correct: '🟩'
      }

      return gameResult.value.guesses
        .filter(guess => guess.word) // Filter out empty guesses
        .map(guess => {
          return guess.states.map(state => emojiMap[state] || '⬛').join('')
        })
        .join('\n')
    }

    watch(
      () => props.isOpen,
      value => {
        state.isOpen = value
      }
    )

    const isGameOver = computed(() => store.getters['wordblock/isGameOver'])
    const gameResult = computed(() => store.getters['wordblock/result'])

    const elapsedTime = computed(() => {
      if (isGameOver.value && gameResult.value.elapsedTime) {
        const { minutes, seconds } = convertMsToTime(gameResult.value.elapsedTime)

        return `${minutes}:${seconds}`
      }

      return '00:00'
    })

    const today = new Date().toLocaleDateString('tr').slice(0, 10)

    const shareResults = async () => {
      const shareText = i18n.t('sharer.wordblockModeStats.description', {
        cells: getCellEmojis(),
        attempts: gameResult.value.attempts,
        maxAttempts: 5,
        elapsedTime: elapsedTime.value,
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

    return {
      state,
      gameResult,
      elapsedTime,
      shareResults,
      isGameOver,
      nextGameDateMs,
      getCellEmojis
    }
  }
})
</script>

<style lang="scss" src="./WordblockModeStatsDialog.component.scss"></style>
