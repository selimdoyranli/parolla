<template lang="pug">
.app-ad(ref="root")
  //- lazy: the unit (and its push) only renders once the slot nears the viewport, so unseen ads don't eat impressions
  template(v-if="!lazy || isNear")
    script(
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5310998423283624"
      async
      crossorigin="anonymous"
    )
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
import { defineComponent, ref, onMounted, onBeforeUnmount } from '@nuxtjs/composition-api'

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
    },
    lazy: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  setup(props) {
    const root = ref(null)
    const isNear = ref(false)
    let observer = null

    onMounted(() => {
      if (!props.lazy) return

      // the page scrolls inside a layout box, not the window: rootMargin only pre-loads when that box is the root
      let scroller = root.value.parentElement
      while (scroller && !/auto|scroll/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement

      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return

          isNear.value = true
          observer.disconnect()
        },
        { root: scroller, rootMargin: '400px 0px' }
      )
      observer.observe(root.value)
    })

    onBeforeUnmount(() => observer?.disconnect())

    return { root, isNear }
  }
})
</script>

<style lang="scss" src="./AppAd.component.scss"></style>
