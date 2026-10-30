<template lang="pug">
.page.party-page
  PartyLoginGate(v-if="isNew && !loggedIn")
  CreateGuestDrawerDialog(v-else-if="needsGuest && !guestReady" no-socket :title="$t('party.guest.title')" @close="guestReady = true")
  //- the socket-using child only mounts once identity is settled (guests send it in the connect URL)
  PartyRoomSession(v-else-if="!needsGuest || guestReady" :code="code" :quiz="quiz")
    //- mobile: one column in reading order (main/side wrappers are display: contents); desktop: main / side / chat
    .party-lobby
      PartyHeader.party-lobby__header
      .party-lobby__main
        PartyNextGameCard.party-lobby__next(@open-remote="isRemoteOpen = true")
        PartyQueue.party-lobby__queue(@add-game="isAddGameOpen = true")
        PartySettings.party-lobby__settings(v-if="isHost")
      .party-lobby__side
        PartyCodeCard.party-lobby__code
        PartyPlayerList.party-lobby__players
      PartyChat.party-lobby__chat
      .party-lobby__dock
        PartyChat(compact)
        PartyStartButton(v-if="isHost")
      PartyAddGameDialog(v-if="isHost" v-model="isAddGameOpen")
      //- isRemoteOpen -> remote dialog (Task 14)
</template>

<script>
import { defineComponent, ref, computed, useContext, useRouter, useRoute, useStore } from '@nuxtjs/composition-api'

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

    if (isNew.value && !quiz.value) router.replace(localePath({ name: 'Party' }))

    return { code, quiz, isNew, loggedIn, needsGuest, guestReady, isAddGameOpen, isRemoteOpen, isHost }
  }
})
</script>

<style lang="scss" scoped>
.party-page {
  padding: 12px 12px 0;

  @include media-breakpoint-up(desktop) {
    padding: 16px;
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

  &__chat {
    display: none;
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
      'header header chat'
      'main side chat';
    grid-template-rows: auto 1fr;
    grid-template-columns: minmax(0, 1fr) minmax(260px, 320px) minmax(260px, 320px);
    gap: 16px;
    align-items: start;

    &__header {
      grid-area: header;
    }

    &__main,
    &__side {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    &__main {
      grid-area: main;
    }

    &__side {
      grid-area: side;
    }

    &__chat {
      position: sticky;
      top: 0;
      display: block;
      grid-area: chat;
      height: calc(var(--layout-height) - var(--header-height) - 32px);
    }

    &__dock {
      display: none;
    }
  }
}
</style>
