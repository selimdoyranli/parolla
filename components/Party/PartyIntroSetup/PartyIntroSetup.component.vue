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
import { defineComponent, ref, computed } from '@nuxtjs/composition-api'
import { Switch, Button } from 'vant'
import { usePartyCreate } from '@/composables/usePartyCreate'

export default defineComponent({
  components: { VanSwitch: Switch, Button },
  props: {
    roomId: { type: String, required: true }
  },
  setup(props) {
    const { loading, create: createRoom } = usePartyCreate()
    const passwordOn = ref(false)
    const password = ref('')
    const isPasswordVisible = ref(false)
    const canSubmit = computed(() => !passwordOn.value || Boolean(password.value.trim()))

    const create = () => {
      if (!canSubmit.value) return

      createRoom({ roomId: props.roomId, settings: { password: passwordOn.value ? password.value.trim() : null } })
    }

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
