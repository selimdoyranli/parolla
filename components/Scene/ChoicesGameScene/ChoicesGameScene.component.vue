<template lang="pug">
.scene.game-scene.choices-game-scene(ref="rootRef" tabindex="1" :class="[gameSceneClasses]")
  // Scene Inner
  .scene__inner.game-scene__inner
    // Info header
    .room-info
      .room-info__title {{ room.title }}
      .room-info__round
        AppIcon(name="tabler:trophy" :width="14" :height="14")
        span {{ currentRound }}/{{ totalRounds }}

    // Game Layout
    .versus-set(v-if="!ultimateWinner")
      // Left Choice
      ChoiceCard.choice-card--left(
        v-if="choiceFirst"
        backdrop
        :choice="choiceFirst"
        :class="{ 'is-selected': selectedSide === 'left', 'is-loser': selectedSide === 'right' }"
        @click.native="selectChoice('left')"
      )

      // Divider: VS badge in the middle, brand at the right end of the line
      .versus-divider(:class="{ 'is-hidden': selectedSide }")
        .versus-divider__badge
          span VS
        span.versus-divider__brand
          img(src="/img/core/logo.webp" alt draggable="false" width="16" height="16")
          | parolla

      // Right Choice
      ChoiceCard.choice-card--right(
        v-if="choiceSecond"
        backdrop
        :choice="choiceSecond"
        :class="{ 'is-selected': selectedSide === 'right', 'is-loser': selectedSide === 'left' }"
        @click.native="selectChoice('right')"
      )

    // Winner Layout
    .winner-layout(v-else)
      .winner-hero
        h1.winner-hero__room {{ room.title }}
        .winner-hero__kicker 🎉 {{ $t('choices.winner.title') }} 🎉
        ChoiceCard.choice-card--winner(:choice="ultimateWinner")

      .winner-panel.winner-rate
        h3.winner-panel__title {{ $t('choices.winner.rate.title') }}
        RoomReviewView(rating-only)
        small.winner-rate__hint {{ $t('choices.winner.rate.hint') }}

      Button.winner-layout__replay(icon="replay" round @click="resetGame") {{ $t('general.playAgain') }}

      WinnerChoiceList.winner-panel(v-if="room.winnerChoices?.length > 0" :items="room.winnerChoices")

      Button.winner-layout__share(icon="share-o" round icon-position="right" @click="shareWinner")
        | {{ $t('general.share').toLocaleUpperCase($i18n.locale) }}

      .winner-panel
        RoomReviewView(comments-only)

  // How To Play Dialog
  PlayIntroDialog(mode="creator" :isOpen="dialog.howToPlay.isOpen" @closed="startGame")
  // Interstitial Ad Dialog
  InterstitialAdDialog(:cancelButtonText="$t('gameScene.skipAdShowScore')" :isOpen="dialog.interstitialAd.isOpen")
</template>

<script>
import { defineComponent, useStore, useContext, useRoute, ref, onMounted, onUnmounted, computed, watch } from '@nuxtjs/composition-api'
import { Button } from 'vant'
import { APP_URL } from '@/system/constant'
import { choiceTypeEnum } from '@/enums/quiz.enum'
import { showToast } from '@/helpers/toast'

export default defineComponent({
  components: {
    Button
  },
  setup() {
    const store = useStore()
    const { $ua, i18n, localePath } = useContext()
    const route = useRoute()
    const { postToNative } = useNativeBridge()

    const rootRef = ref(null)

    const { setRootRef, dialog, startGame, handleBeforeUnload, scrollTop, checkUnsupportedHeight } = useGameScene()
    const { initGame, selectChoice, choiceFirst, choiceSecond, isAnimating, selectedSide, ultimateWinner, choicesQueue } = useChoices()

    const creatorDialog = computed(() => store.getters['creator/dialog'])
    const room = computed(() => store.getters['creator/room'])
    const choices = computed(() => store.getters['creator/choices'])

    const resetGame = () => {
      dialog.howToPlay.isOpen = true
      initGame(choices.value || [])
    }

    watch(
      () => room.value,
      () => {
        resetGame()
      }
    )

    // N choices → N-1 duels; the queue holds the choices not on screen yet
    const totalRounds = computed(() => Math.max((choices.value?.length || 0) - 1, 0))
    const currentRound = computed(() => totalRounds.value - choicesQueue.value.length)

    const shareWinner = async () => {
      const winner = ultimateWinner.value
      const winnerName = winner?.choiceType === choiceTypeEnum.TEXT ? winner.text : winner?.mediaNote
      const shareText = i18n.t(winnerName ? 'sharer.choices.description' : 'sharer.choices.descriptionNoWinner', {
        roomTitle: room.value.title,
        winner: winnerName,
        url: `${APP_URL}${localePath({ name: 'CreatorMode-CreatorModeRoom-slug', params: { slug: route.value.params.slug } })}`
      })

      postToNative('sharer', shareText)

      try {
        await navigator.clipboard.writeText(shareText)
        await showToast.default(i18n.t('dialog.stats.clipboard.score.callback.success'))
        await navigator.share({
          title: 'parolla',
          text: shareText
        })
      } catch {
        await navigator.clipboard.writeText(shareText)
        await showToast.default(i18n.t('dialog.stats.clipboard.score.callback.success'))
      }
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
      totalRounds,
      currentRound,
      shareWinner,
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
