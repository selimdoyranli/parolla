<template lang="pug">
.draw-room
  header.draw-room__header
    .draw-room__brand
      span.draw-room__logo ✏️
      | Çiz
    .draw-room__hud
      span.draw-room__chip
        | Oda
        b {{ $route.params.code }}
      span.draw-room__chip(v-if="iAmDrawer && currentWord")
        | Çiziyor
        b {{ currentWord }}
      span.draw-room__chip(v-else-if="drawerName")
        | Çiziyor: {{ drawerName }}
      span.draw-room__chip(v-if="roundCount")
        | Tur
        b {{ roundIndex + 1 }} / {{ roundCount }}
      .draw-room__timer-slot(v-if="durationMs")
        DrawTimer(:remainingMs="remainingMs" :durationMs="durationMs")

  .draw-room__main
    .draw-room__stage-col
      .draw-room__masked(v-if="!iAmDrawer && maskedWord")
        DrawMaskedWord(:mask="maskedWord")
      DrawCanvas(
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
    aside.draw-room__side
      DrawScoreboard(:players="players" :drawerId="drawerId")
      DrawChat(:chat="chat" :iAmDrawer="iAmDrawer" :iGuessedCorrectly="iGuessedCorrectly" :isDrawing="isDrawing" @send="onSend")
      .draw-room__host-actions(v-if="iAmHost && isLobby")
        button.draw-room__host-btn(:disabled="players.length < 2" @click="startGame") Oyunu Başlat
      .draw-room__host-actions(v-if="iAmHost && isGameEnd")
        button.draw-room__host-btn(@click="startGame") Yeniden Başlat

  DrawWordPicker(v-if="iAmDrawer && wordOptions" :words="wordOptions" :timeoutMs="pickTimeoutMs" @pick="onPick")
  .draw-room__overlay(v-if="lastRoundResult")
    .draw-room__round-end
      h3 Tur Sonu
      p
        | Kelime:&nbsp;
        b {{ lastRoundResult.word }}
      p(v-if="lastRoundResult.reason === 'drawer_left'") Çizen ayrıldı
  .draw-room__overlay(v-if="finalScores")
    .draw-room__final
      h3 Oyun Bitti
      ol
        li(v-for="p in finalScores" :key="p.playerId") {{ p.name }} — {{ p.totalScore }}
</template>

<script>
import { defineComponent, computed, getCurrentInstance, ref } from '@nuxtjs/composition-api'
import { useDrawSocket } from '@/composables/useDrawSocket'
import { wsTypeEnum } from '@/enums/wsType.enum'

export default defineComponent({
  middleware: 'auth',
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

    // Drawer's own actions are also committed locally so the canvas reflects what
    // they just drew — server forwards chunks to other players but doesn't echo back.
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
      players,
      strokes,
      chat,
      wordOptions,
      pickTimeoutMs,
      drawerId,
      drawerName,
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
