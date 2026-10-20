<template lang="pug">
span.gold-amount(:class="[`gold-amount--${size}`, { 'gold-amount--strike': strike, 'gold-amount--muted': muted }]")
  AppIcon.gold-amount__coin(name="noto:coin" :width="iconSize" :height="iconSize")
  span.gold-amount__value {{ text }}
</template>

<script>
import { defineComponent, computed, useContext } from '@nuxtjs/composition-api'

const ICON_SIZE = { sm: 14, md: 18, lg: 24 }

export default defineComponent({
  props: {
    amount: { type: Number, required: true },
    // sm | md | lg
    size: { type: String, default: 'md' },
    strike: { type: Boolean, default: false },
    muted: { type: Boolean, default: false },
    // prefix positive amounts with "+" (history, rewards)
    signed: { type: Boolean, default: false }
  },
  setup(props) {
    const { i18n } = useContext()

    const iconSize = computed(() => ICON_SIZE[props.size] || ICON_SIZE.md)
    const text = computed(() => (props.signed && props.amount > 0 ? '+' : '') + props.amount.toLocaleString(i18n.locale))

    return { iconSize, text }
  }
})
</script>

<style lang="scss" src="./GoldAmount.component.scss"></style>
