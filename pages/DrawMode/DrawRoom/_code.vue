<template lang="pug">
.draw-room
  header.draw-room__topbar
    .draw-room__crumbs
      span.draw-room__crumb-label Oda
      span.draw-room__crumb-code {{ $route.params.code }}
    .draw-room__chips
      span.draw-room__chip.draw-room__chip--drawer(v-if="drawerName")
        AppIcon(name="tabler:pencil" :width="12" :height="12")
        span.draw-room__chip-label Çiziyor
        span.draw-room__chip-name {{ drawerName }}
      span.draw-room__chip.draw-room__chip--next(v-if="nextDrawerName && !isLobby && !isGameEnd")
        AppIcon(name="tabler:player-track-next" :width="12" :height="12")
        span.draw-room__chip-label Sıradaki
        span.draw-room__chip-name {{ nextDrawerName }}
      span.draw-room__chip.draw-room__chip--progress(v-if="roundCount")
        span.draw-room__chip-label Tur
        span.draw-room__chip-name {{ roundIndex + 1 }} / {{ roundCount }}

  .draw-room__board
    .draw-room__wordbar(v-if="iAmDrawer && currentWord")
      span.draw-room__wordbar-label Kelimen
      DrawMaskedWord(:plain="currentWord")
      .draw-room__wordbar-spacer
      DrawTimer.draw-room__wordbar-timer(v-if="durationMs && isDrawing" :remainingMs="remainingMs" :durationMs="durationMs")
    .draw-room__wordbar(v-else-if="maskedWord")
      span.draw-room__wordbar-label Tahmin et
      DrawMaskedWord(:mask="maskedWord")
      .draw-room__wordbar-spacer
      DrawTimer.draw-room__wordbar-timer(v-if="durationMs && isDrawing" :remainingMs="remainingMs" :durationMs="durationMs")

    DrawCanvas.draw-room__canvas(
      :color="color"
      :drawable="iAmDrawer && isDrawing"
      :strokes="strokes"
      :tool="tool"
      :size="size"
      @chunk="onChunk"
      @stroke-end="onStrokeEnd"
    )

    DrawToolbar(
      v-if="iAmDrawer && isDrawing"
      :color="color"
      :tool="tool"
      :size="size"
      @update:tool="t => (tool = t)"
      @update:color="c => (color = c)"
      @update:size="s => (size = s)"
      @undo="onUndo"
      @clear="onClear"
    )

  Tabs.draw-room__tabs(v-model="activeTab" sticky animated swipeable :ellipsis="false")
    Tab(:title="`Skor (${players.length})`")
      DrawScoreboard.draw-room__scoreboard(:players="players" :drawerId="drawerId" :nextDrawerId="nextDrawerId" :myId="myId")
    Tab(title="Sohbet" :info="unreadChat")
      DrawChat.draw-room__chat(
        :chat="chat"
        :iAmDrawer="iAmDrawer"
        :iGuessedCorrectly="iGuessedCorrectly"
        :isDrawing="isDrawing"
        @send="onSend"
      )

  .draw-room__host-actions(v-if="iAmHost && (isLobby || isGameEnd)")
    Button.draw-room__host-btn(type="primary" size="large" block round :disabled="startDisabled" @click="startGame") {{ startLabel }}
    p.draw-room__host-hint(v-if="isLobby && players.length < 2") Başlatmak için en az 2 oyuncu gerek.

  DrawWordPicker(v-if="iAmDrawer && wordOptions" :words="wordOptions" :timeoutMs="pickTimeoutMs" @pick="onPick")

  .draw-room__overlay(v-if="lastRoundResult && !finalScores")
    .draw-room__round-end
      span.draw-room__round-end-eyebrow Tur Sonu
      h3.draw-room__round-end-title
        | Kelime:&nbsp;
        b {{ lastRoundResult.word }}
      p.draw-room__round-end-reason(v-if="lastRoundResult.reason === 'drawer_left'") Çizen oyundan ayrıldı
      p.draw-room__round-end-reason(v-else-if="lastRoundResult.reason === 'all_guessed'") Herkes bildi!
      p.draw-room__round-end-reason(v-else-if="lastRoundResult.reason === 'time_up'") Süre doldu
      .draw-room__round-end-countdown(v-if="!lastRoundResult.isLastRound")
        span.draw-room__round-end-countdown-label
          template(v-if="lastRoundResult.nextDrawerName") Sıradaki: <b>{{ lastRoundResult.nextDrawerName }}</b>
          template(v-else) Sıradaki tur başlıyor
        .draw-room__round-end-countdown-clock
          span.draw-room__round-end-countdown-num {{ countdownSeconds }}
          span.draw-room__round-end-countdown-unit sn
      .draw-room__round-end-countdown(v-else)
        span.draw-room__round-end-countdown-label Oyun bitiyor…

  .draw-room__overlay(v-if="finalScores")
    .draw-room__final
      span.draw-room__round-end-eyebrow Oyun Bitti
      h3.draw-room__round-end-title Final Skoru
      ol.draw-room__final-list
        li(v-for="(p, i) in finalScores" :key="p.playerId")
          span.draw-room__final-rank {{ i + 1 }}
          span.draw-room__final-name {{ p.name }}
          span.draw-room__final-score {{ p.totalScore }}
</template>

<script>
import { defineComponent, computed, getCurrentInstance, ref, watch, onMounted, onBeforeUnmount } from '@nuxtjs/composition-api'
import { Tabs, Tab, Button } from 'vant'
import { useDrawSocket } from '@/composables/useDrawSocket'
import { wsTypeEnum } from '@/enums/wsType.enum'

export default defineComponent({
  components: { Tabs, Tab, Button },
  middleware: 'auth',
  setup() {
    const { send } = useDrawSocket()
    const vm = getCurrentInstance().proxy
    const $store = vm.$store

    const tool = ref('brush')
    const color = ref('#000000')
    const size = ref(8)
    const activeTab = ref(0)
    const seenChatCount = ref(0)

    const players = computed(() => $store.state.draw.players)
    const strokes = computed(() => $store.state.draw.strokes)
    const chat = computed(() => $store.state.draw.chat)
    const wordOptions = computed(() => $store.state.draw.wordOptions)
    const pickTimeoutMs = computed(() => $store.state.draw.pickTimeoutMs)
    const drawerId = computed(() => $store.state.draw.drawerId)
    const drawerName = computed(() => $store.state.draw.drawerName)
    const nextDrawerId = computed(() => $store.state.draw.nextDrawerId)
    const nextDrawerName = computed(() => $store.state.draw.nextDrawerName)
    const myId = computed(() => $store.state.draw.myId)
    const iAmDrawer = computed(() => $store.state.draw.iAmDrawer)
    const iAmHost = computed(() => $store.state.draw.iAmHost)
    const iGuessedCorrectly = computed(() => $store.state.draw.iGuessedCorrectly)
    const isDrawing = computed(() => $store.getters['draw/isDrawing'])
    const isLobby = computed(() => $store.getters['draw/isLobby'])
    const isGameEnd = computed(() => $store.getters['draw/isGameEnd'])
    const remainingMs = computed(() => $store.state.draw.remainingMs)
    const durationMs = computed(() => $store.state.draw.durationMs)
    const roundIndex = computed(() => $store.state.draw.roundIndex)
    const roundCount = computed(() => $store.state.draw.roundCount)
    const currentWord = computed(() => $store.state.draw.currentWord)
    const maskedWord = computed(() => $store.state.draw.maskedWord)
    const lastRoundResult = computed(() => $store.state.draw.lastRoundResult)
    const finalScores = computed(() => $store.state.draw.finalScores)
    const nextRoundEndsAt = computed(() => $store.state.draw.nextRoundEndsAt)

    // Local ticker drives the round-end countdown without leaning on a per-second WS message.
    const now = ref(Date.now())
    let nowInterval = null
    onMounted(() => {
      nowInterval = setInterval(() => {
        now.value = Date.now()
      }, 250)
    })
    onBeforeUnmount(() => {
      if (nowInterval) clearInterval(nowInterval)
    })

    const countdownSeconds = computed(() => {
      if (!nextRoundEndsAt.value) return 0
      const ms = Math.max(0, nextRoundEndsAt.value - now.value)

      return Math.ceil(ms / 1000)
    })

    const startDisabled = computed(() => isLobby.value && players.value.length < 2)
    const startLabel = computed(() => (isGameEnd.value ? 'Yeniden Başlat' : 'Oyunu Başlat'))

    // Unread chat badge on the tab (cleared when the chat tab is active).
    const unreadChat = computed(() => {
      const diff = chat.value.length - seenChatCount.value

      return diff > 0 ? String(diff) : ''
    })

    watch(activeTab, t => {
      if (t === 1) seenChatCount.value = chat.value.length
    })

    watch(
      () => chat.value.length,
      len => {
        if (activeTab.value === 1) seenChatCount.value = len
      }
    )

    const onChunk = payload => {
      $store.commit('draw/PUSH_STROKE', payload)
      send(wsTypeEnum.DRAW_STROKE_CHUNK, payload)
    }
    const onStrokeEnd = payload => send(wsTypeEnum.DRAW_STROKE_END, payload)
    const onUndo = () => {
      $store.commit('draw/POP_STROKE')
      send(wsTypeEnum.DRAW_UNDO)
    }
    const onClear = () => {
      $store.commit('draw/CLEAR_STROKES')
      send(wsTypeEnum.DRAW_CLEAR)
    }
    const onPick = word => send(wsTypeEnum.DRAW_WORD_CHOOSE, { word })

    const onSend = text => {
      if ($store.getters['draw/isDrawing']) send(wsTypeEnum.DRAW_GUESS, { guess: text })
      else send(wsTypeEnum.DRAW_CHAT, { message: text })
    }

    const startGame = () => send(wsTypeEnum.DRAW_GAME_START)

    return {
      tool,
      color,
      size,
      activeTab,
      unreadChat,
      players,
      strokes,
      chat,
      wordOptions,
      pickTimeoutMs,
      drawerId,
      drawerName,
      nextDrawerId,
      nextDrawerName,
      myId,
      iAmDrawer,
      iAmHost,
      iGuessedCorrectly,
      isDrawing,
      isLobby,
      isGameEnd,
      remainingMs,
      durationMs,
      roundIndex,
      roundCount,
      currentWord,
      maskedWord,
      lastRoundResult,
      finalScores,
      countdownSeconds,
      startDisabled,
      startLabel,
      onChunk,
      onStrokeEnd,
      onUndo,
      onClear,
      onPick,
      onSend,
      startGame
    }
  }
})
</script>

<style src="./DrawRoom.page.scss" lang="scss" scoped />
