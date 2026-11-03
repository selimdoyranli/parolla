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

  //- choices only: hide the live vote split so everyone votes on their own, not with the crowd
  .party-host-sheet__row(v-if="isChoicesGame")
    AppIcon.party-host-sheet__icon(name="tabler:chart-bar" :width="18" :height="18")
    .party-host-sheet__text
      strong {{ $t('party.game.voteBar') }}
      small {{ $t('party.game.voteBarSub') }}
    span.party-host-sheet__state {{ voteBar ? $t('party.game.show') : $t('party.game.hide') }}
    VanSwitch(:value="voteBar" size="20px" active-color="var(--color-brand-02)" @input="setVoteBar")

  Button.party-host-sheet__next(icon="arrow" round block :disabled="!canNext" @click="next") {{ $t('party.game.next') }}

  button.party-host-sheet__cancel(type="button" @click="cancel")
    AppIcon(name="tabler:circle-off" :width="16" :height="16")
    | {{ $t('party.game.cancel') }}
</template>

<script>
import { defineComponent, computed, inject, useStore } from '@nuxtjs/composition-api'
import { Popup, Switch, Button } from 'vant'
import { wsTypeEnum } from '@/enums/wsType.enum'
import { quizTypeEnum } from '@/enums/quiz.enum'

// In-game host controls (Ayarlar): auto advance, next round, cancel. Same frames the remote sends.
export default defineComponent({
  components: { Popup, VanSwitch: Switch, Button },
  props: { value: { type: Boolean, default: false } },
  setup(props, { emit }) {
    const store = useStore()
    const send = inject('partySend')

    const autoAdvance = computed(() => Boolean(store.getters['party/settings'].autoAdvance))
    const voteBar = computed(() => store.getters['party/settings'].voteBar !== false)
    const isChoicesGame = computed(() => store.getters['party/game']?.quizType === quizTypeEnum.CHOICES)
    // the server only advances from a round result
    const canNext = computed(() => store.getters['party/game']?.phase === 'result')

    const setAuto = value => send(wsTypeEnum.PARTY_SETTINGS, { patch: { autoAdvance: value } })
    const setVoteBar = value => send(wsTypeEnum.PARTY_SETTINGS, { patch: { voteBar: value } })

    const next = () => {
      send(wsTypeEnum.PARTY_NEXT)
      emit('input', false)
    }

    const { openPartyCancelDialog } = useDialog()

    const cancel = () =>
      openPartyCancelDialog({
        confirm: () => {
          send(wsTypeEnum.PARTY_CANCEL)
          emit('input', false)
        }
      })

    return { autoAdvance, voteBar, isChoicesGame, canNext, setAuto, setVoteBar, next, cancel }
  }
})
</script>

<style lang="scss" src="./PartyHostSheet.component.scss" scoped></style>
