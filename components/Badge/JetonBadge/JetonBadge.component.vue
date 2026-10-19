<template lang="pug">
span.jeton-badge
  svg.jeton-badge__coin(viewBox="0 0 24 24" aria-hidden="true" width="18" height="18")
    circle(cx="12" cy="12" r="10" fill="#f5b301" stroke="#c98a00" stroke-width="2")
    circle(cx="12" cy="12" r="6" fill="none" stroke="#c98a00" stroke-width="1.5")
  span.jeton-badge__amount {{ amount }}
</template>

<script>
import { defineComponent, computed, useContext, useStore } from '@nuxtjs/composition-api'

export default defineComponent({
  setup() {
    const store = useStore()
    const { i18n } = useContext()

    const amount = computed(() => store.state.economy.wallet.jeton.toLocaleString(i18n.locale))

    return { amount }
  }
})
</script>

<style lang="scss" src="./JetonBadge.component.scss"></style>
