<template lang="pug">
.page.community-post-page
  Loading(v-if="isLoading" type="spinner")
  // Task 9 builds the post detail UI
  Empty(v-else-if="!post" image="search" :description="$t('community.error.notFound')")
</template>

<script>
import { defineComponent, ref, onMounted, useRoute, useStore } from '@nuxtjs/composition-api'
import { Empty, Loading } from 'vant'

export default defineComponent({
  components: { Empty, Loading },
  layout: 'Default/Default.layout',
  setup() {
    const store = useStore()
    const route = useRoute()
    const post = ref(null)
    const isLoading = ref(true)

    onMounted(async () => {
      const { data } = await store.dispatch('community/fetchPost', { documentId: route.value.params.postId })

      post.value = data
      isLoading.value = false
    })

    return { post, isLoading }
  }
})
</script>
