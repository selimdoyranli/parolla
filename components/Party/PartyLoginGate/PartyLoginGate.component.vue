<template lang="pug">
.party-login-gate
  .party-login-gate__card
    AppIcon.party-login-gate__icon(name="tabler:lock" :width="22" :height="22")
    p.party-login-gate__notice {{ $t('party.gate.notice') }}
    Button.party-login-gate__login(round size="small" @click="login") {{ $t('party.gate.login') }}
  .party-login-gate__setting
    span {{ $t('party.gate.password') }}
    Switch(:value="false" disabled size="20")
</template>

<script>
import { defineComponent, useStore } from '@nuxtjs/composition-api'
import { Button, Switch } from 'vant'

export default defineComponent({
  components: { Button, Switch },
  setup() {
    const store = useStore()
    const login = () => store.commit('auth/SET_AUTH_DIALOG_IS_OPEN', true)

    return { login }
  }
})
</script>

<style lang="scss" src="./PartyLoginGate.component.scss" scoped></style>
