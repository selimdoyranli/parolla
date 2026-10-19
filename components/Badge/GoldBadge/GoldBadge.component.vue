<template lang="pug">
span.gold-badge
  GoldAmount(:amount="amount")
</template>

<script>
import { defineComponent, computed, useStore } from '@nuxtjs/composition-api'

export default defineComponent({
  setup() {
    const store = useStore()
    const amount = computed(() => store.state.economy.wallet.gold)

    return { amount }
  }
})
</script>

<style lang="scss" src="./GoldBadge.component.scss"></style>
