<template lang="pug">
Dialog.dialog.community-members-dialog(
  :value="isOpen"
  :title="$t('community.members.title')"
  :cancel-button-text="$t('general.close')"
  :show-cancel-button="true"
  :show-confirm-button="false"
  :close-on-click-overlay="true"
  @input="$emit('update:isOpen', $event)"
)
  .community-members-dialog__list
    p.community-members-dialog__empty(v-if="isLoading && !items.length") {{ $t('general.loading') }}
    p.community-members-dialog__empty(v-else-if="hasError && !items.length") {{ $t('community.error.generic') }}
    p.community-members-dialog__empty(v-else-if="!items.length") {{ $t('community.members.empty') }}
    .community-members-dialog__row(v-for="item in items" :key="`${item.role}-${item.documentId}`")
      PlayerAvatar(with-username :user="item.user" :size="36")
      span.community-members-dialog__role(v-if="item.role !== 'member'" :class="`community-members-dialog__role--${item.role}`")
        | {{ $t(`community.members.role.${item.role}`) }}
      .community-members-dialog__actions
        Button(
          v-if="canPromote(item)"
          size="small"
          plain
          round
          native-type="button"
          :disabled="busyId === item.documentId"
          @click="handle(item, 'promote')"
        )
          | {{ $t('community.members.actions.promote') }}
        Button(
          v-if="canDemote(item)"
          size="small"
          plain
          round
          native-type="button"
          :disabled="busyId === item.documentId"
          @click="handle(item, 'demote')"
        )
          | {{ $t('community.members.actions.demote') }}
        Button(
          v-if="canKick(item)"
          type="danger"
          size="small"
          plain
          round
          native-type="button"
          :disabled="busyId === item.documentId"
          @click="handle(item, 'kick')"
        )
          | {{ $t('community.members.actions.kick') }}
    Button(v-if="hasMore" block plain round size="small" native-type="button" :loading="isLoading" @click="loadPage(page + 1)")
      | {{ $t('general.loadMore') }}
</template>

<script>
import { defineComponent, ref, computed, watch, useStore, useContext } from '@nuxtjs/composition-api'
import { Dialog, Button } from 'vant'
import useCommunityActions from '@/composables/useCommunityActions'
import { communityViewerRoleEnum } from '@/enums/community.enum'
import { isGmUser } from '@/helpers/chat-command'

const ROLE = { OWNER: 'owner', MODERATOR: 'moderator', MEMBER: 'member' }
const cap = value => value.charAt(0).toUpperCase() + value.slice(1)

export default defineComponent({
  name: 'CommunityMembersDialog',
  components: { Dialog: Dialog.Component, Button },
  props: {
    isOpen: { type: Boolean, default: false },
    community: { type: Object, required: true }
  },
  setup(props, { emit }) {
    const store = useStore()
    const { $auth } = useContext()
    const { run } = useCommunityActions()

    const items = ref([])
    const page = ref(1)
    const hasMore = ref(false)
    const isLoading = ref(false)
    const hasError = ref(false)
    const busyId = ref(null)
    let reqId = 0

    // mirrors the server matrix (spec 3.3): owner/GM act on members and moderators, moderators only kick members, nobody touches the owner
    const isFullAccess = computed(() => props.community.viewerRole === communityViewerRoleEnum.OWNER || isGmUser($auth.user))
    const isModerator = computed(() => props.community.viewerRole === communityViewerRoleEnum.MODERATOR)

    const canKick = item => item.role !== ROLE.OWNER && (isFullAccess.value || (isModerator.value && item.role === ROLE.MEMBER))
    const canPromote = item => isFullAccess.value && item.role === ROLE.MEMBER
    const canDemote = item => isFullAccess.value && item.role === ROLE.MODERATOR

    const loadPage = async nextPage => {
      const id = ++reqId

      isLoading.value = true
      hasError.value = false

      const { data, error } = await store.dispatch('community/fetchMembers', {
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

    const handle = async (item, kind) => {
      busyId.value = item.documentId

      const ok = await run({
        action: `${kind}Member`,
        documentId: props.community.documentId,
        memberDocumentId: item.documentId,
        confirmKey: `community.members.actions.confirm${cap(kind)}`,
        successKey: `community.success.member${cap(kind)}${kind === 'kick' ? 'ed' : 'd'}`
      })

      busyId.value = null

      if (!ok) return

      if (kind === 'kick') items.value = items.value.filter(row => row.documentId !== item.documentId)
      else items.value = items.value.map(row => (row === item ? { ...row, role: kind === 'promote' ? ROLE.MODERATOR : ROLE.MEMBER } : row))

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

    return { items, page, hasMore, isLoading, hasError, busyId, loadPage, handle, canKick, canPromote, canDemote }
  }
})
</script>

<style lang="scss" src="./CommunityMembersDialog.component.scss"></style>
