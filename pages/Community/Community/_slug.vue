<template lang="pug">
.page.community-page
  Empty(v-if="isLoading" :description="$t('general.loading')")
  Empty(v-else-if="isNotFound" image="search" :description="$t('community.error.notFound')")
  Empty(v-else-if="!community" image="error" :description="$t('community.error.generic')")
    Button(@click="loadCommunity") {{ $t('error.tryAgain') }}

  template(v-else)
    .community-page__hidden-banner(v-if="community.isHidden") {{ $t('community.hiddenBanner') }}

    CommunityHeader(:community="community")
      template(v-if="$auth.loggedIn" #actions)
        CommunityActionsMenu(
          :community="community"
          @open-pending="handleOpenPending"
          @open-members="handleOpenMembers"
          @open-delete="handleOpenDelete"
          @open-report="isReportOpen = true"
        )

    .community-page__body
      main.community-page__main
        .community-page__toolbar
          CommunityJoinButton(:community="community" @changed="handleChanged")
          FilterDropdown(
            :trigger-title="$t(`community.detail.feedSort.${sort}`)"
            :selected="selectedSortOption"
            :options="sortOptions"
            @on-select-option="handleSortSelect"
          )

        Empty(v-if="isLocked" image="network" :description="$t('community.detail.feedLocked')")
        Empty(v-else-if="!items.length && isFeedLoading" :description="$t('general.loading')")
        Empty(v-else-if="!items.length && hasFeedError" image="error" :description="$t('community.error.generic')")
          Button(@click="reloadFeed") {{ $t('error.tryAgain') }}
        Empty(v-else-if="!items.length" :description="$t('community.detail.feedEmpty')")
        template(v-else)
          RoomList(:items="items" :is-active-infinite-loading="false" :show-ads="false")
          InfiniteLoading(v-if="hasMore" :identifier="infiniteId" @infinite="handleInfinite")
            template(#no-more) {{ $t('community.list.noMore') }}
            template(#no-results) {{ $t('community.list.noMore') }}
            template(#error="{ trigger }")
              span {{ $t('community.error.generic') }}
              Button(size="small" @click="trigger") {{ $t('error.tryAgain') }}

      aside.community-page__side
        CommunityAboutPanel(:community="community")

    MountingPortal(mount-to="body" append)
      CommunityPendingDialog(:is-open.sync="isPendingOpen" :community="community" @changed="handleChanged")
      CommunityMembersDialog(:is-open.sync="isMembersOpen" :community="community" @changed="handleChanged")
      CommunityDeleteDialog(:is-open.sync="isDeleteOpen" :community="community")
      ReportDialog(:is-open="isReportOpen" :scope="reportTypeEnum.COMMUNITY" :additional="reportAdditional" @closed="isReportOpen = false")
</template>

<script>
import { defineComponent, useContext, useStore, ref, computed, watch, onMounted, useMeta } from '@nuxtjs/composition-api'
import { Button, Empty } from 'vant'
import InfiniteLoading from 'vue-infinite-loading'
import { reportTypeEnum } from '@/enums/report-type.enum'
import { communityViewerRoleEnum } from '@/enums/community.enum'

const SORTS = ['recent', 'popular', 'oldest']

export default defineComponent({
  components: { Button, Empty, InfiniteLoading },
  layout: 'Default/Default.layout',
  setup() {
    const store = useStore()
    const { i18n, route } = useContext()

    const community = ref(null)
    const isLoading = ref(true)
    const isNotFound = ref(false)
    const isReportOpen = ref(false)
    const sort = ref('recent')
    const isPendingOpen = ref(false)
    const isMembersOpen = ref(false)
    const isDeleteOpen = ref(false)

    const items = ref([])
    const page = ref(1)
    const hasMore = ref(false)
    const isFeedLoading = ref(false)
    const hasFeedError = ref(false)
    const isLocked = ref(false)
    const infiniteId = ref(0)
    let feedReqId = 0
    let communityReqId = 0

    const reportAdditional = computed(() => JSON.stringify({ communityDocumentId: community.value?.documentId }))
    const sortOptions = computed(() => SORTS.map(key => ({ key, label: i18n.t(`community.detail.feedSort.${key}`) })))
    const selectedSortOption = computed(() => sortOptions.value.find(option => option.key === sort.value))

    const loadFeedPage = async (nextPage, id) => {
      const { data, error } = await store.dispatch('community/fetchCommunityPosts', {
        documentId: community.value.documentId,
        sort: sort.value,
        page: nextPage
      })

      // stale: sort/community changed while this request was in flight
      if (id !== feedReqId) return { stale: true }

      if (error?.code === 403) {
        isLocked.value = true

        return { error: false }
      }

      if (error || !data) return { error: true }

      // Task 8 replaces this room-card feed with post cards
      const rooms = data.items.map(post => post.room)

      items.value = nextPage === 1 ? rooms : [...items.value, ...rooms]
      page.value = nextPage
      hasMore.value = data.hasMore

      return { error: false }
    }

    const reloadFeed = async () => {
      const id = ++feedReqId

      isFeedLoading.value = true
      hasFeedError.value = false
      isLocked.value = false
      items.value = []
      hasMore.value = false
      infiniteId.value++

      const { error } = await loadFeedPage(1, id)

      if (id !== feedReqId) return

      hasFeedError.value = !!error
      isFeedLoading.value = false
    }

    const handleInfinite = async $state => {
      const { error, stale } = await loadFeedPage(page.value + 1, feedReqId)

      if (stale) return

      if (error) return $state.error()

      hasMore.value ? $state.loaded() : $state.complete()
    }

    const handleSortSelect = ({ key }) => {
      if (key === sort.value) return

      sort.value = key
      reloadFeed()
    }

    const handleOpenPending = () => (isPendingOpen.value = true)
    const handleOpenMembers = () => (isMembersOpen.value = true)
    const handleOpenDelete = () => (isDeleteOpen.value = true)

    const isManager = () => [communityViewerRoleEnum.OWNER, communityViewerRoleEnum.MODERATOR].includes(community.value?.viewerRole)

    // returns false when the community could not be (re)loaded
    const loadCommunity = async () => {
      const id = ++communityReqId
      const { data, error } = await store.dispatch('community/fetchCommunityBySlug', { slug: route.value.params.slug })

      if (id !== communityReqId) return false

      isLoading.value = false
      isNotFound.value = error?.code === 404
      community.value = data

      return !!data
    }

    const init = async () => {
      isLoading.value = true
      community.value = null

      if (!(await loadCommunity())) return

      reloadFeed()

      if (route.value.query.panel === 'pending' && isManager()) handleOpenPending()
    }

    // join/leave/approval change counts, role and what the feed may show
    const handleChanged = async () => {
      if (await loadCommunity()) reloadFeed()
    }

    watch(() => route.value.params.slug, init)
    onMounted(init)

    useMeta(() => ({ title: community.value?.name || i18n.t('seo.main.title') }))

    return {
      community,
      isLoading,
      isNotFound,
      isReportOpen,
      isPendingOpen,
      isMembersOpen,
      isDeleteOpen,
      reportAdditional,
      reportTypeEnum,
      sort,
      sortOptions,
      selectedSortOption,
      items,
      hasMore,
      isFeedLoading,
      hasFeedError,
      isLocked,
      infiniteId,
      loadCommunity: init,
      reloadFeed,
      handleInfinite,
      handleSortSelect,
      handleChanged,
      handleOpenPending,
      handleOpenMembers,
      handleOpenDelete
    }
  },
  head: {}
})
</script>

<style lang="scss" src="./CommunityDetail.page.scss"></style>
