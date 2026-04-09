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

    // Watchlist progress labels
    .watchlist-labels(v-if="isWatchlistActive && !isWatchlistComplete")
      .watchlist-labels__item.watchlist-labels__item--still-progress
        AppIcon(name="tabler:x" :width="14" :height="14")
        span {{ $t('flashcardScene.more.watchlist.stillProgress') }}: {{ stillProgressCount }}
      .watchlist-labels__item.watchlist-labels__item--in-memory
        AppIcon(name="tabler:check" :width="14" :height="14")
        span {{ $t('flashcardScene.more.watchlist.inMemory') }}: {{ inMemoryCount }}

    // Card area
    .flashcard-area(v-if="currentCard && !isWatchlistComplete")
      .flashcard-wrapper(:class="cardAnimation" @click="flipCard")
        .flashcard(:key="currentIndex" :class="{ 'is-flipped': isFlipped }")
          .flashcard__face.flashcard__front
            .flashcard__label {{ $t('flashcardScene.front') }}
            .flashcard__text {{ currentCard.cardFrontText }}
          .flashcard__face.flashcard__back
            .flashcard__label {{ $t('flashcardScene.back') }}
            .flashcard__text {{ currentCard.cardBackText }}

      // Tap hint
      p.flashcard-area__hint(v-show="false") {{ $t('flashcardScene.tapToFlip') }}

    // Watchlist complete
    .watchlist-complete(v-if="isWatchlistActive && isWatchlistComplete")
      AppIcon(name="tabler:circle-check" color="var(--color-success-01)" :width="64" :height="64")
      p.watchlist-complete__text {{ $t('flashcardScene.more.watchlist.complete') }}
      .watchlist-complete__stats
        span {{ $t('flashcardScene.more.watchlist.inMemory') }}: {{ inMemoryCount }}
      Button(type="info" plain round native-type="button" @click="resetGame") {{ $t('general.playAgain') }}

    // Navigation
    .flashcard-nav(v-if="!isWatchlistComplete")
      Button.flashcard-nav__button.flashcard-nav__prev(
        v-if="!isWatchlistActive"
        round
        plain
        native-type="button"
        :disabled="isFirst"
        @click="prevCard"
      )
        AppIcon(name="tabler:chevron-left" :width="22" :height="22")

      // Watchlist: cross (left of flip)
      Button.flashcard-nav__button.flashcard-nav__watchlist-btn.flashcard-nav__watchlist-btn--cross(
        v-if="isWatchlistActive"
        round
        plain
        native-type="button"
        @click="markStillProgress"
      )
        AppIcon(name="tabler:x" :width="18" :height="18")

      Button.flashcard-nav__button.flashcard-nav__flip(round plain native-type="button" @click="flipCard")
        span.flashcard-nav__flip-inner
          AppIcon(name="tabler:refresh" :width="18" :height="18")
          span {{ $t('flashcardScene.flip') }}

      // Watchlist: check (right of flip)
      Button.flashcard-nav__button.flashcard-nav__watchlist-btn.flashcard-nav__watchlist-btn--check(
        v-if="isWatchlistActive"
        round
        plain
        native-type="button"
        @click="markInMemory"
      )
        AppIcon(name="tabler:check" :width="18" :height="18")

      Button.flashcard-nav__button.flashcard-nav__next(
        v-if="!isWatchlistActive"
        round
        plain
        native-type="button"
        :disabled="isLast"
        @click="nextCard"
      )
        AppIcon(name="tabler:chevron-right" :width="22" :height="22")

    // More button
    .flashcard-more(v-if="!isWatchlistComplete")
      Button.flashcard-more__button(round plain size="small" native-type="button" @click="isMoreSheetOpen = true")
        AppIcon(name="tabler:dots" :width="16" :height="16")
        span {{ $t('flashcardScene.more.title') }}

  // How To Play Dialog
  HowToPlayDialog(:isOpen="dialog.howToPlay.isOpen" @closed="startGame")

  // More Options ActionSheet
  ActionSheet(v-model="isMoreSheetOpen" :overlay="false" :title="$t('flashcardScene.more.title')")
    template(#default)
      .flashcard-options
        Cell.flashcard-options__item(:title="$t('flashcardScene.more.shuffle.label')")
          template(#right-icon)
            VanSwitch(:value="isShuffled" :size="24" @input="toggleShuffle")
        Cell.flashcard-options__item(:title="$t('flashcardScene.more.watchlist.label')")
          template(#right-icon)
            VanSwitch(:value="isWatchlistActive" :size="24" @input="toggleWatchlist")
</template>

<script>
import { defineComponent, useStore, useContext, ref, onMounted, onUnmounted, computed, watch } from '@nuxtjs/composition-api'
import { Button, ActionSheet, Cell, Switch } from 'vant'

export default defineComponent({
  components: {
    Button,
    ActionSheet,
    Cell,
    VanSwitch: Switch
  },
  setup() {
    const store = useStore()
    const { $ua } = useContext()

    const rootRef = ref(null)
    const isMoreSheetOpen = ref(false)

    const { setRootRef, dialog, startGame, handleBeforeUnload, scrollTop, checkUnsupportedHeight } = useGameScene()
    const {
      initGame,
      flipCard,
      nextCard,
      prevCard,
      currentCard,
      currentIndex,
      totalCards,
      isFlipped,
      isFirst,
      isLast,
      isShuffled,
      toggleShuffle,
      isWatchlistActive,
      isWatchlistComplete,
      stillProgressCount,
      inMemoryCount,
      toggleWatchlist,
      markStillProgress,
      markInMemory,
      cardAnimation,
      isAnimating
    } = useFlashcards()

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
      if (event.key === 'ArrowLeft' && !isWatchlistActive.value) {
        prevCard()
      } else if (event.key === 'ArrowRight' && !isWatchlistActive.value) {
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
      isLast,
      isMoreSheetOpen,
      isShuffled,
      toggleShuffle,
      isWatchlistActive,
      isWatchlistComplete,
      stillProgressCount,
      inMemoryCount,
      toggleWatchlist,
      markStillProgress,
      markInMemory,
      cardAnimation,
      isAnimating
    }
  }
})
</script>

<style lang="scss" src="./FlashcardGameScene.component.scss"></style>
