<template lang="pug">
.party-intro-setup
  PartyLoginGate(v-if="!$auth.loggedIn")
  form.party-intro-setup__form(v-else @submit.prevent="create")
    .party-intro-setup__row
      AppIcon.party-intro-setup__icon(name="tabler:key" :width="18" :height="18")
      strong.party-intro-setup__label {{ $t('party.intro.password') }}
      VanSwitch(v-model="passwordOn" size="20px" active-color="var(--color-brand-02)" :disabled="loading")
    input.party-intro-setup__input(
      v-if="passwordOn"
      v-model="password"
      type="text"
      :placeholder="$t('party.lobby.settings.passwordPlaceholder')"
      maxlength="32"
      autocomplete="off"
      :disabled="loading"
    )
    .party-intro-setup__row.party-intro-setup__row--stack
      .party-intro-setup__head
        AppIcon.party-intro-setup__icon(name="tabler:clock" :width="18" :height="18")
        strong.party-intro-setup__label {{ $t('party.lobby.settings.duration') }}
      .party-chips
        button.party-chip(
          v-for="sec in durations"
          :key="sec"
          type="button"
          :class="{ 'party-chip--active': roundDurationSec === sec }"
          :disabled="loading"
          @click="roundDurationSec = sec"
        ) {{ $t('party.lobby.settings.seconds', { n: sec }) }}
    .party-intro-setup__row.party-intro-setup__row--stack
      .party-intro-setup__head
        AppIcon.party-intro-setup__icon(name="tabler:trophy" :width="18" :height="18")
        strong.party-intro-setup__label {{ $t('party.lobby.settings.leaderboard') }}
      .party-chips
        button.party-chip(
          v-for="mode in boardModes"
          :key="mode"
          type="button"
          :class="{ 'party-chip--active': leaderboard === mode }"
          :disabled="loading"
          @click="leaderboard = mode"
        ) {{ $t(`party.lobby.settings.board.${mode}`) }}
    Button.party-intro-setup__submit(block round native-type="submit" :loading="loading" :disabled="!canSubmit") {{ $t('party.intro.create') }}
</template>

<script>
import { defineComponent, ref, computed, watch, useStore, useContext, useRouter } from '@nuxtjs/composition-api'
import { Switch, Button } from 'vant'
import { usePartySocket } from '@/composables/usePartySocket'
import { wsTypeEnum } from '@/enums/wsType.enum'

const DURATIONS = [15, 30, 45, 60, 90, 120]
const BOARD_MODES = ['always', 'end', 'never']

export default defineComponent({
  components: { VanSwitch: Switch, Button },
  props: {
    roomId: { type: String, required: true }
  },
  setup(props) {
    const store = useStore()
    const router = useRouter()
    const { i18n, localePath } = useContext()
    // lazy: the socket opens on "Odayı kur", not when the panel expands; the room page picks up the same socket
    const { send, open } = usePartySocket({ lazy: true })
    const passwordOn = ref(false)
    const password = ref('')
    const roundDurationSec = ref(30)
    const leaderboard = ref('always')
    const loading = ref(false)
    const canSubmit = computed(() => !passwordOn.value || Boolean(password.value.trim()))

    const create = () => {
      if (loading.value || !canSubmit.value) return

      loading.value = true
      open()
      send(wsTypeEnum.PARTY_CREATE, {
        roomId: props.roomId,
        locale: i18n.locale,
        settings: {
          roundDurationSec: roundDurationSec.value,
          leaderboard: leaderboard.value,
          password: passwordOn.value ? password.value.trim() : null
        }
      })
    }

    // seated: the room page sees the room already in the store and sends no create / join of its own
    watch(
      () => store.state.party.room && store.state.party.room.code,
      code => {
        if (code && loading.value) router.push(localePath({ name: 'Party-code', params: { code } }))
      }
    )

    // the store already toasts the error; a dropped socket would never answer
    watch(
      () => [store.state.party.error, store.state.party.status],
      ([err, status]) => {
        if (loading.value && !store.state.party.room && (err || status === 'disconnected')) loading.value = false
      }
    )

    return {
      durations: DURATIONS,
      boardModes: BOARD_MODES,
      passwordOn,
      password,
      roundDurationSec,
      leaderboard,
      loading,
      canSubmit,
      create
    }
  }
})
</script>

<style lang="scss" src="./PartyIntroSetup.component.scss" scoped></style>
