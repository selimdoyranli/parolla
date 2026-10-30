<template lang="pug">
.party-room-session
  //- seated: the page lays the room out; its components inject `partySend`
  slot(v-if="room")
  p.party-room-session__label(v-else) {{ $t('party.room.connecting') }}

  PartyHostLeftDialog(v-if="closedReason === 'no_host'")

  EnterPasswordDialog(:key="passwordTry" v-if="askPassword" @submit="submitPassword" @close="leave")
</template>

<script>
import { defineComponent, ref, computed, watch, onBeforeUnmount, provide, useStore, useContext, useRouter } from '@nuxtjs/composition-api'
import { usePartySocket } from '@/composables/usePartySocket'
import { showToast } from '@/helpers/toast'
import { wsTypeEnum } from '@/enums/wsType.enum'

export default defineComponent({
  props: {
    code: { type: String, required: true },
    quiz: { type: String, default: '' }
  },
  setup(props) {
    const store = useStore()
    const router = useRouter()
    const { i18n, localePath } = useContext()
    const { send } = usePartySocket()
    const room = computed(() => store.state.party.room)
    const closedReason = computed(() => store.state.party.closedReason)
    const askPassword = ref(false)
    const passwordTry = ref(0)

    const leave = () => router.replace(localePath({ name: 'Party' }))

    provide('partySend', send)

    // no_host keeps the page under a blocking dialog; kicked / empty go back to the entry page
    watch(closedReason, reason => {
      if (!reason || reason === 'no_host') return

      showToast.fail(i18n.t(`party.closed.${reason === 'kicked' ? 'kicked' : 'empty'}`))
      leave()
    })

    // already seated (the page instance survives /party/new -> /party/<code>): nothing to send
    if (!room.value || room.value.code !== props.code) {
      if (props.code === 'new') send(wsTypeEnum.PARTY_CREATE, { roomId: props.quiz, locale: i18n.locale })
      else send(wsTypeEnum.PARTY_JOIN, { code: props.code })
    }

    watch(
      () => room.value && room.value.code,
      realCode => {
        if (realCode && props.code === 'new') router.replace(localePath({ name: 'Party-code', params: { code: realCode } }))
      }
    )

    // a fresh object per error frame, so the same code twice still fires
    watch(
      () => store.state.party.error,
      err => {
        if (!err) return

        if (err.code === 'bad_password' && !room.value) {
          // passwordTry > 0: a password was already sent, so this one was wrong
          if (passwordTry.value > 0) showToast.fail(i18n.t('party.errors.bad_password'))

          askPassword.value = true
          passwordTry.value++

          return
        }

        if (!room.value) leave()
      }
    )

    const submitPassword = password => {
      askPassword.value = false
      send(wsTypeEnum.PARTY_JOIN, { code: props.code, password })
    }

    onBeforeUnmount(() => {
      send(wsTypeEnum.PARTY_LEAVE)
      store.commit('party/RESET')
    })

    return { room, closedReason, askPassword, passwordTry, submitPassword, leave }
  }
})
</script>

<style lang="scss" src="./PartyRoomSession.component.scss" scoped></style>
