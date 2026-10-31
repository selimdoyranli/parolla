import { ref, watch, useStore, useContext, useRouter } from '@nuxtjs/composition-api'
import { usePartySocket } from '@/composables/usePartySocket'
import { wsTypeEnum } from '@/enums/wsType.enum'

/**
 * Creates a party room and opens it once the server seats us (quiz intro and the /party landing).
 * `create({ roomId?, settings? })`: no roomId creates an empty room; games get queued in the lobby.
 */
export const usePartyCreate = () => {
  const store = useStore()
  const router = useRouter()
  const { i18n, localePath } = useContext()
  // lazy: the socket opens on create, not on mount; the room page picks up the same socket
  const { send, open } = usePartySocket({ lazy: true })
  const loading = ref(false)

  const create = (payload = {}) => {
    if (loading.value) return

    loading.value = true
    open()
    send(wsTypeEnum.PARTY_CREATE, { ...payload, locale: i18n.locale })
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

  return { loading, create }
}
