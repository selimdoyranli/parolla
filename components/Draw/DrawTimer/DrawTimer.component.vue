<template lang="pug">
.draw-timer
  .draw-timer__pill ⏱ {{ seconds }}s
  .draw-timer__bar
    .draw-timer__fill(:style="{ width: pct + '%' }")
</template>

<script>
import { defineComponent, computed } from '@nuxtjs/composition-api'

export default defineComponent({
  props: {
    remainingMs: { type: Number, default: 0 },
    durationMs: { type: Number, default: 60000 }
  },
  setup(props) {
    const seconds = computed(() => Math.max(0, Math.ceil(props.remainingMs / 1000)))
    const pct = computed(() => Math.max(0, Math.min(100, (props.remainingMs / props.durationMs) * 100)))

    return { seconds, pct }
  }
})
</script>

<style src="./DrawTimer.component.scss" lang="scss" scoped />
