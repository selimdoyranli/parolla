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
      //- 3-2-1-GO before each game's first round (the server holds the round for it)
      StartCountdown(:value="startCountdown")
      button.party-game__settings(v-if="isHost" type="button" :aria-label="$t('party.game.settings')" @click="isHostSheetOpen = true")
        AppIcon(name="tabler:settings" :width="18" :height="18")
      PartyHostSheet(v-if="isHost" v-model="isHostSheetOpen")

    //- mobile: one column in reading order (main/side wrappers are display: contents); desktop: main / side, chat fixed like tour
    .party-lobby(v-else)
      PartyHeader.party-lobby__header
      .party-lobby__main
        PartyCodeCard.party-lobby__code
        PartyNextGameCard.party-lobby__next(@open-remote="isRemoteOpen = true")
        PartyQueue.party-lobby__queue(@add-game="isAddGameOpen = true")
        PartySettings.party-lobby__settings(v-if="isHost")
      .party-lobby__side
        PartyPlayerList.party-lobby__players
      ChatPanel.party-lobby__chat(:title="$t('party.lobby.chat.title')")
        PartyChat(headless)
      .party-lobby__dock
        PartyChat(compact)
        PartyStartButton(v-if="isHost")
      PartyAddGameDialog(v-if="isHost" v-model="isAddGameOpen")
      PartyRemoteDialog(v-if="isHost" v-model="isRemoteOpen")
</template>

<script>
import { defineComponent, ref, computed, watch, onBeforeUnmount, useContext, useRouter, useRoute, useStore } from '@nuxtjs/composition-api'
import { quizTypeEnum, questionTypeEnum } from '@/enums/quiz.enum'

export default defineComponent({
  // keep the same instance when `/party/new` is replaced by the real code, so the socket/room survive
  key: 'party-room',
  layout: 'Default/Default.layout',
  setup() {
    const { app, localePath } = useContext()
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

    if (isNew.value && !quiz.value) router.replace(localePath({ name: 'Party' }))

    const game = computed(() => store.getters['party/game'])
    const round = computed(() => store.state.party.round)
    const roundEnd = computed(() => store.state.party.roundEnd)
    const final = computed(() => store.state.party.final)
    const cancelled = computed(() => store.state.party.cancelled)
    const isQaGame = computed(() => game.value?.quizType === quizTypeEnum.QA)
    const isChoicesGame = computed(() => game.value?.quizType === quizTypeEnum.CHOICES)
    const isGame = computed(() => isQaGame.value || isChoicesGame.value)

    // same steps and sounds as the solo start countdown (useGameScene)
    const sfx = useSfx()
    const startCountdown = ref(null)
    let startTimer = null

    watch(
      () => game.value?.phase === 'countdown',
      on => {
        clearInterval(startTimer)
        startCountdown.value = null

        if (!on) return

        const steps = [3, 2, 1, 'GO']
        const showStep = () => {
          startCountdown.value = steps.shift() || null

          if (startCountdown.value) sfx.play(startCountdown.value === 'GO' ? 'success' : 'ping')
          else clearInterval(startTimer)
        }

        showStep()
        startTimer = setInterval(showStep, 1000)
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
      clearInterval(startTimer)
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
      round,
      roundEnd,
      final,
      cancelled,
      isQaGame,
      isChoicesGame,
      isGame,
      startCountdown
    }
  }
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
  &__main,
  &__side {
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

  // tour's ChatPanel, sized to the right ad rail it sits over; narrower screens use the dock's chat bar
  &__chat {
    @include media-breakpoint-down(wide) {
      display: none;
    }

    right: 8px;
    width: calc((100vw - var(--layout-max-width)) / 2 - 16px);
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

  @include media-breakpoint-up(desktop) {
    display: grid;
    grid-template-areas:
      'header header'
      'main side';
    grid-template-columns: minmax(0, 1fr) 260px;
    gap: 12px;
    align-items: start;

    &__header {
      grid-area: header;
    }

    &__main,
    &__side {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    &__main {
      grid-area: main;
    }

    &__side {
      grid-area: side;
    }

    &__dock {
      display: none;
    }
  }

  // between desktop and wide there is no rail for the chat panel: keep the dock, only for its chat bar
  @include media-breakpoint-between(desktop, wide) {
    &__dock {
      display: flex;
      grid-column: 1 / -1;
      margin: 0 -16px;

      .party-start-button {
        display: none;
      }
    }
  }
}
</style>
