<template lang="pug">
.page.community-page
  h2.community-page__title {{ $t('community.edit.title') }}
  Empty(image="search" :description="$t('community.edit.title')")
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import { Empty } from 'vant'

export default defineComponent({
  components: { Empty },
  layout: 'Default/Default.layout',
  middleware: ['auth-control']
})
</script>
