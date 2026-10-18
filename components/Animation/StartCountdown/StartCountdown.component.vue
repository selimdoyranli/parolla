<template lang="pug">
//- pre-game 3-2-1-GO: each step is a coloured card that flips in around its vertical axis
.start-countdown(role="status" aria-live="assertive")
  transition(name="start-countdown-flip" mode="out-in")
    .start-countdown__card(:key="value" :class="`start-countdown__card--${String(value).toLowerCase()}`")
      | {{ value === 'GO' ? 'GO!' : value }}
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  props: {
    // 3 | 2 | 1 | 'GO'
    value: {
      type: [Number, String],
      required: true
    }
  }
})
</script>

<style lang="scss" src="./StartCountdown.component.scss"></style>
