<template lang="pug">
.page.main-page
  IntroScene
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
const { getQuery } = require('ufo')
import { Notify } from 'vant'

export default defineComponent({
  layout: 'Default/Default.layout',
  setup() {
    const query = getQuery(window.location.href)

    if (query.access_token) {
      window.history.pushState(null, null, window.location.pathname)

      setTimeout(() => {
        Notify({
          message: 'Login successful',
          color: 'var(--color-text-04)',
          background: 'var(--color-success-01)',
          duration: 1000
        })
      }, 1000)
    }
  }
})
</script>

<style lang="scss" src="./Main.page.scss"></style>
