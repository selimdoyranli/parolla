<template lang="pug">
.page.creator-mode-page
</template>

<script>
import { defineComponent, useContext } from '@nuxtjs/composition-api'

export default defineComponent({
  layout: 'Default/Default.layout',
  setup() {
    const { localePath, redirect } = useContext()

    redirect(localePath({ name: 'CreatorMode-CreatorModeRooms' }))
  }
})
</script>

<style lang="scss" src="./CreatorMode.page.scss"></style>
