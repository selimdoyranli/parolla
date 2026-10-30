<template lang="pug">
Button.party-start-button(icon="play" round block :disabled="!canStart" @click="start") {{ $t('party.lobby.start') }}
</template>

<script>
import { defineComponent, computed, inject, useStore } from '@nuxtjs/composition-api'
import { Button } from 'vant'
import { wsTypeEnum } from '@/enums/wsType.enum'

// Host-only start: next-game card on desktop, bottom dock on mobile
export default defineComponent({
  components: { Button },
  setup() {
    const store = useStore()
    const send = inject('partySend')
    const canStart = computed(() => store.getters['party/queue'].length > 0 && store.state.party.room.state === 'lobby')

    const start = () => send(wsTypeEnum.PARTY_START)

    return { canStart, start }
  }
})
</script>

<style lang="scss" src="./PartyStartButton.component.scss" scoped></style>
