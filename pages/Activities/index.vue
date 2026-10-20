<template lang="pug">
div
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  middleware({ redirect, app }) {
    redirect(app.localePath({ name: 'Activities-Likes' }))
  }
})
</script>
