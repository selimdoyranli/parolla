<template lang="pug">
//- decorative: a simulated lobby that shows what a synced room feels like (no socket, nothing real)
.party-live-demo(aria-hidden="true")
  span.party-live-demo__badge
    AppIcon(name="tabler:bolt" :width="14" :height="14")
    | {{ $t('party.landing.demo.badge') }}

  header.party-live-demo__head
    span.party-live-demo__live
      span.party-live-demo__dot
      | {{ $t('party.landing.demo.live') }}
    span.party-live-demo__code # 482 913

  .party-live-demo__quiz
    AppIcon(name="tabler:help-circle" :width="16" :height="16")
    strong {{ $t('party.landing.demo.quiz') }}
    span · {{ $t('party.lobby.types.qa') }}

  transition-group.party-live-demo__list(name="party-live-demo-row" tag="ul")
    li.party-live-demo__row(v-for="player in ranked" :key="player.name" :class="{ 'party-live-demo__row--hit': player.name === lastHit }")
      PlayerAvatar(:user="{ username: player.name, diceBear: { seed: player.seed } }" :size="30")
      span.party-live-demo__name {{ player.name }}
      span.party-pill.party-pill--brand(v-if="player.isHost")
        AppIcon(name="tabler:crown" :width="12" :height="12")
        | {{ $t('party.lobby.host') }}
      span.party-live-demo__score
        AppIcon(name="tabler:trophy" :width="14" :height="14")
        | {{ player.score.toLocaleString() }}

  .party-live-demo__waiting(v-if="players.length < capacity")
    AppIcon(name="tabler:users-plus" :width="16" :height="16")
    | {{ $t('party.landing.demo.waiting', { count: players.length, capacity }) }}

  footer.party-live-demo__ticker
    AppIcon(name="tabler:stopwatch" :width="16" :height="16")
    transition(name="party-live-demo-fade" mode="out-in")
      span.party-live-demo__event(:key="event.key") {{ event.text }}
    span.party-live-demo__timer 0:{{ String(timer).padStart(2, '0') }}

  .party-live-demo__floats
    span.party-live-demo__float(
      v-for="item in floats"
      :key="item.key"
      :style="{ left: `${item.left}%` }"
      @animationend="removeFloat(item.key)"
    )
      | {{ item.emoji }}
      small {{ item.name }}
</template>

<script>
import { defineComponent, ref, computed, onMounted, onBeforeUnmount, useContext } from '@nuxtjs/composition-api'

const ROSTER = [
  { name: 'Selin', seed: 'selin-demo', isHost: true },
  { name: 'Mert', seed: 'mert-demo' },
  { name: 'Ece', seed: 'ece-demo' },
  { name: 'Can', seed: 'can-demo' },
  { name: 'Deniz', seed: 'deniz-demo' },
  { name: 'Zeynep', seed: 'zeynep-demo' }
]
const START_PLAYERS = 4
const EMOJIS = ['👏', '😂', '🔥', '😮', '❤️']
const ROUND_SEC = 20
const pick = list => list[Math.floor(Math.random() * list.length)]

export default defineComponent({
  setup() {
    const { i18n } = useContext()
    const capacity = 10
    const fresh = () => ROSTER.slice(0, START_PLAYERS).map(p => ({ ...p, score: 0 }))
    const players = ref(fresh())
    const ranked = computed(() => [...players.value].sort((a, b) => b.score - a.score))
    const timer = ref(ROUND_SEC)
    const lastHit = ref('')
    const event = ref({ key: 0, text: i18n.t('party.landing.demo.joined', { name: ROSTER[0].name }) })
    const floats = ref([])
    let tick = 0
    let floatKey = 0
    let interval = null

    const say = text => {
      event.value = { key: event.value.key + 1, text }
    }

    const step = () => {
      tick++
      timer.value = timer.value > 1 ? timer.value - 1 : ROUND_SEC

      // a new round starts the demo over so scores stay readable
      if (tick % 60 === 0) {
        players.value = fresh()

        return
      }

      if (tick % 7 === 0 && players.value.length < ROSTER.length) {
        const next = ROSTER[players.value.length]
        players.value.push({ ...next, score: 0 })
        say(i18n.t('party.landing.demo.joined', { name: next.name }))

        return
      }

      if (tick % 2 === 0) {
        const player = pick(players.value)
        const points = 60 + Math.round(Math.random() * 12) * 10
        player.score += points
        lastHit.value = player.name
        say(i18n.t('party.landing.demo.correct', { name: player.name, points }))
      }

      const sender = pick(players.value)
      floats.value.push({ key: ++floatKey, emoji: pick(EMOJIS), name: sender.name, left: 10 + Math.random() * 75 })
    }

    const removeFloat = key => {
      floats.value = floats.value.filter(f => f.key !== key)
    }

    onMounted(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      interval = setInterval(step, 1000)
    })
    onBeforeUnmount(() => clearInterval(interval))

    return { capacity, players, ranked, timer, lastHit, event, floats, removeFloat }
  }
})
</script>

<style lang="scss" src="./PartyLiveLobbyDemo.component.scss" scoped></style>
