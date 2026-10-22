<template lang="pug">
Empty(image="search" :description="$t('community.profileTab.empty')")
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import { Empty } from 'vant'

export default defineComponent({
  components: { Empty }
})
</script>
