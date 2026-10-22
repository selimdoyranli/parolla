<template lang="pug">
Dialog.dialog.notifications-dialog(
  v-model="state.isOpen"
  :title="$t('notifications.title')"
  :cancel-button-text="$t('general.close')"
  :show-confirm-button="false"
  :show-cancel-button="true"
  :close-on-click-overlay="false"
  @closed="$emit('closed')"
)
  Tabs(v-model="activeTab" color="var(--color-brand-02)" animated @change="reset")
    Tab(v-for="tab in tabs" :key="tab.key" :name="tab.key" :title="tab.title")
  List(
    v-if="state.isOpen"
    ref="listRef"
    v-model="list.loading"
    :finished="list.finished"
    :error.sync="list.error"
    :error-text="$t('comments.error')"
    @load="load"
  )
    NotificationItem(v-for="item in list.items" :key="item.ids.join('-')" :item="item" @select="handleSelect")
    Empty(v-if="list.finished && !list.items.length" :description="$t('notifications.empty')")
</template>

<script>
import { defineComponent, computed, reactive, ref, watch, nextTick, useContext, useRouter, useStore } from '@nuxtjs/composition-api'
import { Dialog, Tab, Tabs, List, Empty } from 'vant'

export default defineComponent({
  components: {
    Dialog: Dialog.Component,
    Tab,
    Tabs,
    List,
    Empty
  },
  props: {
    isOpen: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  setup(props) {
    const store = useStore()
    const router = useRouter()
    const { i18n, localePath } = useContext()

    const state = reactive({ isOpen: props.isOpen })
    const activeTab = ref('all')
    const tabs = computed(() => ['all', 'quizzes', 'interactions'].map(key => ({ key, title: i18n.t(`notifications.tabs.${key}`) })))
    const listRef = ref(null)
    const list = reactive({ items: [], page: 0, loading: false, finished: false, error: false })

    const reset = () => {
      Object.assign(list, { items: [], page: 0, loading: false, finished: false, error: false })
      // van-list only re-checks on loading/finished changes, so nudge it for a tab switch
      nextTick(() => listRef.value?.check())
    }

    watch(
      () => props.isOpen,
      value => {
        state.isOpen = value

        if (value) {
          activeTab.value = 'all'
          reset()
        }
      }
    )

    const load = async () => {
      const tab = activeTab.value
      const { data, error } = await store.dispatch('notification/fetchNotifications', { category: tab, page: list.page + 1 })

      // tab switched or dialog reset while the request was in flight
      if (tab !== activeTab.value) return

      list.loading = false

      if (error) {
        list.error = true

        return
      }

      list.items.push(...data.items)
      list.page += 1
      list.finished = !data.hasMore

      const unreadIds = data.items.filter(i => !i.isRead).flatMap(i => i.ids)

      // opening the dialog marks what was shown as read; items keep their unread look until next open
      if (unreadIds.length) store.dispatch('notification/markRead', { ids: unreadIds })
    }

    const handleSelect = item => {
      // post comments, replies and likes open the post page (comment-targeted ones highlight the comment)
      if (item.meta?.postDocumentId && item.meta?.communitySlug) {
        state.isOpen = false

        router.push(
          localePath({
            name: 'Community-CommunityPost-slug-postId',
            params: { slug: item.meta.communitySlug, postId: item.meta.postDocumentId },
            query: item.comment ? { comment: item.comment.documentId } : {}
          })
        )

        return
      }

      if (item.meta?.communitySlug && !item.room) {
        state.isOpen = false

        router.push(
          localePath({
            name: 'Community-Community-slug',
            params: { slug: item.meta.communitySlug },
            query: item.type === 'community_join_requested' ? { panel: 'pending' } : {}
          })
        )

        return
      }

      // announcements are read in place; nothing to open
      if (!item.room) return

      state.isOpen = false

      router.push(
        localePath({
          name: 'CreatorMode-CreatorModeRoom-slug',
          params: { slug: item.room.roomId },
          // a rating notification points at the rater's row in the Puanlar list
          query: item.comment
            ? { comment: item.comment.documentId }
            : item.type === 'room_rated' && item.actor
            ? { rating: item.actor.id }
            : {}
        })
      )
    }

    return { state, listRef, activeTab, tabs, list, load, reset, handleSelect }
  }
})
</script>

<style lang="scss" src="./NotificationsDialog.component.scss"></style>
