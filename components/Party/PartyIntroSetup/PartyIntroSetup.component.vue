<template lang="pug">
.party-intro-setup
  PartyLoginGate(v-if="!$auth.loggedIn")
  form.party-intro-setup__form(v-else @submit.prevent="create")
    .party-intro-setup__row
      AppIcon.party-intro-setup__icon(name="tabler:key" :width="18" :height="18")
      strong.party-intro-setup__label {{ $t('party.intro.password') }}
      VanSwitch(v-model="passwordOn" size="20px" active-color="var(--color-brand-02)" :disabled="loading")
    //- masked by default; the eye toggles it (round duration and leaderboard are set in the lobby)
    .party-intro-setup__field(v-if="passwordOn")
      input.party-intro-setup__input(
        v-model="password"
        :type="isPasswordVisible ? 'text' : 'password'"
        :placeholder="$t('party.lobby.settings.passwordPlaceholder')"
        maxlength="32"
        autocomplete="new-password"
        :disabled="loading"
      )
      ActionButton.party-intro-setup__eye(
        :label="isPasswordVisible ? $t('party.intro.hidePassword') : $t('party.intro.showPassword')"
        :icon="isPasswordVisible ? 'tabler:eye-off' : 'tabler:eye'"
        :icon-size="18"
        :aria-pressed="String(isPasswordVisible)"
        @click="isPasswordVisible = !isPasswordVisible"
      )
    Button.party-intro-setup__submit(block round native-type="submit" :loading="loading" :disabled="!canSubmit") {{ $t('party.intro.create') }}
</template>

<script>
import { defineComponent, ref, computed, watch, useStore, useContext, useRouter } from '@nuxtjs/composition-api'
import { Switch, Button } from 'vant'
import { usePartySocket } from '@/composables/usePartySocket'
import { wsTypeEnum } from '@/enums/wsType.enum'

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
    const isPasswordVisible = ref(false)
    const loading = ref(false)
    const canSubmit = computed(() => !passwordOn.value || Boolean(password.value.trim()))

    const create = () => {
      if (loading.value || !canSubmit.value) return

      loading.value = true
      open()
      send(wsTypeEnum.PARTY_CREATE, {
        roomId: props.roomId,
        locale: i18n.locale,
        settings: { password: passwordOn.value ? password.value.trim() : null }
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
      passwordOn,
      password,
      isPasswordVisible,
      loading,
      canSubmit,
      create
    }
  }
})
</script>

<style lang="scss" src="./PartyIntroSetup.component.scss" scoped></style>
