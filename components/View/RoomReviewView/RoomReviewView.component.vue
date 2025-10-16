<template lang="pug">
.room-review-view
  LazyRoomReviewForm(v-if="isOpenRoomReviewForm" @onClickBackButton="closeRoomReviewForm" @onSuccess="handleSuccessRoomReviewForm")

  template(v-else)
    template(v-if="fetchState.pending")
      Empty(:description="$t('dialog.roomReview.pendingReviews')")

    template(v-else-if="fetchState.error")
      Empty(image="error" :description="$t('dialog.roomReview.error.fetchReviews.description')")
        Button(@click="fetch") {{ $t('dialog.roomReview.error.fetchReviews.action') }}

    template(v-else)
      NoticeBar.mb-2.mt-2.cursor-pointer(v-if="!$auth.loggedIn && !$auth.user" auth-control wrapable)
        small(v-html="$t('dialog.roomReview.loginToReview')")

      RoomReviewList.room-review-view__list(
        :items="review.list"
        :rating="String(room.rating)"
        @onClickOpenRoomReviewForm="openRoomReviewForm"
      )
        template(#openFormButton)
          Button.room-review-view__openFormButton.room-review-view__openFormButton--desktop(
            v-if="!isOpenRoomReviewForm && review.list && review.list.length > 0"
            icon="smile-comment-o"
            auth-control
            @click="openRoomReviewForm"
          ) {{ $t('dialog.roomReview.review') }}

          Button.room-review-view__openFormButton.room-review-view__openFormButton--mobile(
            v-if="!isOpenRoomReviewForm && review.list && review.list.length > 0"
            icon="plus"
            size="small"
            auth-control
            @click="openRoomReviewForm"
          )
</template>

<script>
import { defineComponent, useStore, useFetch, ref, reactive, watch, computed } from '@nuxtjs/composition-api'
import { gameModeKeyEnum } from '@/enums'
import { roomReviewTransformer } from '@/transformers'
import { Button, Empty, NoticeBar } from 'vant'

export default defineComponent({
  components: {
    Button,
    Empty,
    NoticeBar
  },
  setup() {
    const store = useStore()

    const { activeGameMode } = useGameMode()

    const room = computed(() => store.getters['creator/room'])

    const isOpenRoomReviewForm = ref(false)

    const review = reactive({
      rating: null,
      list: []
    })

    const fetchReviews = async () => {
      if (activeGameMode.value === gameModeKeyEnum.CREATOR) {
        const { data, error } = await store.dispatch('creator/fetchReviews', {
          roomId: room.value.id
        })

        if (data) {
          const reviews = data.data

          review.rating = reviews.rating
          review.list = reviews.map(review => roomReviewTransformer(review))
        }
      }
    }

    const { fetch, fetchState } = useFetch(async () => {
      await fetchReviews()
    })

    const openRoomReviewForm = () => {
      isOpenRoomReviewForm.value = true
    }

    const closeRoomReviewForm = () => {
      isOpenRoomReviewForm.value = false
    }

    const handleSuccessRoomReviewForm = () => {
      fetch()
      closeRoomReviewForm()
    }

    return {
      fetch,
      fetchState,
      room,
      isOpenRoomReviewForm,
      review,
      openRoomReviewForm,
      closeRoomReviewForm,
      handleSuccessRoomReviewForm
    }
  }
})
</script>

<style lang="scss" src="./RoomReviewView.component.scss"></style>
