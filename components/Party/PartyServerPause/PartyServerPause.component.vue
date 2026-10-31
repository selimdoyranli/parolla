<template lang="pug">
//- server restart / redeploy: covers the room until the socket is back and a frozen game resumes on its own
transition(name="party-server-pause-fade")
  .party-server-pause(v-if="visible" role="alertdialog" aria-live="assertive" :aria-label="$t('party.serverPause.title')")
    .party-server-pause__card
      Loading.party-server-pause__spinner(type="spinner" color="var(--color-brand-02)" size="36")
      strong.party-server-pause__title {{ $t('party.serverPause.title') }}
      p.party-server-pause__text {{ $t(inGame ? 'party.serverPause.game' : 'party.serverPause.lobby') }}
</template>

<script>
import { defineComponent, computed, useStore } from '@nuxtjs/composition-api'
import { Loading } from 'vant'

export default defineComponent({
  components: { Loading },
  props: {
    // usePartySocket's reconnect status: 'restarting' = the server closed us for a restart
    status: { type: String, default: null }
  },
  setup(props) {
    const store = useStore()
    const room = computed(() => store.state.party.room)
    // restored rooms come back paused until their players are back (the server resumes the game itself)
    const visible = computed(() => props.status === 'restarting' || Boolean(room.value?.paused))
    const inGame = computed(() => Boolean(room.value?.game))

    return { visible, inGame }
  }
})
</script>

<style lang="scss" src="./PartyServerPause.component.scss" scoped></style>
