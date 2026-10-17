<template lang="pug">
.page
</template>

<script>
import { defineComponent, useContext } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'GmPanelPage',
  middleware: ['gm-control'],
  setup() {
    const { localePath, redirect } = useContext()

    redirect(localePath({ name: 'GmPanel-Wordblock' }))
  }
})
</script>
