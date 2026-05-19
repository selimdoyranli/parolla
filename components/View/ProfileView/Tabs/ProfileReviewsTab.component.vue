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
        .profile-reviews-tab__head
          .profile-reviews-tab__rating
            template(v-for="n in 5")
              AppIcon(
                :key="n"
                color="var(--color-warning-01)"
                :name="n <= (review.attributes.rating || 0) ? 'tabler:star-filled' : 'tabler:star'"
                :width="14"
                :height="14"
              )
          Timeago.profile-reviews-tab__date(:datetime="review.attributes.createdAt" :auto-update="60" :locale="$i18n.locale")

        p.profile-reviews-tab__text(v-if="review.attributes.text") {{ review.attributes.text }}

        NuxtLink.profile-reviews-tab__room(
          v-if="review.attributes.room && review.attributes.room.data"
          :to="localePath({ name: 'CreatorMode-CreatorModeRoom-slug', params: { slug: review.attributes.room.data.attributes.roomId } })"
        )
          AppIcon(name="tabler:target" color="var(--color-text-03)" :width="14" :height="14")
          span.profile-reviews-tab__room-title {{ review.attributes.room.data.attributes.title }}

    Button.profile-reviews-tab__more(
      v-if="pagination.page < pagination.pageCount"
      plain
      round
      size="small"
      :loading="loadingMore"
      @click="loadMore"
    ) {{ $t('general.loadMore') }}
</template>

<script>
import { defineComponent, inject, ref, computed, watch } from '@nuxtjs/composition-api'
import { useStore, useContext } from '@nuxtjs/composition-api'
import { Loading, Empty, Button } from 'vant'

const PAGE_SIZE = 10

export default defineComponent({
  components: {
    Loading,
    Empty,
    Button
  },
  setup() {
    const shell = inject('profileShell')
    const store = useStore()
    const { localePath } = useContext()

    const reviews = ref([])
    const pagination = ref({ page: 1, pageCount: 1, pageSize: PAGE_SIZE, total: 0 })
    const loading = ref(false)
    const loadingMore = ref(false)
    const error = ref(null)

    const playerId = computed(() => shell?.player?.value?.id || null)

    const load = async (page = 1, isLoadMore = false) => {
      if (!playerId.value) return

      if (isLoadMore) loadingMore.value = true
      else loading.value = true
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
      loadingMore.value = false
    }

    watch(
      playerId,
      (id, prev) => {
        if (id && id !== prev) load(1, false)
      },
      { immediate: true }
    )

    const loadMore = () => load(pagination.value.page + 1, true)
    const reload = () => load(1, false)

    return {
      reviews,
      pagination,
      loading,
      loadingMore,
      error,
      loadMore,
      reload,
      localePath
    }
  }
})
</script>

<style lang="scss" src="./ProfileReviewsTab.component.scss"></style>
