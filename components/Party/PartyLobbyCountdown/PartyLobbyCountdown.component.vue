<template lang="pug">
.party-lobby-countdown(v-if="leftMs !== null")
  .party-lobby-countdown__row
    span
      AppIcon(name="tabler:home" :width="14" :height="14")
      | {{ $t('party.lobbyIn') }}
    b {{ Math.ceil(leftMs / 1000) }}s
  .party-lobby-countdown__bar
    i(:style="{ width: `${fraction * 100}%` }")
</template>

<script>
import { defineComponent, ref, computed, watch, onUnmounted } from '@nuxtjs/composition-api'

// "Lobiye dönülüyor" bar for the final / cancelled overlays; lobbyInMs is relative to when the frame arrived
export default defineComponent({
  props: {
    lobbyInMs: {
      type: Number,
      default: null
    }
  },
  setup(props) {
    const now = ref(Date.now())
    const endAt = ref(null)
    const span = ref(1)
    const ticker = setInterval(() => (now.value = Date.now()), 200)

    watch(
      () => props.lobbyInMs,
      ms => {
        endAt.value = typeof ms === 'number' ? Date.now() + ms : null
        span.value = Math.max(1, ms || 0)
      },
      { immediate: true }
    )

    const leftMs = computed(() => (endAt.value === null ? null : Math.max(0, endAt.value - now.value)))
    const fraction = computed(() => (leftMs.value === null ? 0 : Math.min(1, leftMs.value / span.value)))

    onUnmounted(() => clearInterval(ticker))

    return { leftMs, fraction }
  }
})
</script>

<style lang="scss" src="./PartyLobbyCountdown.component.scss" scoped></style>
