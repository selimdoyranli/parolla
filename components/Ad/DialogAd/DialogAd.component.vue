<template lang="pug">
//- the dialog ad pair (desktop / mobile slots) first used by the how-to-play dialog; adSlot gives a placement its own unit
//- rectangle on phones: 'auto' came back taller than the dialog, a fixed 300x250 shut every other size out of the auction
.dialog-ad
  AppAd(
    :key="String(isDesktop)"
    :lazy="lazy"
    :format="isDesktop ? 'auto' : 'rectangle'"
    :data-ad-slot="adSlot || (isDesktop ? 9964323575 : 5200543400)"
  )
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import { useMediaQuery } from '@vueuse/core'

export default defineComponent({
  props: {
    adSlot: {
      type: Number,
      required: false,
      default: null
    },
    // below-the-fold placements: only request the ad once it nears the viewport
    lazy: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  setup() {
    const isDesktop = useMediaQuery('(min-width: 992px)')

    return { isDesktop }
  }
})
</script>

<style lang="scss" src="./DialogAd.component.scss"></style>
