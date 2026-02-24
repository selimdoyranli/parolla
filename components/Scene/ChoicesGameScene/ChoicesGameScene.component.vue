<template lang="pug">
.scene.game-scene.choices-game-scene(ref="rootRef" tabindex="1" :class="[gameSceneClasses]")
  // Scene Inner
  .scene__inner.game-scene__inner
    // Info header
    .room-info
      .room-info__title {{ room.title }}
      .remaining-choices
        template(v-if="remainingChoicesCount > 0") {{ $t('choices.remainingChoices', { count: remainingChoicesCount }) }}
        template(v-else) {{ $t('choices.lastChoice') }}

    // Game Layout
    .versus-set(v-if="!ultimateWinner")
      // Left Choice
      .choice-card.choice-card--left(
        :class="{ 'is-selected': selectedSide === 'left', 'is-loser': selectedSide === 'right' }"
        @click="selectChoice('left')"
      )
        ChoiceCard(v-if="choiceFirst" :choice="choiceFirst")

      // Vs Icon
      .versus-icon
        img(src="/img/elements/versus.webp" alt="Versus" draggable="false" width="64" height="64")

      // Right Choice
      .choice-card.choice-card--right(
        :class="{ 'is-selected': selectedSide === 'right', 'is-loser': selectedSide === 'left' }"
        @click="selectChoice('right')"
      )
        ChoiceCard(v-if="choiceSecond" :choice="choiceSecond")

    // Winner Layout
    .winner-layout(v-else)
      h2.winner-layout__title {{ $t('choices.winner.title') }}
      .choice-card.choice-card--winner
        ChoiceCard(v-if="ultimateWinner" :choice="ultimateWinner")

      .winner-layout__actions
        Button.button.button--primary(type="info" plain round @click="resetGame") {{ $t('general.playAgain') }}

  // How To Play Dialog
  HowToPlayDialog(:isOpen="dialog.howToPlay.isOpen" @closed="startGame")
  // Interstitial Ad Dialog
  InterstitialAdDialog(:cancelButtonText="$t('gameScene.skipAdShowScore')" :isOpen="dialog.interstitialAd.isOpen")
</template>

<script>
import { defineComponent, useStore, useContext, ref, onMounted, onUnmounted, computed } from '@nuxtjs/composition-api'
import { Button } from 'vant'

export default defineComponent({
  components: {
    Button
  },
  setup() {
    const store = useStore()
    const { $ua } = useContext()

    const rootRef = ref(null)

    const { setRootRef, dialog, startGame: sceneStartGame, handleBeforeUnload, scrollTop, checkUnsupportedHeight } = useGameScene()
    const { initGame, selectChoice, choiceFirst, choiceSecond, isAnimating, selectedSide, ultimateWinner, choicesQueue } = useChoices()

    const creatorDialog = computed(() => store.getters['creator/dialog'])
    const room = computed(() => store.getters['creator/room'])
    const choices = computed(() => store.getters['creator/choices'])
    const remainingChoicesCount = computed(() => {
      return choicesQueue.value.length
    })

    const resetGame = () => {
      dialog.howToPlay.isOpen = true
      initGame(choices.value || [])
    }

    const startGame = () => {
      sceneStartGame()
    }

    onMounted(() => {
      setRootRef(rootRef.value)
      resetGame()

      window.addEventListener('beforeunload', event => handleBeforeUnload(event))
      window.addEventListener('scroll', scrollTop)
      checkUnsupportedHeight()
    })

    onUnmounted(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('scroll', scrollTop)
    })

    const gameSceneClasses = computed(() => {
      return {
        'game-scene--isMobileDevice': $ua.isFromMobilephone()
      }
    })

    return {
      rootRef,
      room,
      choices,
      remainingChoicesCount,
      dialog,
      creatorDialog,
      startGame,
      resetGame,
      gameSceneClasses,
      selectChoice,
      choiceFirst,
      choiceSecond,
      selectedSide,
      isAnimating,
      ultimateWinner
    }
  }
})
</script>

<style lang="scss" src="./ChoicesGameScene.component.scss"></style>
