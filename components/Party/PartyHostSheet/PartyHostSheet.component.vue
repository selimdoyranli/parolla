<template lang="pug">
Popup.party-host-sheet(:value="value" position="bottom" round get-container="body" @input="$emit('input', $event)")
  .party-host-sheet__head
    strong {{ $t('party.game.settings') }}
    button.party-host-sheet__close(type="button" :aria-label="$t('party.game.close')" @click="$emit('input', false)")
      AppIcon(name="tabler:x" :width="18" :height="18")

  .party-host-sheet__row
    AppIcon.party-host-sheet__icon(name="tabler:bolt" :width="18" :height="18")
    .party-host-sheet__text
      strong {{ $t('party.game.autoAdvance') }}
      small {{ $t('party.game.autoAdvanceSub') }}
    VanSwitch(:value="autoAdvance" size="20px" active-color="var(--color-brand-02)" @input="setAuto")

  Button.party-host-sheet__next(icon="arrow" round block :disabled="!canNext" @click="next") {{ $t('party.game.next') }}

  button.party-host-sheet__cancel(type="button" @click="cancel")
    AppIcon(name="tabler:circle-off" :width="16" :height="16")
    | {{ $t('party.game.cancel') }}
</template>

<script>
import { defineComponent, computed, inject, useStore, useContext } from '@nuxtjs/composition-api'
import { Popup, Switch, Button, Dialog } from 'vant'
import { wsTypeEnum } from '@/enums/wsType.enum'

// In-game host controls (Ayarlar): auto advance, next round, cancel. Same frames the remote sends.
export default defineComponent({
  components: { Popup, VanSwitch: Switch, Button },
  props: { value: { type: Boolean, default: false } },
  setup(props, { emit }) {
    const store = useStore()
    const { i18n } = useContext()
    const send = inject('partySend')

    const autoAdvance = computed(() => Boolean(store.getters['party/settings'].autoAdvance))
    // the server only advances from a round result
    const canNext = computed(() => store.getters['party/game']?.phase === 'result')

    const setAuto = value => send(wsTypeEnum.PARTY_SETTINGS, { patch: { autoAdvance: value } })

    const next = () => {
      send(wsTypeEnum.PARTY_NEXT)
      emit('input', false)
    }

    const cancel = () => {
      Dialog.confirm({
        message: i18n.t('party.game.cancelConfirm'),
        confirmButtonText: i18n.t('party.game.cancelYes'),
        cancelButtonText: i18n.t('party.lobby.cancel'),
        getContainer: 'body'
      })
        .then(() => {
          send(wsTypeEnum.PARTY_CANCEL)
          emit('input', false)
        })
        .catch(() => {})
    }

    return { autoAdvance, canNext, setAuto, next, cancel }
  }
})
</script>

<style lang="scss" src="./PartyHostSheet.component.scss" scoped></style>
