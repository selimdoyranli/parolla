<template lang="pug">
.app-ad
  script(src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5310998423283624" async crossorigin="anonymous")
  //- full-width-responsive grows a fixed shape (e.g. horizontal) into a tall block on phones; only 'auto' may do that.
  //- format null drops both attributes so the unit takes the exact size its CSS gives the ins
  ins.adsbygoogle(
    style="display: block"
    data-ad-client="ca-pub-5310998423283624"
    :data-ad-slot="dataAdSlot"
    :data-ad-format="format || undefined"
    :data-full-width-responsive="format ? String(format === 'auto') : undefined"
  )
  script.
    (adsbygoogle = window.adsbygoogle || []).push({});
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  props: {
    dataAdSlot: {
      type: Number,
      required: true
    },
    // AdSense shape: 'auto' (responsive), a fixed family such as 'horizontal' / 'rectangle' / 'vertical', or null for a CSS-sized unit
    format: {
      type: String,
      required: false,
      default: 'auto'
    }
  },
  setup() {}
})
</script>

<style lang="scss" src="./AppAd.component.scss"></style>
