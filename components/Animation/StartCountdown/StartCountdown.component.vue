<template lang="pug">
//- pre-game 3-2-1-GO: the cards share one spot; the outgoing one turns clockwise and fades while the next turns in
.start-countdown(role="status" aria-live="assertive")
  transition(name="start-countdown-turn")
    .start-countdown__card(:key="value" v-if="value" :class="`start-countdown__card--${String(value).toLowerCase()}`")
      | {{ value === 'GO' ? 'GO!' : value }}
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  props: {
    // 3 | 2 | 1 | 'GO', or null once the countdown is over (the last card then turns out)
    value: {
      type: [Number, String],
      required: false,
      default: null
    }
  }
})
</script>

<style lang="scss" src="./StartCountdown.component.scss"></style>
