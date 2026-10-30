<template lang="pug">
.page.party-page
  PartyLoginGate(v-if="isNew && !loggedIn")
  CreateGuestDrawerDialog(v-else-if="needsGuest && !guestReady" no-socket :title="$t('party.guest.title')" @close="guestReady = true")
  //- the socket-using child only mounts once identity is settled (guests send it in the connect URL)
  PartyRoomSession(v-else-if="!needsGuest || guestReady" :code="code" :quiz="quiz")
</template>

<script>
import { defineComponent, ref, computed, useContext, useRouter, useRoute } from '@nuxtjs/composition-api'

export default defineComponent({
  // keep the same instance when `/party/new` is replaced by the real code, so the socket/room survive
  key: 'party-room',
  layout: 'Default/Default.layout',
  setup() {
    const { app, localePath } = useContext()
    const router = useRouter()
    const route = useRoute()
    const code = computed(() => route.value.params.code)
    const quiz = computed(() => route.value.query.quiz || '')
    const isNew = computed(() => code.value === 'new')
    const loggedIn = computed(() => Boolean(app.$auth.loggedIn))
    const needsGuest = computed(() => !isNew.value && !loggedIn.value)
    const guestReady = ref(false)

    if (isNew.value && !quiz.value) router.replace(localePath({ name: 'Party' }))

    return { code, quiz, isNew, loggedIn, needsGuest, guestReady }
  }
})
</script>

<style lang="scss" scoped>
.party-page {
  padding: 16px;
}
</style>
