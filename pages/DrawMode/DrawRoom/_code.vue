<template lang="pug">
.draw-room
  header.draw-room__topbar
    .draw-room__crumbs
      span.draw-room__crumb-label Oda
      span.draw-room__crumb-code {{ $route.params.code }}
    .draw-room__chips
      span.draw-room__chip.draw-room__chip--drawer(v-if="isDrawing && activeDrawerName")
        AppIcon(name="tabler:pencil" :width="12" :height="12")
        span.draw-room__chip-label Çiziyor
        span.draw-room__chip-name {{ activeDrawerName }}
      span.draw-room__chip.draw-room__chip--next(v-if="nextDrawerName && !isLobby && !isGameEnd")
        AppIcon(name="tabler:player-track-next" :width="12" :height="12")
        span.draw-room__chip-label Sıradaki
        span.draw-room__chip-name {{ nextDrawerName }}
      span.draw-room__chip.draw-room__chip--progress(v-if="roundCount")
        span.draw-room__chip-label Tur
        span.draw-room__chip-name {{ roundIndex + 1 }} / {{ roundCount }}

  .draw-room__board
    // Word + timer live OUTSIDE the canvas now so they can never visually
    // overlap the drawing area. Both slots are always rendered so the row
    // keeps a stable height regardless of game state (no layout shift when
    // drawing starts/ends).
    .draw-room__board-head
      .draw-room__head-word(v-if="wordBadgeVisible" :class="{ 'draw-room__head-word--drawer': iAmDrawer }")
        AppIcon.draw-room__head-word-icon(:name="iAmDrawer ? 'tabler:eye' : 'tabler:bulb'" :width="12" :height="12")
        DrawMaskedWord(v-if="iAmDrawer && currentWord" :plain="currentWord")
        DrawMaskedWord(v-else-if="maskedWord" :mask="maskedWord")
      .draw-room__head-spacer(v-else)
      .draw-room__head-timer(v-if="durationMs && isDrawing")
        DrawTimer(:remainingMs="remainingMs" :durationMs="durationMs")
      .draw-room__head-spacer(v-else)

    .draw-room__stage
      DrawCanvas.draw-room__canvas(
        :color="color"
        :drawable="iAmDrawer && isDrawing"
        :strokes="strokes"
        :tool="tool"
        :size="size"
        @chunk="onChunk"
        @stroke-end="onStrokeEnd"
      )

      // ── Canvas overlays. activeOverlay is a single source of truth so only
      //    one overlay can be visible at a time — prevents the round-end card
      //    from hanging around and covering the picker once picking starts.
      // ── Lobby / waiting overlay (start game, need 2 players, waiting for round) ──
      transition(name="draw-room-overlay")
        .draw-room__canvas-overlay.draw-room__canvas-overlay--lobby(v-if="activeOverlay === 'lobby'")
          .draw-room__lobby-card
            .draw-room__lobby-eyebrow {{ lobbyEyebrow }}
            h3.draw-room__lobby-title {{ lobbyTitle }}
            // Picking countdown — visible to non-drawers so they see the
            // same urgency the drawer feels in their picker.
            .draw-room__lobby-countdown(v-if="pickingCountdown > 0")
              span.draw-room__lobby-countdown-num {{ pickingCountdown }}
              span.draw-room__lobby-countdown-unit sn
            p.draw-room__lobby-hint(v-if="lobbyHint") {{ lobbyHint }}
            Button.draw-room__lobby-btn(
              v-if="roomKind !== 'system' && iAmHost && (isLobby || isGameEnd)"
              type="primary"
              size="large"
              round
              :disabled="startDisabled"
              @click="startGame"
            ) {{ startLabel }}
            .draw-room__lobby-loader(v-else)
              span.draw-room__lobby-dot
              span.draw-room__lobby-dot
              span.draw-room__lobby-dot

      // ── Word picker overlay (drawer only) ──
      transition(name="draw-room-overlay")
        .draw-room__canvas-overlay.draw-room__canvas-overlay--picker(v-if="activeOverlay === 'picker'")
          .draw-room__picker
            span.draw-room__picker-eyebrow Sıra Sende
            h3.draw-room__picker-title Çizmek için bir kelime seç
            .draw-room__picker-opts
              button.draw-room__picker-opt(v-for="w in wordOptions" :key="w" @click="onPick(w)") {{ w }}
            p.draw-room__picker-hint {{ pickSecondsLeft }}sn içinde seçmezsen sıranı kaybedersin.

      // ── Round-end overlay ──
      transition(name="draw-room-overlay")
        .draw-room__canvas-overlay.draw-room__canvas-overlay--round-end(v-if="activeOverlay === 'roundEnd'")
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

      // ── Final scores overlay — top 3 via Leaderboard ──
      transition(name="draw-room-overlay")
        .draw-room__canvas-overlay.draw-room__canvas-overlay--final(v-if="activeOverlay === 'final'")
          .draw-room__final
            span.draw-room__round-end-eyebrow {{ isFinalScoreboard ? 'Tur Bitti' : 'Oyun Bitti' }}
            h3.draw-room__round-end-title Final Skoru
            Leaderboard.draw-room__final-board(:scorers="finalTopThree")
            p.draw-room__final-cycle-hint(v-if="isFinalScoreboard && finalSecondsLeft > 0")
              | Yeni döngü {{ finalSecondsLeft }}sn içinde

      // ── Clear-confirmation overlay (drawer-only) ──
      transition(name="draw-room-overlay")
        .draw-room__canvas-overlay.draw-room__canvas-overlay--confirm(v-if="confirmClearOpen")
          .draw-room__confirm
            AppIcon.draw-room__confirm-icon(name="tabler:trash" :width="28" :height="28")
            h3.draw-room__confirm-title Çizimi temizle?
            p.draw-room__confirm-text Tüm çizim silinecek. Bu işlem geri alınamaz.
            .draw-room__confirm-actions
              Button.draw-room__confirm-btn.draw-room__confirm-btn--cancel(round @click="cancelClear") Vazgeç
              Button.draw-room__confirm-btn.draw-room__confirm-btn--danger(type="primary" round @click="confirmClear") Evet, temizle

      // ── 5s transient turn-lost toast ──
      transition(name="draw-room-toast")
        .draw-room__canvas-toast(v-if="canvasToast" :class="`draw-room__canvas-toast--${canvasToast.kind}`")
          AppIcon.draw-room__canvas-toast-icon(:name="canvasToastIcon" :width="18" :height="18")
          span.draw-room__canvas-toast-text {{ canvasToast.message }}

    // Toolbar slot is always rendered with a fixed min-height so the canvas
    // never shifts when drawing starts/ends. The DrawToolbar itself only
    // mounts when the local player is the active drawer.
    .draw-room__toolbar-slot
      DrawToolbar(
        v-if="iAmDrawer && isDrawing"
        :color="color"
        :tool="tool"
        :size="size"
        @update:tool="t => (tool = t)"
        @update:color="c => (color = c)"
        @update:size="s => (size = s)"
        @undo="onUndo"
        @clear="askClear"
      )

  .draw-room__panels
    DrawScoreboard.draw-room__scoreboard(
      :players="players"
      :drawerId="drawerId"
      :nextDrawerId="nextDrawerId"
      :myId="myId"
      :correctGuesserIds="correctGuesserIds"
    )
    DrawChat.draw-room__chat(
      :chat="chat"
      :players="players"
      :myId="myId"
      :iAmDrawer="iAmDrawer"
      :iGuessedCorrectly="iGuessedCorrectly"
      :isDrawing="isDrawing"
      @send="onSend"
    )
  CreateGuestDrawerDialog(v-if="showGuestDialog" @close="onGuestDialogClose")
</template>

<script>
import { defineComponent, computed, getCurrentInstance, ref, onMounted, onBeforeUnmount, watch } from '@nuxtjs/composition-api'
import { Button } from 'vant'
import { useDrawSocket } from '@/composables/useDrawSocket'
import { wsTypeEnum } from '@/enums/wsType.enum'
import { useGuestIdentity } from '@/composables/useGuestIdentity'
import CreateGuestDrawerDialog from '@/components/Draw/CreateGuestDrawerDialog/CreateGuestDrawerDialog.component.vue'

export default defineComponent({
  components: { Button, CreateGuestDrawerDialog },
  layout: 'Default/Default.layout',
  setup() {
    const { send } = useDrawSocket()
    const vm = getCurrentInstance().proxy
    const $store = vm.$store

    const tool = ref('brush')
    const color = ref('#000000')
    const size = ref(8)

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
    const correctGuesserIds = computed(() => $store.state.draw.correctGuesserIds)
    const iAmDrawer = computed(() => $store.state.draw.iAmDrawer)
    const iAmHost = computed(() => $store.state.draw.iAmHost)
    const iGuessedCorrectly = computed(() => $store.state.draw.iGuessedCorrectly)
    const isDrawing = computed(() => $store.getters['draw/isDrawing'])
    const isLobby = computed(() => $store.getters['draw/isLobby'])
    const isPicking = computed(() => $store.getters['draw/isPicking'])
    const isRoundEnd = computed(() => $store.getters['draw/isRoundEnd'])
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
    const pickEndsAt = computed(() => $store.state.draw.pickEndsAt)
    const roomKind = computed(() => $store.state.draw.roomKind)
    const isWaiting = computed(() => $store.getters['draw/isWaiting'])
    const isFinalScoreboard = computed(() => $store.getters['draw/isFinalScoreboard'])
    const waitingPresent = computed(() => $store.state.draw.waitingPresent)
    const waitingRequired = computed(() => $store.state.draw.waitingRequired)
    const finalNextRoundInMs = computed(() => $store.state.draw.finalNextRoundInMs)

    // Local ticker drives the round-end countdown and word-pick timer without
    // needing a per-second WS message.
    const now = ref(Date.now())
    let nowInterval = null

    const showGuestDialog = ref(false)

    onMounted(async () => {
      nowInterval = setInterval(() => {
        now.value = Date.now()
      }, 250)

      const codeParam = vm.$route.params.code

      if (!codeParam || $store.state.draw.room) return

      const guest = useGuestIdentity()
      const doJoin = () => send(wsTypeEnum.DRAW_ROOM_JOIN, { code: codeParam })

      if (guest.isGuest.value) {
        guest.ensureIdentity()
        const SESSION_FLAG = 'draw_guest_dialog_shown'
        const alreadyShown = typeof window !== 'undefined' && window.sessionStorage.getItem(SESSION_FLAG)

        if (!alreadyShown) {
          if (typeof window !== 'undefined') window.sessionStorage.setItem(SESSION_FLAG, '1')
          showGuestDialog.value = true

          // Defer join until the dialog closes (Onayla or dismiss).
          return
        }
      }

      doJoin()
    })

    const onGuestDialogClose = () => {
      showGuestDialog.value = false
      const codeParam = vm.$route.params.code

      if (codeParam && !$store.state.draw.room) {
        send(wsTypeEnum.DRAW_ROOM_JOIN, { code: codeParam })
      }
    }
    onBeforeUnmount(() => {
      if (nowInterval) clearInterval(nowInterval)
    })

    const countdownSeconds = computed(() => {
      if (!nextRoundEndsAt.value) return 0
      const ms = Math.max(0, nextRoundEndsAt.value - now.value)

      return Math.ceil(ms / 1000)
    })

    // Mirror DrawWordPicker's internal countdown so we can render the hint
    // inside the canvas overlay without re-mounting the legacy picker.
    const pickerStartedAt = ref(0)
    watch(
      () => wordOptions.value,
      v => {
        if (v) pickerStartedAt.value = Date.now()
      }
    )
    const pickSecondsLeft = computed(() => {
      if (!wordOptions.value || !pickTimeoutMs.value || !pickerStartedAt.value) return 0
      const elapsed = now.value - pickerStartedAt.value

      return Math.max(0, Math.ceil((pickTimeoutMs.value - elapsed) / 1000))
    })

    // Server broadcasts `pickEndsAt` in room_state during picking so non-drawers
    // can render the same urgency the drawer feels in their picker overlay.
    const pickingCountdown = computed(() => {
      if (!pickEndsAt.value || !isPicking.value) return 0

      return Math.max(0, Math.ceil((pickEndsAt.value - now.value) / 1000))
    })

    // System-room final scoreboard runs for ~15 s before auto-resetting.
    // finalShownAt is captured on entry so the countdown is monotonic across
    // re-renders.
    const finalShownAt = ref(0)
    watch(isFinalScoreboard, v => {
      if (v) finalShownAt.value = Date.now()
    })
    const finalSecondsLeft = computed(() => {
      if (!isFinalScoreboard.value || !finalShownAt.value || !finalNextRoundInMs.value) return 0
      const remaining = finalNextRoundInMs.value - (now.value - finalShownAt.value)

      return Math.max(0, Math.ceil(remaining / 1000))
    })

    const startDisabled = computed(() => isLobby.value && players.value.length < 2)
    const startLabel = computed(() => (isGameEnd.value ? 'Yeniden Başlat' : 'Oyunu Başlat'))

    const wordBadgeVisible = computed(() => {
      if (!isDrawing.value) return false

      return (iAmDrawer.value && !!currentWord.value) || !!maskedWord.value
    })

    // Single source of truth for which canvas overlay is showing. Picker
    // outranks the stale round-end card so the drawer never has tur-sonu
    // covering their word options; the round-end card disappears once the
    // countdown elapses so non-drawers don't get stuck on "0sn" while the
    // drawer is still picking.
    const activeOverlay = computed(() => {
      if (isFinalScoreboard.value) return 'final'

      if (finalScores.value) return 'final'

      if (iAmDrawer.value && wordOptions.value) return 'picker'

      if (lastRoundResult.value) {
        if (lastRoundResult.value.isLastRound) return 'roundEnd'

        if (countdownSeconds.value > 0) return 'roundEnd'

        return 'lobby'
      }

      if (isPicking.value && !iAmDrawer.value) return 'lobby'

      if (isGameEnd.value) return 'lobby'

      if (isWaiting.value) return 'lobby'

      if (isLobby.value) return 'lobby'

      if (isRoundEnd.value) return 'lobby'

      return null
    })

    const lobbyEyebrow = computed(() => {
      if (isWaiting.value) return 'Bekleniyor'

      if (isGameEnd.value && !lastRoundResult.value) return 'Oyun Sonu'

      if (isLobby.value) return 'Lobi'

      if (isPicking.value || lastRoundResult.value) return 'Hazırlanıyor'

      return 'Bekleniyor'
    })

    // SET_ROOM_STATE updates drawerId during picking but leaves drawerName
    // pointing at the previous round's drawer (ROUND_START is the only writer
    // for drawerName). Resolve the live name straight from the players list
    // so "X kelime seçiyor…" can't lag the actual drawer.
    const activeDrawerName = computed(() => {
      if (drawerId.value == null) return drawerName.value || ''
      const live = (players.value || []).find(p => String(p.id) === String(drawerId.value))

      return live?.name || drawerName.value || ''
    })

    const lobbyTitle = computed(() => {
      if (isWaiting.value) return 'Oyuncular bekleniyor'

      if (isGameEnd.value && !lastRoundResult.value) return 'Yeni Tur İçin Hazır mısın?'

      if (isLobby.value) return iAmHost.value ? 'Oyunu Başlat' : 'Host oyunu başlatacak'

      if (isPicking.value && !iAmDrawer.value) {
        return activeDrawerName.value ? `${activeDrawerName.value} kelime seçiyor…` : 'Çizen kelime seçiyor…'
      }

      return 'Yeni tur bekleniyor…'
    })

    const lobbyHint = computed(() => {
      if (isWaiting.value) return `${waitingPresent.value || 0} / ${waitingRequired.value || 2}`

      if (isLobby.value && players.value.length < 2) return 'Başlatmak için en az 2 oyuncu gerek.'

      if (isLobby.value && !iAmHost.value) return 'Yalnızca host başlatabilir.'

      return ''
    })

    // ── 5s transient turn-lost / important toast ──
    // The user complained that "X sırasını kaybetti" (drawer didn't pick a
    // word — broadcast as a 'danger' systemKind chat) gets buried when new
    // chat messages arrive. We surface these as a 5-second toast directly on
    // the canvas so they survive scrolling chat.
    const canvasToast = ref(null)
    let toastTimer = null
    const lastSeenChatTs = ref(0)
    onMounted(() => {
      // Treat any history already loaded at mount as "seen" so we don't
      // flash an old danger message when re-entering the room.
      const last = chat.value[chat.value.length - 1]
      lastSeenChatTs.value = last?.timestamp || Date.now()
    })
    watch(
      () => chat.value.length,
      () => {
        const last = chat.value[chat.value.length - 1]

        if (!last || !last.timestamp || last.timestamp <= lastSeenChatTs.value) return
        lastSeenChatTs.value = last.timestamp

        if (!last.isSystem) return

        // Only surface high-signal events as canvas toasts: turn-lost (danger)
        // and round-end-shaped guesses (success). Info-level join/leave noise
        // stays in chat only.
        if (last.systemKind !== 'danger' && last.systemKind !== 'success') return

        if (toastTimer) clearTimeout(toastTimer)
        canvasToast.value = {
          kind: last.systemKind,
          message: last.message,
          ts: last.timestamp
        }
        toastTimer = setTimeout(() => {
          canvasToast.value = null
          toastTimer = null
        }, 5000)
      }
    )
    onBeforeUnmount(() => {
      if (toastTimer) clearTimeout(toastTimer)
    })

    const canvasToastIcon = computed(() => {
      if (!canvasToast.value) return 'tabler:info-circle'

      if (canvasToast.value.kind === 'danger') return 'tabler:alert-octagon'

      if (canvasToast.value.kind === 'success') return 'tabler:circle-check'

      if (canvasToast.value.kind === 'warning') return 'tabler:alert-triangle'

      return 'tabler:info-circle'
    })

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

    // ── Clear-confirmation overlay ──
    // The toolbar's trash button now asks instead of acting. onClear() only
    // fires after the user confirms in the canvas-relative overlay below.
    const confirmClearOpen = ref(false)
    const askClear = () => {
      if (!strokes.value.length) return
      confirmClearOpen.value = true
    }
    const cancelClear = () => {
      confirmClearOpen.value = false
    }
    const confirmClear = () => {
      onClear()
      confirmClearOpen.value = false
    }

    // ── Final scores → Leaderboard (top 3 only) ──
    // The Leaderboard component takes a `scorers` array shaped like the player
    // dialog expects: { id, username, score, ...avatarFields }. The server only
    // emits { playerId, name, totalScore } in finalScores, so we enrich each
    // entry from the live players list so avatars (diceBear/profilePhoto)
    // render correctly on the podium.
    const finalTopThree = computed(() => {
      if (!finalScores.value) return []
      const byId = new Map((players.value || []).map(p => [String(p.id), p]))

      return finalScores.value.slice(0, 3).map(f => {
        const live = byId.get(String(f.playerId)) || {}

        return {
          id: f.playerId,
          username: f.name,
          score: f.totalScore,
          avatarSource: live.avatarSource,
          profilePhoto: typeof live.profilePhoto === 'string' ? { url: live.profilePhoto } : live.profilePhoto,
          diceBear: live.diceBear,
          role: live.role
        }
      })
    })
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
      correctGuesserIds,
      iAmDrawer,
      iAmHost,
      iGuessedCorrectly,
      isDrawing,
      isLobby,
      isPicking,
      isRoundEnd,
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
      pickSecondsLeft,
      pickingCountdown,
      startDisabled,
      startLabel,
      wordBadgeVisible,
      activeOverlay,
      activeDrawerName,
      lobbyEyebrow,
      lobbyTitle,
      lobbyHint,
      canvasToast,
      canvasToastIcon,
      onChunk,
      onStrokeEnd,
      onUndo,
      onClear,
      onPick,
      onSend,
      startGame,
      confirmClearOpen,
      askClear,
      cancelClear,
      confirmClear,
      finalTopThree,
      roomKind,
      isWaiting,
      isFinalScoreboard,
      waitingPresent,
      waitingRequired,
      finalSecondsLeft,
      showGuestDialog,
      onGuestDialogClose
    }
  }
})
</script>

<style src="./DrawRoom.page.scss" lang="scss" scoped />
