<template lang="pug">
.page.gm-panel-page
  GmPanel(:description="$t('gmPanel.communities.description')")
    Empty(image="search" :description="$t('gmPanel.communities.empty')")
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import { Empty } from 'vant'

export default defineComponent({
  components: { Empty },
  layout: 'Default/Default.layout',
  middleware: ['gm-control']
})
</script>
