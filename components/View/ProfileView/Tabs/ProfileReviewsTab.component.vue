<template lang="pug">
.profile-reviews-tab
  template(v-if="loading")
    .profile-reviews-tab__state
      Loading(color="var(--color-brand-02)")

  template(v-else-if="error")
    Empty(image="error" :description="$t('profile.reviewsTab.error')")
      Button(@click="reload") {{ $t('error.tryAgain') }}

  template(v-else-if="reviews.length === 0")
    Empty(:description="$t('profile.reviewsTab.empty')")

  template(v-else)
    .profile-reviews-tab__list
      .profile-reviews-tab__item(v-for="review in reviews" :key="review.id")
        NuxtLink.profile-reviews-tab__item-link(
          v-if="review.room"
          :to="localePath({ name: 'CreatorMode-CreatorModeRoom-slug', params: { slug: review.room.roomId } })"
        )
          .profile-reviews-tab__head
            .profile-reviews-tab__rating
              template(v-for="n in 5")
                AppIcon(
                  :key="n"
                  color="var(--color-warning-01)"
                  :name="n <= (review.rating || 0) ? 'tabler:star-filled' : 'tabler:star'"
                  :width="14"
                  :height="14"
                )
            Timeago.profile-reviews-tab__date(:datetime="review.createdAt" :auto-update="60" :locale="$i18n.locale")

          p.profile-reviews-tab__text(v-if="review.content") {{ review.content }}

          .profile-reviews-tab__room-row
            AppIcon(name="tabler:target" color="var(--color-text-03)" :width="14" :height="14")
            span.profile-reviews-tab__room-title {{ review.room.title }}

    InfiniteLoading(v-if="reviews.length >= PAGE_SIZE && pagination.page < pagination.pageCount" @infinite="handleInfinite")
      template(#spinner)
        Loading(color="var(--color-brand-02)" size="20")
      template(#no-more) {{ '' }}
      template(#no-results) {{ '' }}
</template>

<script>
import { defineComponent, inject, ref, computed, watch, useStore, useContext } from '@nuxtjs/composition-api'
import { Loading, Empty, Button } from 'vant'
import InfiniteLoading from 'vue-infinite-loading'

const PAGE_SIZE = 10

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

    const reviews = ref([])
    const pagination = ref({ page: 1, pageCount: 1, pageSize: PAGE_SIZE, total: 0 })
    const loading = ref(false)
    const error = ref(null)

    const playerId = computed(() => shell?.player?.value?.id || null)

    const load = async (page = 1, isLoadMore = false) => {
      if (!playerId.value) return null

      if (!isLoadMore) loading.value = true
      error.value = null

      const { data, error: err } = await store.dispatch('creator/fetchReviewsByUser', {
        userId: playerId.value,
        page,
        limit: PAGE_SIZE,
        isLoadMore
      })

      if (err) {
        error.value = err
      } else if (data) {
        reviews.value = isLoadMore ? [...reviews.value, ...(data.data || [])] : data.data || []
        pagination.value = data.meta?.pagination || pagination.value
      }

      loading.value = false

      return { data, error: err }
    }

    watch(
      playerId,
      (id, prev) => {
        if (id && id !== prev) load(1, false)
      },
      { immediate: true }
    )

    const reload = () => load(1, false)

    const handleInfinite = async $state => {
      const result = await load(pagination.value.page + 1, true)

      if (result?.error) {
        $state.error()

        return
      }

      $state.loaded()

      if (pagination.value.page >= pagination.value.pageCount) {
        $state.complete()
      }
    }

    return {
      PAGE_SIZE,
      reviews,
      pagination,
      loading,
      error,
      reload,
      handleInfinite,
      localePath
    }
  }
})
</script>

<style lang="scss" src="./ProfileReviewsTab.component.scss"></style>
