<template lang="pug">
//- the dialog ad pair (desktop / mobile slots) first used by the how-to-play dialog
.dialog-ad
  AppAd(v-if="isDesktop" :data-ad-slot="9964323575")
  AppAd(v-else :data-ad-slot="5200543400")
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import { useMediaQuery } from '@vueuse/core'

export default defineComponent({
  setup() {
    const isDesktop = useMediaQuery('(min-width: 992px)')

    return { isDesktop }
  }
})
</script>

<style lang="scss" src="./DialogAd.component.scss"></style>
