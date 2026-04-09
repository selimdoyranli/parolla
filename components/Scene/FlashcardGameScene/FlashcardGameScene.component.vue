<template lang="pug">
.scene.game-scene.flashcard-game-scene(ref="rootRef" tabindex="1" :class="[gameSceneClasses]")
  .scene__inner.game-scene__inner
    // Info header
    .room-info
      .room-info__title {{ room.title }}
      .card-counter
        span.card-counter__current {{ currentIndex + 1 }}
        span.card-counter__separator /
        span.card-counter__total {{ totalCards }}

    // Card area
    .flashcard-area(v-if="currentCard")
      .flashcard-wrapper(@click="flipCard")
        .flashcard(:class="{ 'is-flipped': isFlipped }")
          .flashcard__face.flashcard__front
            .flashcard__label {{ $t('flashcardScene.front') }}
            .flashcard__text {{ currentCard.cardFrontText }}
          .flashcard__face.flashcard__back
            .flashcard__label {{ $t('flashcardScene.back') }}
            .flashcard__text {{ currentCard.cardBackText }}

      // Tap hint
      p.flashcard-area__hint {{ $t('flashcardScene.tapToFlip') }}

    // Navigation
    .flashcard-nav
      Button.flashcard-nav__button.flashcard-nav__prev(round plain native-type="button" :disabled="isFirst" @click="prevCard")
        AppIcon(name="tabler:chevron-left" :width="22" :height="22")

      Button.flashcard-nav__button.flashcard-nav__flip(round plain native-type="button" @click="flipCard")
        span.flashcard-nav__flip-inner
          AppIcon(name="tabler:refresh" :width="18" :height="18")
          span {{ $t('flashcardScene.flip') }}

      Button.flashcard-nav__button.flashcard-nav__next(round plain native-type="button" :disabled="isLast" @click="nextCard")
        AppIcon(name="tabler:chevron-right" :width="22" :height="22")

  // How To Play Dialog
  HowToPlayDialog(:isOpen="dialog.howToPlay.isOpen" @closed="startGame")
</template>

<script>
import { defineComponent, useStore, useContext, ref, onMounted, onUnmounted, computed, watch } from '@nuxtjs/composition-api'
import { Button } from 'vant'

export default defineComponent({
  components: {
    Button
  },
  setup() {
    const store = useStore()
    const { $ua } = useContext()

    const rootRef = ref(null)

    const { setRootRef, dialog, startGame, handleBeforeUnload, scrollTop, checkUnsupportedHeight } = useGameScene()
    const { initGame, flipCard, nextCard, prevCard, currentCard, currentIndex, totalCards, isFlipped, isFirst, isLast } = useFlashcards()

    const room = computed(() => store.getters['creator/room'])

    const resetGame = () => {
      dialog.howToPlay.isOpen = true
      initGame(room.value?.flashcards || [])
    }

    watch(
      () => room.value,
      () => {
        resetGame()
      }
    )

    const handleKeydown = event => {
      if (event.key === 'ArrowLeft') {
        prevCard()
      } else if (event.key === 'ArrowRight') {
        nextCard()
      } else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        flipCard()
      }
    }

    onMounted(() => {
      setRootRef(rootRef.value)
      resetGame()

      window.addEventListener('keydown', handleKeydown)
      window.addEventListener('beforeunload', event => handleBeforeUnload(event))
      window.addEventListener('scroll', scrollTop)
      checkUnsupportedHeight()
    })

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeydown)
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
      dialog,
      startGame,
      resetGame,
      gameSceneClasses,
      flipCard,
      nextCard,
      prevCard,
      currentCard,
      currentIndex,
      totalCards,
      isFlipped,
      isFirst,
      isLast
    }
  }
})
</script>

<style lang="scss" src="./FlashcardGameScene.component.scss"></style>
