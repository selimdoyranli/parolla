<template lang="pug">
//- host cancelled: covers the game until the server sends everyone back to the lobby (reads only store.cancelled)
.party-cancelled(role="alertdialog" aria-live="assertive")
  .party-cancelled__inner
    span.party-cancelled__icon
      AppIcon(name="tabler:x" :width="26" :height="26")
    h2.party-cancelled__title {{ $t('party.cancelled.title') }}
    p.party-cancelled__text {{ $t('party.cancelled.text') }}
    PartyLobbyCountdown(:lobby-in-ms="lobbyInMs")
</template>

<script>
import { defineComponent, computed, useStore } from '@nuxtjs/composition-api'

export default defineComponent({
  setup() {
    const store = useStore()
    const lobbyInMs = computed(() => store.state.party.cancelled?.lobbyInMs ?? null)

    return { lobbyInMs }
  }
})
</script>

<style lang="scss" src="./PartyCancelled.component.scss" scoped></style>
