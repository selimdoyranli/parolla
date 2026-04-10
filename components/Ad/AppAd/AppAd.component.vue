<template lang="pug">
.rota-block
  a.rota-block(
    href="https://rota.tips?utm_source=parolla.app"
    title="Şehir Rehberi & Gezi Planlayıcı | Mekan Keşfet"
    rel="noopener noreferrer"
    target="_blank"
  )
    img.rota-block__image(src="/block/rota.jpeg" alt="Şehir Rehberi & Gezi Planlayıcı | Mekan Keşfet" decoding="async")
  //
    script(src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5310998423283624" async crossorigin="anonymous")
    ins.adsbygoogle(
      style="display: block"
      data-ad-client="ca-pub-5310998423283624"
      :data-ad-slot="dataAdSlot"
      data-ad-format="auto"
      data-full-width-responsive="true"
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
    }
  },
  setup() {}
})
</script>

<style lang="scss" src="./AppAd.component.scss"></style>
