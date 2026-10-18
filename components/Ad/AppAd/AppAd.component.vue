<template lang="pug">
.app-ad
  script(src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5310998423283624" async crossorigin="anonymous")
  //- full-width-responsive grows a fixed shape (e.g. horizontal) into a tall block on phones; only 'auto' may do that
  ins.adsbygoogle(
    style="display: block"
    data-ad-client="ca-pub-5310998423283624"
    :data-ad-slot="dataAdSlot"
    :data-ad-format="format"
    :data-full-width-responsive="format === 'auto' ? 'true' : 'false'"
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
    // AdSense shape: 'auto' (responsive) or a fixed family such as 'horizontal' / 'rectangle' / 'vertical'
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
