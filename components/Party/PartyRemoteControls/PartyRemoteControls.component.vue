<template lang="pug">
.party-remote
  .party-remote__state(v-if="errorKey || closedReason")
    AppIcon(name="tabler:alert-circle" :width="28" :height="28")
    p {{ $t(errorKey || 'party.closed.empty') }}
    Button(round size="small" @click="back") {{ $t('party.remote.back') }}

  p.party-remote__state(v-else-if="!room") {{ $t('party.room.connecting') }}

  template(v-else)
    header.party-remote__head
      span.party-remote__code {{ $t('party.remote.room', { code: prettyCode }) }}
      strong.party-remote__phase {{ phaseLabel }}
      small(v-if="game") {{ game.title }}

    Button(v-if="!game" icon="arrow" round block :disabled="!queue.length" @click="send('party_start')") {{ $t('party.lobby.start') }}
    template(v-else)
      Button.party-remote__next(icon="arrow" round block :disabled="game.phase !== 'result'" @click="send('party_next')") {{ $t('party.game.next') }}
      .party-remote__row
        .party-remote__text
          strong {{ $t('party.game.autoAdvance') }}
          small {{ $t('party.game.autoAdvanceSub') }}
        VanSwitch(:value="autoAdvance" size="20px" active-color="var(--color-brand-02)" @input="setAuto")
      button.party-remote__cancel(type="button" @click="cancel")
        AppIcon(name="tabler:circle-off" :width="16" :height="16")
        | {{ $t('party.game.cancel') }}

    section.party-remote__queue
      strong {{ $t('party.remote.queue') }}
      ol(v-if="queue.length")
        li(v-for="(item, index) in queue" :key="`${item.roomId}-${index}`")
          span {{ index + 1 }}
          em {{ item.title }}
      small(v-else) {{ $t('party.remote.empty') }}
</template>

<script>
import { defineComponent, computed, useStore, useContext, useRouter, useRoute, onBeforeUnmount } from '@nuxtjs/composition-api'
import { Switch, Button, Dialog } from 'vant'
import { usePartySocket } from '@/composables/usePartySocket'
import { wsTypeEnum } from '@/enums/wsType.enum'

// Host phone remote: same frames as the in-game host sheet, never shows question content
export default defineComponent({
  components: { VanSwitch: Switch, Button },
  props: { code: { type: String, required: true } },
  setup(props) {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()
    const { i18n, localePath } = useContext()
    const { send } = usePartySocket({ remote: true })

    const room = computed(() => store.state.party.room)
    const game = computed(() => store.getters['party/game'])
    const queue = computed(() => store.getters['party/queue'])
    const autoAdvance = computed(() => Boolean(store.getters['party/settings'].autoAdvance))
    const closedReason = computed(() => store.state.party.closedReason)
    const prettyCode = computed(() => `${props.code.slice(0, 3)} ${props.code.slice(3)}`)
    // login_required / not_host / room_not_found, anything else is a toast only. Also while a room is held:
    // not_host = host handed off, room_not_found = failed rejoin; both leave the remote with stale controls.
    const errorKey = computed(() => {
      const code = store.state.party.error && store.state.party.error.code
      const map = { login_required: 'loginNotice', not_host: 'notHost', room_not_found: 'notFound' }

      return map[code] ? `party.remote.${map[code]}` : ''
    })
    const phaseLabel = computed(() => {
      const g = game.value

      if (!g) return i18n.t('party.remote.lobby')

      if (g.phase === 'final') return i18n.t('party.remote.final')

      return i18n.t(`party.remote.${g.phase === 'result' ? 'result' : 'round'}`, { n: Math.max(g.index, 0) + 1, total: g.total })
    })

    send(wsTypeEnum.PARTY_REMOTE_JOIN, { code: props.code })

    const setAuto = value => send(wsTypeEnum.PARTY_SETTINGS, { patch: { autoAdvance: value } })

    const cancel = () => {
      Dialog.confirm({
        message: i18n.t('party.game.cancelConfirm'),
        confirmButtonText: i18n.t('party.game.cancelYes'),
        cancelButtonText: i18n.t('party.lobby.cancel'),
        getContainer: 'body'
      })
        .then(() => send(wsTypeEnum.PARTY_CANCEL))
        .catch(() => {})
    }

    // drop the remote's room first: the player page skips its join while a room for this code is held
    const back = () => {
      store.commit('party/RESET')
      router.replace(localePath({ name: 'Party-code', params: { code: route.value.params.code } }))
    }

    onBeforeUnmount(() => store.commit('party/RESET'))

    return { room, game, queue, autoAdvance, closedReason, prettyCode, errorKey, phaseLabel, send, setAuto, cancel, back }
  }
})
</script>

<style lang="scss" src="./PartyRemoteControls.component.scss" scoped></style>
