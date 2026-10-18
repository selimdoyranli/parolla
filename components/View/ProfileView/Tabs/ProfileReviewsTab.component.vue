<template lang="pug">
.profile-reviews-tab
  template(v-if="loading")
    .profile-reviews-tab__state
      Loading(color="var(--color-brand-02)")

  template(v-else-if="error")
    Empty(image="error" :description="$t('profile.reviewsTab.error')")
      Button(@click="reload") {{ $t('error.tryAgain') }}

  template(v-else-if="items.length === 0")
    Empty(:description="$t('profile.reviewsTab.empty')")

  template(v-else)
    .profile-reviews-tab__list
      .profile-reviews-tab__item(v-for="item in items" :key="item.documentId")
        component.profile-reviews-tab__item-link(:to="item.room ? roomLocation(item) : undefined" :is="item.room ? 'NuxtLink' : 'div'")
          .profile-reviews-tab__head
            .profile-reviews-tab__room-row(v-if="item.room")
              AppIcon(name="tabler:target" color="var(--color-text-03)" :width="14" :height="14")
              span.profile-reviews-tab__room-title {{ item.room.title }}
            Timeago.profile-reviews-tab__date(:datetime="item.createdAt" :auto-update="60" :locale="$i18n.locale")

          p.profile-reviews-tab__text
            strong.profile-reviews-tab__mention(v-if="needsMention(item)") @{{ item.replyToUser.username }}
            |
            | {{ item.content }}

    InfiniteLoading(:key="playerId" v-if="hasMore" @infinite="handleInfinite")
      template(#spinner)
        Loading(color="var(--color-brand-02)" size="20")
      template(#no-more) {{ '' }}
      template(#no-results) {{ '' }}
</template>

<script>
import { defineComponent, inject, ref, computed, watch, useStore, useContext } from '@nuxtjs/composition-api'
import { Loading, Empty, Button } from 'vant'
import InfiniteLoading from 'vue-infinite-loading'

export default defineComponent({
  components: {
    Loading,
    Empty,
    Button,
    InfiniteLoading
  },
  setup() {
    const shell = inject('profileShell')
    const store = useStore()
    const { localePath } = useContext()

    const items = ref([])
    const page = ref(0)
    const hasMore = ref(false)
    const loading = ref(false)
    const error = ref(null)

    const playerId = computed(() => shell?.player?.value?.id || null)

    const roomLocation = item =>
      localePath({
        name: 'CreatorMode-CreatorModeRoom-slug',
        params: { slug: item.room.roomId },
        query: { comment: item.parentDocumentId || item.documentId }
      })

    // Replies posted with the composer may already carry the "@name " text in their content
    const needsMention = item => item.replyToUser && !item.content.startsWith(`@${item.replyToUser.username}`)

    const load = async (isLoadMore = false) => {
      if (!playerId.value) return null

      if (!isLoadMore) {
        loading.value = true
        page.value = 0
      }

      error.value = null

      const { data, error: err } = await store.dispatch('comment/fetchByUser', { userId: playerId.value, page: page.value + 1 })

      if (err) {
        error.value = err
      } else {
        items.value = isLoadMore ? [...items.value, ...data.items] : data.items
        page.value += 1
        hasMore.value = data.hasMore
      }

      loading.value = false

      return { error: err }
    }

    watch(
      playerId,
      (id, prev) => {
        if (id && id !== prev) load()
      },
      { immediate: true }
    )

    const reload = () => load()

    const handleInfinite = async $state => {
      const result = await load(true)

      if (result?.error) {
        $state.error()

        return
      }

      $state.loaded()

      if (!hasMore.value) $state.complete()
    }

    return {
      items,
      hasMore,
      playerId,
      loading,
      error,
      reload,
      handleInfinite,
      roomLocation,
      needsMention
    }
  }
})
</script>

<style lang="scss" src="./ProfileReviewsTab.component.scss"></style>
