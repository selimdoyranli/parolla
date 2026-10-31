import { watch, onBeforeUnmount, useStore } from '@nuxtjs/composition-api'
import { Howl } from 'howler'

// The frames right after a (re)join are the server's snapshot and chat history replay, not live events
const QUIET_AFTER_JOIN_MS = 1000
let quietUntil = Infinity

export const isPartySfxQuiet = () => Date.now() < quietUntil

/**
 * usePartySfx — party room sounds, driven by store/party. Mount once (the room page).
 * Game sounds reuse the solo Howler files and the game-scene sound setting; social / UI cues go through ACS
 * (useSfx, reaction sound setting). With a presenter screen, room-wide cues play there only; each player's
 * own result / ack / vote still plays on their phone.
 */
export const usePartySfx = () => {
  const store = useStore()
  const sfx = useSfx()
  const party = store.state.party
  const howls = {}

  const playGame = (name, volume = 1) => {
    if (process.server) return

    if (!howls[name]) howls[name] = new Howl({ src: [`/sound/fx/${name}.wav`], volume })

    howls[name].mute(!store.getters['app/isActiveGameSceneSoundFx'])
    howls[name].play()
  }

  const stopTick = () => howls['tick-tock']?.stop()

  const isRoomScreen = () => {
    const room = party.room

    if (!room) return false

    const screen = room.game ? room.game.presenterId : room.settings?.presentation && room.hostId

    return !screen || screen === party.myId
  }

  const live = () => !isPartySfxQuiet()

  watch(
    () => party.status,
    status => {
      if (status !== 'connected') quietUntil = Infinity
    },
    { immediate: true }
  )

  // first room state after a (re)join opens the quiet window; later ones: who joined / left
  watch(
    () => party.room,
    (room, prev) => {
      if (quietUntil === Infinity) {
        if (room && party.status === 'connected') quietUntil = Date.now() + QUIET_AFTER_JOIN_MS

        return
      }

      if (!live() || !room || !prev || room.code !== prev.code || !isRoomScreen()) return

      const ids = new Set(room.players.map(p => p.id))
      const prevIds = new Set(prev.players.map(p => p.id))

      if (room.players.some(p => !prevIds.has(p.id))) sfx.play('chime-soft')
      else if (prev.players.some(p => !ids.has(p.id))) sfx.play('page-exit', { volume: 0.4 })
    }
  )

  watch(
    () => party.myAnswer,
    text => {
      if (text && live()) sfx.play('confirm')
    }
  )

  // choices: my vote (the server echo, so a reconnect snapshot is covered by the quiet window)
  watch(
    () => party.votes?.mine,
    (mine, prev) => {
      if (mine && live()) sfx.play(prev ? 'tick' : 'pop')
    }
  )

  // a new round (question / duel) arrives: tour mode's start sound. Round 1 follows the 3-2-1 GO, which has its own
  // sound; the countdown resync keeps the same round object, so only a real ROUND_START fires this
  watch(
    () => party.round,
    (round, prev) => {
      if (round && round !== prev && round.index > 0 && live() && isRoomScreen()) playGame('start')
    }
  )

  // last 5 s of a round: the solo tick-tock, once (re-armed when the server resyncs the countdown)
  let tickTimer = null

  watch(
    () => party.round && party.round.receivedAt,
    () => {
      clearTimeout(tickTimer)
      stopTick()
      const round = party.round

      if (process.server || !round || round.remainingMs <= 5000) return

      tickTimer = setTimeout(() => {
        if (party.round === round && !party.roundEnd && isRoomScreen()) playGame('tick-tock', 0.3)
      }, round.remainingMs - 5000)
    }
  )

  watch(
    () => party.roundEnd,
    end => {
      if (!end) return

      clearTimeout(tickTimer)
      stopTick()

      if (!live()) return

      // QA: my answer right / wrong; choices: my pick won / the room went the other way
      const mine = end.me ? end.me.correct : typeof end.mineWon === 'boolean' ? end.mineWon : null

      if (mine !== null) playGame(mine ? 'correct' : 'wrong')
      else if (isRoomScreen()) sfx.play('ding')
    }
  )

  watch(
    () => party.final,
    final => {
      if (final && live() && isRoomScreen()) sfx.play('complete')
    }
  )

  watch(
    () => party.cancelled,
    cancelled => {
      if (!cancelled) return

      clearTimeout(tickTimer)
      stopTick()

      if (live() && isRoomScreen()) sfx.play('page-exit')
    }
  )

  // shortcut: a fixed 400 ms gap keeps an emoji burst to a few pops; per-sender throttling if it still feels noisy
  let lastEmojiAt = 0

  watch(
    () => party.emojis.length && party.emojis[party.emojis.length - 1],
    e => {
      const now = Date.now()

      if (!e || e.playerId === party.myId || !party.room?.game || !live() || !isRoomScreen() || now - lastEmojiAt < 400) return

      lastEmojiAt = now
      sfx.play('pop', { volume: 0.3 })
    }
  )

  onBeforeUnmount(() => {
    clearTimeout(tickTimer)
    Object.values(howls).forEach(h => h.unload())
  })
}
