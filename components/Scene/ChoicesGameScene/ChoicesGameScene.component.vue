<template lang="pug">
.scene.game-scene.choices-game-scene(ref="rootRef" tabindex="1" :class="[gameSceneClasses]")
  // Scene Inner
  .scene__inner.game-scene__inner
    // Info header
    .room-info(:class="{ 'room-info--hostGear': party && isPartyHost }")
      .room-info__title {{ party ? partyGame.title : room.title }}
      span.room-info__round(v-if="party")
        AppIcon(name="tabler:users" :width="14" :height="14")
        span {{ partyTally.voters }}/{{ partyTally.total }}
      .room-info__round
        AppIcon(name="tabler:trophy" :width="14" :height="14")
        span(v-if="party") {{ partyRound.index + 1 }}/{{ partyRound.total }}
        span(v-else) {{ currentRound }}/{{ totalRounds }}
      //- party: per-round time left
      span.room-info__ring(v-if="party")
        svg(viewBox="0 0 36 36" aria-hidden="true")
          circle.room-info__ring-track(cx="18" cy="18" r="16")
          circle.room-info__ring-fill(cx="18" cy="18" r="16" pathLength="100" :stroke-dashoffset="100 - partyRemainFraction * 100")
        strong.room-info__ring-text {{ partyRemainSec }}

    // Party round: everyone votes, the majority decides (tie / no votes keep the champion)
    .versus-set.versus-set--party(v-if="party" :class="{ 'is-result': partyRoundEnd }")
      //- presentation mode: the cards are on the presenter's screen, players get two compact buttons
      .party-vote-buttons(v-if="isPartyCompact")
        button.party-vote-button(
          v-for="(item, i) in partySides"
          :key="item.side"
          type="button"
          :class="partyChoiceClasses(item.side)"
          @click="partyVote(item.side)"
        )
          span.party-vote-button__num {{ i + 1 }}
          span.party-vote-button__text {{ choiceLabel(item.choice, i) }}
          AppIcon(v-if="partyMySide === item.side" name="tabler:check" :width="20" :height="20")

      .versus-set__cards(v-else)
        .party-choice(
          v-for="(item, i) in partySides"
          :key="item.side"
          :class="[`party-choice--${item.side}`, partyChoiceClasses(item.side)]"
        )
          ChoiceCard(
            v-if="item.choice"
            backdrop
            :class="`choice-card--${item.side}`"
            :choice="item.choice"
            @click.native="partyVote(item.side)"
          )
          .party-choice__badges
            span.party-badge.party-badge--num {{ i + 1 }}
            //- round 1 has no winner yet, so nobody is champion
            span.party-badge(v-if="partyRound.index > 0" :class="{ 'party-badge--champion': item.isChampion }")
              AppIcon(:name="item.isChampion ? 'tabler:crown' : 'tabler:swords'" :width="12" :height="12")
              | {{ item.isChampion ? $t('party.choices.champion') : $t('party.choices.challenger') }}
            span.party-badge.party-badge--winner(v-if="partyRoundEnd && partyRoundEnd.winnerSide === item.side")
              AppIcon(name="tabler:trophy" :width="12" :height="12")
              | {{ $t('party.choices.winner') }}
            span.party-badge.party-badge--mine(v-if="partyMySide === item.side")
              AppIcon(name="tabler:check" :width="12" :height="12")
              | {{ $t('party.choices.mine') }}
          span.party-choice__count {{ partyTally[item.side] }}

        .versus-divider
          .versus-divider__badge
            span VS

      //- live vote bar (final tally once the round is over)
      .party-votes
        .party-votes__row
          span.party-votes__side.party-votes__side--left {{ partyPercent.left }}% · {{ partyTally.left }}
          span.party-votes__total {{ $tc('party.choices.votes', partyTally.left + partyTally.right) }}
          span.party-votes__side.party-votes__side--right {{ partyPercent.right }}% · {{ partyTally.right }}
        .party-votes__bar
          i.party-votes__fill.party-votes__fill--left(:style="{ width: `${partyPercent.left}%` }")
          i.party-votes__fill.party-votes__fill--right(:style="{ width: `${partyPercent.right}%` }")

      PartyRoundResult(v-if="partyRoundEnd" inline)
      .party-lock(v-else :class="{ 'party-lock--voted': partyMySide }")
        span.party-lock__icon
          AppIcon(:name="partyMySide ? 'tabler:lock' : 'tabler:hand-click'" :width="18" :height="18")
        .party-lock__text
          template(v-if="isPartyPresenter")
            strong {{ $t('party.choices.live') }}
          template(v-else-if="partyMySide")
            strong {{ partyVoteChanged ? $t('party.choices.changed') : $t('party.choices.locked') }}
            span · {{ $t('party.choices.canChange') }}
          template(v-else)
            strong {{ $t('party.choices.pick') }}
            span {{ $t('party.choices.pickSub') }}
        span.party-lock__count {{ $t('party.choices.voted', partyTally) }}

    // Game Layout
    .versus-set(v-else-if="!ultimateWinner")
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

  template(v-if="!party")
    // How To Play Dialog
    PlayIntroDialog(mode="creator" :isOpen="dialog.howToPlay.isOpen" @closed="startGame")
    // Interstitial Ad Dialog
    InterstitialAdDialog(:cancelButtonText="$t('gameScene.skipAdShowScore')" :isOpen="dialog.interstitialAd.isOpen")
</template>

<script>
import {
  defineComponent,
  useStore,
  useContext,
  useRoute,
  ref,
  onMounted,
  onUnmounted,
  computed,
  watch,
  inject
} from '@nuxtjs/composition-api'
import { Button } from 'vant'
import { APP_URL } from '@/system/constant'
import { choiceTypeEnum } from '@/enums/quiz.enum'
import { wsTypeEnum } from '@/enums/wsType.enum'
import { showToast } from '@/helpers/toast'

export default defineComponent({
  components: {
    Button
  },
  props: {
    // party room round: driven by store/party only; the solo game (useGameScene / useChoices, duel stats) never runs
    party: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const store = useStore()
    const { $ua, i18n, localePath } = useContext()
    const route = useRoute()
    const { postToNative } = useNativeBridge()

    const rootRef = ref(null)

    const { setRootRef, dialog, startGame, handleBeforeUnload, scrollTop, checkUnsupportedHeight } = props.party ? {} : useGameScene()
    const { initGame, selectChoice, choiceFirst, choiceSecond, isAnimating, selectedSide, ultimateWinner, choicesQueue } = props.party
      ? {}
      : useChoices()

    const creatorDialog = computed(() => store.getters['creator/dialog'])
    const room = computed(() => store.getters['creator/room'])
    const choices = computed(() => store.getters['creator/choices'])

    const resetGame = () => {
      dialog.howToPlay.isOpen = true
      initGame(choices.value || [])
    }

    if (!props.party) {
      watch(
        () => room.value,
        () => {
          resetGame()
        }
      )
    }

    // N choices → N-1 duels; the queue holds the choices not on screen yet
    const totalRounds = computed(() => Math.max((choices.value?.length || 0) - 1, 0))
    const currentRound = computed(() => totalRounds.value - (choicesQueue?.value.length || 0))

    // Party: the champion stays on the side it won from (duel.championSide); the challenger takes the other
    const partySend = inject('partySend', null)
    const partyGame = computed(() => store.getters['party/game'] || {})
    const partyRound = computed(() => store.state.party.round || { index: 0, total: 0, durationMs: 1, remainingMs: 0 })
    const partyRoundEnd = computed(() => (props.party ? store.state.party.roundEnd : null))
    const isPartyHost = computed(() => store.getters['party/isHost'])
    const isPartyPresenter = computed(() => props.party && store.getters['party/isPresenter'])
    const isPartyCompact = computed(() => Boolean(partyGame.value.presenterId) && !isPartyPresenter.value)
    const partySides = computed(() => {
      const duel = partyRound.value.duel || {}

      const champLeft = (duel.championSide || 'left') === 'left'

      return [
        { side: 'left', choice: champLeft ? duel.champion : duel.challenger, isChampion: champLeft },
        { side: 'right', choice: champLeft ? duel.challenger : duel.champion, isChampion: !champLeft }
      ]
    })

    // the vote just clicked shows at once; the server's echo (`mine`) covers reconnects.
    // After the round only the server counts (a late click it dropped must not show)
    const partyLocalVote = ref(null)
    const partyVoteChanged = ref(false)
    const partyMySide = computed(() => {
      const end = partyRoundEnd.value

      if (end) {
        if (end.mineWon === null || end.mineWon === undefined) return null

        return end.mineWon ? end.winnerSide : end.winnerSide === 'left' ? 'right' : 'left'
      }

      return partyLocalVote.value || store.state.party.votes?.mine || null
    })

    // no votes frame until someone votes: count who can vote from the room until then
    const partyTally = computed(() => {
      const presenterId = partyGame.value.presenterId
      const votes = store.state.party.votes || {}
      const end = partyRoundEnd.value
      const total = votes.total || store.getters['party/players'].filter(p => p.connected && p.id !== presenterId).length

      return {
        left: (end || votes).left || 0,
        right: (end || votes).right || 0,
        voters: votes.voters || 0,
        total
      }
    })
    const partyPercent = computed(() => {
      const { left, right } = partyTally.value
      const sum = left + right

      if (!sum) return { left: 0, right: 0 }

      const l = Math.round((left / sum) * 100)

      return { left: l, right: 100 - l }
    })

    const partyChoiceClasses = side => {
      const end = partyRoundEnd.value

      return {
        'is-mine': partyMySide.value === side,
        'is-winner': end && end.winnerSide === side,
        'is-out': end && end.winnerSide !== side
      }
    }

    const partyVote = side => {
      if (!props.party || partyRoundEnd.value || isPartyPresenter.value || !partySend || partyMySide.value === side) return

      if (partyMySide.value) partyVoteChanged.value = true
      partyLocalVote.value = side
      partySend(wsTypeEnum.PARTY_VOTE, { side })
    }

    const choiceLabel = (choice, index) => {
      if (choice?.choiceType === choiceTypeEnum.TEXT && choice.text) return choice.text

      return choice?.mediaNote || i18n.t('party.choices.option', { n: index + 1 })
    }

    const partyNow = ref(Date.now())
    let partyTicker = null

    const partyRemainMs = computed(() => {
      const round = partyRound.value

      if (partyRoundEnd.value) return 0

      return Math.max(0, round.remainingMs - (partyNow.value - (round.receivedAt || partyNow.value)))
    })
    const partyRemainSec = computed(() => Math.ceil(partyRemainMs.value / 1000))
    const partyRemainFraction = computed(() => Math.min(1, partyRemainMs.value / (partyRound.value.durationMs || 1)))

    if (props.party) {
      // new round (or reconnect snapshot): forget the last round's vote
      watch(
        () => store.state.party.round,
        () => {
          partyLocalVote.value = null
          partyVoteChanged.value = false
        }
      )
    }

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
      if (props.party) {
        partyTicker = setInterval(() => (partyNow.value = Date.now()), 250)

        return
      }

      setRootRef(rootRef.value)
      resetGame()

      window.addEventListener('beforeunload', handleBeforeUnload)
      window.addEventListener('scroll', scrollTop)
      checkUnsupportedHeight()
    })

    onUnmounted(() => {
      clearInterval(partyTicker)

      if (props.party) return

      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('scroll', scrollTop)
    })

    const gameSceneClasses = computed(() => {
      return {
        'game-scene--isMobileDevice': $ua.isFromMobilephone(),
        'choices-game-scene--party': props.party,
        'choices-game-scene--partyPresenter': isPartyPresenter.value
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
      ultimateWinner,
      partyGame,
      partyRound,
      partyRoundEnd,
      isPartyHost,
      isPartyPresenter,
      isPartyCompact,
      partySides,
      partyMySide,
      partyVoteChanged,
      partyTally,
      partyPercent,
      partyChoiceClasses,
      partyVote,
      choiceLabel,
      partyRemainSec,
      partyRemainFraction
    }
  }
})
</script>

<style lang="scss" src="./ChoicesGameScene.component.scss"></style>
