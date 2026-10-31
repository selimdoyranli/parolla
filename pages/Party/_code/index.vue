<template lang="pug">
.page.party-page(:class="{ 'party-page--game': isGame }")
  PartyLoginGate(v-if="isNew && !loggedIn")
  CreateGuestDrawerDialog(v-else-if="needsGuest && !guestReady" no-socket :title="$t('party.guest.title')" @close="guestReady = true")
  //- the socket-using child only mounts once identity is settled (guests send it in the connect URL)
  PartyRoomSession(v-else-if="!needsGuest || guestReady" :code="code" :quiz="quiz")
    //- phase switch: QA game | choices game | lobby. Final / cancelled never read `round` (a reconnect there gets none)
    .party-game(v-if="isGame" :class="{ 'party-game--choices': isChoicesGame }")
      PartyCancelled(v-if="cancelled")
      PartyFinalResults(v-else-if="final")
      template(v-else)
        CreatorModeGameScene(v-if="isQaGame && round" party)
        //- choices shows its round result inside the scene, under the cards
        ChoicesGameScene(v-else-if="isChoicesGame && round" party)
        //- choices shows it inline; a reconnect during the result gets no round, so it falls back to the overlay
        PartyRoundResult(v-if="roundEnd && (isQaGame || !round)")
      PartyEmojiReactions
      //- before each game's first round: the solo creator reveal, then 3-2-1-GO (the server holds the round for both)
      transition(name="quiz-intro-splash-fade")
        QuizIntroSplash(v-if="isRevealVisible" :room="revealRoom" :playing="isRevealPlaying")
      StartCountdown(:value="startCountdown")
      button.party-game__settings(v-if="isHost" type="button" :aria-label="$t('party.game.settings')" @click="isHostSheetOpen = true")
        AppIcon(name="tabler:settings" :width="18" :height="18")
      PartyHostSheet(v-if="isHost" v-model="isHostSheetOpen")

    //- mobile: one column in reading order (the row wrapper is display: contents); tablet up: full-width cards,
    //- settings + players side by side, chat in tour's fixed ChatPanel
    .party-lobby(v-else)
      PartyHeader.party-lobby__header
      PartyNextGameCard.party-lobby__next(@open-remote="isRemoteOpen = true")
      PartyQueue.party-lobby__queue(@add-game="isAddGameOpen = true")
      PartyCodeCard.party-lobby__code
      .party-lobby__row
        PartySettings.party-lobby__settings(v-if="isHost")
        PartyPlayerList.party-lobby__players
      ChatPanel.party-lobby__chat(:title="`${$t('chat.chat')} (${playerCount})`")
        PartyChat
      .party-lobby__dock
        PartyChat(compact)
        PartyStartButton(v-if="isHost")
      PartyAddGameDialog(v-if="isHost" v-model="isAddGameOpen")
      PartyRemoteDialog(v-if="isHost" v-model="isRemoteOpen")
</template>

<script>
import {
  defineComponent,
  ref,
  computed,
  watch,
  onBeforeUnmount,
  useContext,
  useRouter,
  useRoute,
  useStore,
  useMeta
} from '@nuxtjs/composition-api'
import { Howl } from 'howler'
import { quizTypeEnum, questionTypeEnum } from '@/enums/quiz.enum'

export default defineComponent({
  // keep the same instance when `/party/new` is replaced by the real code, so the socket/room survive
  key: 'party-room',
  layout: 'Default/Default.layout',
  setup() {
    const { app, i18n, localePath } = useContext()
    // private rooms: never indexed (the /party landing is the page that ranks)
    useMeta(() => ({
      title: `${i18n.t('seo.partyRoom.title')} - ${i18n.t('seo.main.title')}`,
      meta: [
        { hid: 'description', name: 'description', content: i18n.t('seo.partyRoom.description') },
        { hid: 'og:title', name: 'og:title', content: `${i18n.t('seo.partyRoom.title')} - ${i18n.t('seo.main.title')}` },
        { hid: 'og:description', name: 'og:description', content: i18n.t('seo.partyRoom.description') },
        { hid: 'twitter:description', name: 'twitter:description', content: i18n.t('seo.partyRoom.description') },
        { hid: 'robots', name: 'robots', content: 'noindex,nofollow' }
      ]
    }))

    const router = useRouter()
    const route = useRoute()
    const store = useStore()
    const code = computed(() => route.value.params.code)
    const quiz = computed(() => route.value.query.quiz || '')
    const isNew = computed(() => code.value === 'new')
    const loggedIn = computed(() => Boolean(app.$auth.loggedIn))
    const needsGuest = computed(() => !isNew.value && !loggedIn.value)
    const guestReady = ref(false)
    const isAddGameOpen = ref(false)
    const isRemoteOpen = ref(false)
    const isHost = computed(() => store.getters['party/isHost'])
    const isHostSheetOpen = ref(false)
    const playerCount = computed(() => store.getters['party/players'].length)

    if (isNew.value && !quiz.value) router.replace(localePath({ name: 'Party' }))

    const game = computed(() => store.getters['party/game'])
    const round = computed(() => store.state.party.round)
    const roundEnd = computed(() => store.state.party.roundEnd)
    const final = computed(() => store.state.party.final)
    const cancelled = computed(() => store.state.party.cancelled)
    const isQaGame = computed(() => game.value?.quizType === quizTypeEnum.QA)
    const isChoicesGame = computed(() => game.value?.quizType === quizTypeEnum.CHOICES)
    const isGame = computed(() => isQaGame.value || isChoicesGame.value)

    // same reveal, steps, timings and sounds as the solo creator start (useGameScene: 200 ms + 2800 ms reveal, then
    // 3-2-1-GO); the server's START_MS holds round 1 for all of it
    const sfx = useSfx()
    usePartySfx()
    const startCountdown = ref(null)
    const isRevealVisible = ref(false)
    const isRevealPlaying = ref(false)
    let startTimer = null
    let revealTimers = []
    let revealSound = null

    const revealRoom = computed(() => {
      const g = game.value || {}

      return { roomId: g.roomId, title: g.title, description: g.description, coverPhoto: g.coverPhoto, user: g.creator, isAnon: !g.creator }
    })

    const stopStart = () => {
      clearInterval(startTimer)
      revealTimers.forEach(clearTimeout)
      revealTimers = []
      startCountdown.value = null
      isRevealVisible.value = false
      isRevealPlaying.value = false
    }

    const runCountdown = () => {
      const steps = [3, 2, 1, 'GO']
      const showStep = () => {
        startCountdown.value = steps.shift() || null

        if (startCountdown.value) sfx.play(startCountdown.value === 'GO' ? 'success' : 'ping')
        else clearInterval(startTimer)
      }

      showStep()
      startTimer = setInterval(showStep, 1000)
    }

    watch(
      () => game.value?.phase === 'countdown',
      on => {
        stopStart()

        if (!on || process.server) return

        if (!revealSound) revealSound = new Howl({ src: ['/sound/fx/quiz-intro.wav'] })

        revealSound.mute(!store.getters['app/isActiveGameSceneSoundFx'])
        isRevealVisible.value = true
        revealTimers = [
          setTimeout(() => {
            isRevealPlaying.value = true
            revealSound.play()
          }, 200),
          setTimeout(() => {
            isRevealVisible.value = false
            isRevealPlaying.value = false
            runCountdown()
          }, 3000)
        ]
      },
      { immediate: true }
    )

    // CreatorModeGameScene reads the creator store: give it this round's question at its index (no answer in it;
    // the server checks), the round letter for the letter rule and placeholder, and the quiz meta it styles by
    let creatorFed = false

    watch(
      round,
      value => {
        if (!value || !value.question || !isQaGame.value) return

        const { index, total, question } = value

        store.commit('creator/SET_ROOM', {
          title: game.value.title,
          quizType: quizTypeEnum.QA,
          hasMedia: question.questionType === questionTypeEnum.MEDIA
        })
        // a finished solo quiz leaves isGameOver true, which makes handleAnswer drop every party answer
        store.commit('creator/SET_IS_GAME_OVER', { isGameOver: false })
        store.commit('creator/SET_QUESTIONS', { questions: Array.from({ length: total }, (_, i) => (i === index ? question : {})) })
        store.commit(
          'creator/SET_ALPHABET_ITEMS',
          Array.from({ length: total }, (_, i) => (i === index ? question.letter || '' : ''))
        )
        store.commit('creator/SET_ALPHABET_ACTIVE_INDEX', index)
        creatorFed = true
      },
      { immediate: true }
    )

    // Review Focus 5: a solo creator quiz after the party must start from a clean creator store
    const resetCreator = () => {
      if (!creatorFed) return

      store.commit('creator/SET_IS_GAME_OVER', { isGameOver: false })
      store.commit('creator/SET_QUESTIONS', { questions: [] })
      store.commit('creator/SET_ALPHABET_ITEMS', [])
      store.commit('creator/SET_ALPHABET_ACTIVE_INDEX', 0)
      store.commit('creator/SET_ROOM', {})
      creatorFed = false
    }

    watch(isGame, value => {
      if (value) return

      resetCreator()
      isHostSheetOpen.value = false
    })

    onBeforeUnmount(() => {
      resetCreator()
      stopStart()
    })

    return {
      code,
      quiz,
      isNew,
      loggedIn,
      needsGuest,
      guestReady,
      isAddGameOpen,
      isRemoteOpen,
      isHost,
      isHostSheetOpen,
      playerCount,
      round,
      roundEnd,
      final,
      cancelled,
      isQaGame,
      isChoicesGame,
      isGame,
      startCountdown,
      isRevealVisible,
      isRevealPlaying,
      revealRoom
    }
  },
  head: {}
})
</script>

<style lang="scss" scoped>
.party-page {
  padding: 12px 12px 0;

  @include media-breakpoint-up(desktop) {
    padding: 16px;
  }

  // the scene lays itself out against the viewport, like on the solo quiz page
  &--game {
    min-height: 100%;
    padding: 0;
  }
}

.party-game {
  position: relative;
  min-height: calc(var(--layout-height) - var(--header-height));

  &__settings {
    position: absolute;
    top: 10px;
    right: 12px;
    z-index: 6;
    display: grid;
    width: 36px;
    height: 36px;
    padding: 0;
    color: var(--color-text-02);
    background: var(--color-ui-02);
    border: 1px solid var(--color-border-02);
    border-radius: 50%;
    cursor: pointer;
    place-items: center;
  }

  // choices: the gear sits inside the scene's info bar
  &--choices &__settings {
    top: 2px;
    width: 32px;
    height: 32px;
  }
}

.party-lobby {
  display: flex;
  flex-direction: column;
  gap: 10px;

  // mobile reading order: header, code, next game, players, queue, settings
  &__row {
    display: contents;
  }

  &__header {
    order: 0;
  }

  &__code {
    order: 1;
  }

  &__next {
    order: 2;
  }

  &__players {
    order: 3;
  }

  &__queue {
    order: 4;
  }

  &__settings {
    order: 5;
  }

  // tour's ChatPanel as is (same width, place and breakpoint); phones use the dock's chat bar
  &__chat {
    @include media-breakpoint-down(tablet) {
      display: none;
    }
  }

  &__dock {
    position: sticky;
    bottom: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 8px;
    order: 6;
    margin: 0 -12px;
    padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
    background: var(--color-ui-02);
    border-top: 1px solid var(--color-border-02);
  }

  // tablet up: cards in DOM order at full column width, settings + players share a row (wrapping when narrow)
  @include media-breakpoint-up(tablet) {
    gap: 12px;
    // room for the collapsed chat bar over the last row
    padding-bottom: 42px;

    &__header,
    &__code,
    &__next,
    &__players,
    &__queue,
    &__settings {
      order: 0;
    }

    &__row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: flex-start;
    }

    &__settings {
      flex: 1 1 340px;
      min-width: 0;
    }

    &__players {
      flex: 1 1 260px;
      min-width: 0;
    }

    &__dock {
      display: none;
    }
  }
}
</style>
