<template lang="pug">
.profile-communities
  Empty(v-if="!items.length && isLoading" :description="$t('general.loading')")
  Empty(v-else-if="!items.length && hasError" image="error" :description="$t('community.error.generic')")
    Button(@click="load(true)") {{ $t('error.tryAgain') }}
  Empty(v-else-if="!items.length" image="search" :description="$t('community.profileTab.empty')")
  .profile-communities__grid(v-else)
    CommunityCard(v-for="community in items" :key="community.documentId" :community="community")
  .profile-communities__more(v-if="items.length && hasMore")
    Button(plain round :loading="isLoading" @click="load(false)") {{ $t('community.profileTab.more') }}
</template>

<script>
import { defineComponent, useContext, useStore, ref, watch } from '@nuxtjs/composition-api'
import { Button, Empty } from 'vant'

const PAGE_SIZE = 12

export default defineComponent({
  components: { Button, Empty },
  setup() {
    const store = useStore()
    const { route } = useContext()

    const items = ref([])
    const page = ref(1)
    const hasMore = ref(false)
    const isLoading = ref(false)
    const hasError = ref(false)
    let reqId = 0

    const load = async reset => {
      const id = ++reqId
      const nextPage = reset ? 1 : page.value + 1

      isLoading.value = true
      hasError.value = false

      const { data, error } = await store.dispatch('community/fetchCommunities', {
        member: route.value.params.username,
        page: nextPage,
        pageSize: PAGE_SIZE
      })

      // stale: another profile was opened while this request was in flight
      if (id !== reqId) return

      isLoading.value = false

      if (error) {
        hasError.value = true

        return
      }

      items.value = reset ? data.items : [...items.value, ...data.items]
      page.value = nextPage
      hasMore.value = data.hasMore
    }

    watch(
      () => route.value.params.username,
      () => load(true),
      { immediate: true }
    )

    return { items, hasMore, isLoading, hasError, load }
  }
})
</script>

<style lang="scss" scoped>
.profile-communities {
  // same side gutter as the other profile tabs
  padding: 0 var(--base-p-x) 32px;

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    margin-block: var(--base-m-y);
  }

  &__more {
    display: flex;
    justify-content: center;
    margin-block: 16px;
  }
}
</style>
