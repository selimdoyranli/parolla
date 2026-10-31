<template lang="pug">
//- under 2 players it only looks disabled, so a tap can still say why
Button.party-start-button(
  icon="play"
  round
  block
  :class="{ 'party-start-button--waiting': !hasPlayers }"
  :disabled="!canStart"
  @click="start"
)
  | {{ $t('party.lobby.start') }}
</template>

<script>
import { defineComponent, computed, inject, useContext, useStore } from '@nuxtjs/composition-api'
import { Button, Notify } from 'vant'
import { wsTypeEnum } from '@/enums/wsType.enum'

// Host-only start: next-game card on desktop, bottom dock on mobile
// same minimum the server enforces (parolla-ws gameLoop MIN_PLAYERS)
const MIN_PLAYERS = 2

export default defineComponent({
  components: { Button },
  setup() {
    const { i18n } = useContext()
    const store = useStore()
    const send = inject('partySend')
    const canStart = computed(() => store.getters['party/queue'].length > 0 && store.state.party.room.state === 'lobby')

    const hasPlayers = computed(() => store.getters['party/players'].length >= MIN_PLAYERS)

    const start = () => {
      if (!hasPlayers.value) {
        Notify({ message: i18n.t('party.lobby.minPlayers'), type: 'warning', duration: 2500 })

        return
      }

      send(wsTypeEnum.PARTY_START)
    }

    return { canStart, hasPlayers, start }
  }
})
</script>

<style lang="scss" src="./PartyStartButton.component.scss" scoped></style>
