import { ref, onBeforeUnmount } from '@nuxtjs/composition-api'

const POLL_MS = 4000

// the ws server also answers plain HTTP on the same host (ws → http, wss → https)
const listUrl = () => `${new URL((process.env.WS_URL || 'wss://0.0.0.0:1881').replace(/^ws/, 'http')).origin}/party/rooms`

/**
 * Public party rooms (hosts who turned on "Listede göster"), from parolla-ws GET /party/rooms.
 * Polled while someone looks at the list: viewers aren't in a room, so no socket is needed for it.
 * `start()` loads now and every POLL_MS (skipping hidden tabs), `stop()` ends it; unmount stops too.
 */
export const usePartyRooms = () => {
  const rooms = ref([])
  const loaded = ref(false)
  const failed = ref(false)
  let timer = null

  const load = async () => {
    try {
      const res = await fetch(listUrl(), { cache: 'no-store' })
      const data = await res.json()

      rooms.value = Array.isArray(data.rooms) ? data.rooms : []
      failed.value = false
    } catch (e) {
      failed.value = true
    } finally {
      loaded.value = true
    }
  }

  const stop = () => {
    clearInterval(timer)
    timer = null
  }

  const start = () => {
    stop()
    load()
    timer = setInterval(() => {
      if (document.visibilityState === 'visible') load()
    }, POLL_MS)
  }

  onBeforeUnmount(stop)

  return { rooms, loaded, failed, load, start, stop }
}
