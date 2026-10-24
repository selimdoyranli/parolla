<template lang="pug">
.page.community-page
  h2.community-page__title {{ $t('community.edit.title') }}
  Loading(v-if="isLoading" type="spinner")
  template(v-else-if="community")
    CommunityComposeForm(mode="edit" :community="community")
    section.community-page__danger
      h3 {{ $t('community.edit.dangerZone') }}
      Button(type="danger" plain round block native-type="button" @click="isDeleteOpen = true") {{ $t('community.delete.confirmButton') }}
    CommunityDeleteDialog(:is-open.sync="isDeleteOpen" :community="community")
  Empty(v-else image="search" :description="$t('community.error.notFound')")
</template>

<script>
import { defineComponent, ref, useStore, useRoute, useRouter, useContext, onMounted } from '@nuxtjs/composition-api'
import { Empty, Loading, Button } from 'vant'
import { communityViewerRoleEnum } from '@/enums/community.enum'

export default defineComponent({
  components: { Empty, Loading, Button },
  layout: 'Default/Default.layout',
  middleware: ['auth-control'],
  setup() {
    const store = useStore()
    const route = useRoute()
    const router = useRouter()
    const { localePath } = useContext()
    const community = ref(null)
    const isLoading = ref(true)
    const isDeleteOpen = ref(false)

    onMounted(async () => {
      const { slug } = route.value.params
      const { data } = await store.dispatch('community/fetchCommunityBySlug', { slug })

      // only the owner edits; everyone else goes back to the detail page
      if (data && data.viewerRole !== communityViewerRoleEnum.OWNER) {
        router.replace(localePath({ name: 'Community-Community-slug', params: { slug } }))

        return
      }

      community.value = data
      isLoading.value = false
    })

    return { community, isLoading, isDeleteOpen }
  },
  // owner/manager-only settings: nothing to index
  head() {
    return {
      title: `${this.$t('community.edit.title')} - ${this.$t('seo.main.title')}`,
      meta: [{ hid: 'robots', name: 'robots', content: 'noindex,nofollow' }]
    }
  }
})
</script>

<style lang="scss" scoped>
.community-page {
  width: calc(100% - (var(--base-p-x) * 2));
  max-width: 640px;
  margin: var(--base-m-y) auto;

  &__title {
    color: var(--color-text-01);
  }

  &__danger {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border-02);
  }
}
</style>
