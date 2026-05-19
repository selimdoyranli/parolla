<template lang="pug">
.page.profile-page
  .profile-page__stub Profile shell stub — {{ username }}
  nuxt-child
</template>

<script>
import { defineComponent, useRoute, computed } from '@nuxtjs/composition-api'

export default defineComponent({
  layout: 'Default/Default.layout',
  setup() {
    const route = useRoute()
    const username = computed(() => route.value.params.username)

    return { username }
  }
})
</script>
