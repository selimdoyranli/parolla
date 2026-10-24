<template lang="pug">
Dialog.dialog.community-pending-dialog(
  :value="isOpen"
  :title="$t('community.pending.title')"
  :cancel-button-text="$t('general.close')"
  :show-cancel-button="true"
  :show-confirm-button="false"
  :close-on-click-overlay="true"
  width="min(92vw, 440px)"
  @input="$emit('update:isOpen', $event)"
)
  .community-pending-dialog__list
    p.community-pending-dialog__empty(v-if="isLoading && !items.length") {{ $t('general.loading') }}
    p.community-pending-dialog__empty(v-else-if="hasError && !items.length") {{ $t('community.error.generic') }}
    p.community-pending-dialog__empty(v-else-if="!items.length") {{ $t('community.pending.empty') }}
    .community-pending-dialog__row(v-for="item in items" :key="item.documentId")
      PlayerAvatar(with-username :user="item.user" :size="36")
      .community-pending-dialog__actions
        Button(
          type="primary"
          size="small"
          round
          native-type="button"
          :disabled="busyId === item.documentId"
          @click="handle(item, 'approveMember')"
        )
          | {{ $t('community.pending.actions.approve') }}
        Button(
          color="var(--color-danger-01)"
          size="small"
          plain
          round
          native-type="button"
          :disabled="busyId === item.documentId"
          @click="handle(item, 'rejectMember')"
        )
          | {{ $t('community.pending.actions.reject') }}
    Button(v-if="hasMore" block plain round size="small" native-type="button" :loading="isLoading" @click="loadPage(page + 1)")
      | {{ $t('general.loadMore') }}
</template>

<script>
import { defineComponent, ref, watch, useStore } from '@nuxtjs/composition-api'
import { Dialog, Button } from 'vant'
import useCommunityActions from '@/composables/useCommunityActions'

export default defineComponent({
  name: 'CommunityPendingDialog',
  components: { Dialog: Dialog.Component, Button },
  props: {
    isOpen: { type: Boolean, default: false },
    community: { type: Object, required: true }
  },
  setup(props, { emit }) {
    const store = useStore()
    const { run } = useCommunityActions()

    const items = ref([])
    const page = ref(1)
    const hasMore = ref(false)
    const isLoading = ref(false)
    const hasError = ref(false)
    const busyId = ref(null)
    let reqId = 0

    const loadPage = async nextPage => {
      const id = ++reqId

      isLoading.value = true
      hasError.value = false

      const { data, error } = await store.dispatch('community/fetchPendingMembers', {
        documentId: props.community.documentId,
        page: nextPage
      })

      // stale: dialog re-opened or another page requested meanwhile
      if (id !== reqId) return

      isLoading.value = false

      if (error || !data) {
        hasError.value = true

        return
      }

      items.value = nextPage === 1 ? data.items : [...items.value, ...data.items]
      page.value = nextPage
      hasMore.value = data.hasMore
    }

    const handle = async (item, action) => {
      busyId.value = item.documentId

      const ok = await run({
        action,
        documentId: props.community.documentId,
        memberDocumentId: item.documentId,
        confirmKey: `community.pending.actions.${action === 'approveMember' ? 'confirmApprove' : 'confirmReject'}`,
        successKey: `community.success.${action === 'approveMember' ? 'memberApproved' : 'memberRejected'}`
      })

      busyId.value = null

      if (!ok) return

      items.value = items.value.filter(row => row.documentId !== item.documentId)
      emit('changed')
    }

    watch(
      () => props.isOpen,
      open => {
        if (!open) return

        items.value = []
        hasMore.value = false
        loadPage(1)
      },
      { immediate: true }
    )

    return { items, page, hasMore, isLoading, hasError, busyId, loadPage, handle }
  }
})
</script>

<style lang="scss" src="./CommunityPendingDialog.component.scss"></style>
