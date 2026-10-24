<template lang="pug">
Dialog.dialog.room-review-dialog(
  v-model="state.isOpen"
  get-container="body"
  :title="$t('dialog.roomReview.title')"
  :cancel-button-text="cancelButtonText || $t('general.close')"
  :show-confirm-button="false"
  :show-cancel-button="true"
  :close-on-click-overlay="false"
  @closed="$emit('closed')"
  @opened="$emit('opened')"
)
  RoomReviewView(:key="viewKey" :target-comment-id="targetCommentId" :target-rating-user-id="targetRatingUserId")
</template>

<script>
import { defineComponent, ref, reactive, watch } from '@nuxtjs/composition-api'
import { Dialog } from 'vant'

export default defineComponent({
  components: {
    Dialog: Dialog.Component
  },
  props: {
    isOpen: {
      type: Boolean,
      required: false,
      default: false
    },
    targetCommentId: {
      type: String,
      required: false,
      default: null
    },
    // user id from ?rating=; the view switches to Puanlar and flashes that player's row
    targetRatingUserId: {
      type: [String, Number],
      required: false,
      default: null
    },
    cancelButtonText: {
      type: String,
      required: false,
      default: null
    }
  },
  setup(props) {
    const state = reactive({
      isOpen: props.isOpen
    })

    watch(
      () => props.isOpen,
      value => {
        state.isOpen = value
      }
    )

    // remount the view on every open so it reloads
    const viewKey = ref(0)

    watch(
      () => state.isOpen,
      value => {
        if (value) viewKey.value += 1
      }
    )

    return {
      state,
      viewKey
    }
  }
})
</script>

<style lang="scss" src="./RoomReviewDialog.component.scss"></style>
