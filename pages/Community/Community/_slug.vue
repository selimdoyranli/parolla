<template lang="pug">
.page.community-page
  Empty(v-if="isLoading" :description="$t('general.loading')")
  Empty(v-else-if="isNotFound" image="search" :description="$t('community.error.notFound')")
  Empty(v-else-if="!community" image="error" :description="$t('community.error.generic')")
    Button(@click="loadCommunity") {{ $t('error.tryAgain') }}

  template(v-else)
    .community-page__hidden-banner(v-if="community.isHidden") {{ $t('community.hiddenBanner') }}

    CommunityHeader(:community="community" @changed="handleChanged" @open-members="handleOpenMembers" @open-pending="handleOpenPending")
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
        CommunityPostComposer.community-page__composer(
          v-if="canPost || canGuestSeeComposer"
          :community-document-id="community.documentId"
          @posted="handlePosted"
        )
        .community-page__toolbar
          h3.community-page__feed-title
            | {{ $t('community.detail.feedTitle') }}
            span.community-page__feed-count &nbsp;({{ community.postCount || 0 }})
          FilterDropdown(
            :trigger-title="$t(`community.detail.feedSort.${sort}`)"
            :selected="selectedSortOption"
            :options="sortOptions"
            @on-select-option="handleSortSelect"
          )

        Empty(v-if="isLocked" image-size="96" :description="$t('community.detail.feedLocked')")
          template(#image)
            AppIcon(name="fluent-emoji-flat:locked" :width="96" :height="96")
        Empty(v-else-if="!items.length && isFeedLoading" :description="$t('general.loading')")
        Empty(v-else-if="!items.length && hasFeedError" image="error" :description="$t('community.error.generic')")
          Button(@click="reloadFeed") {{ $t('error.tryAgain') }}
        Empty(v-else-if="!items.length" :description="$t('community.detail.feedEmpty')")
        template(v-else)
          .community-page__posts
            CommunityPostCard(
              v-for="post in items"
              :key="post.documentId"
              with-comments
              :post="post"
              @report="handleReportPost"
              @deleted="handlePostDeleted"
            )
          InfiniteLoading(v-if="hasMore" :identifier="infiniteId" @infinite="handleInfinite")
            template(#no-more) {{ $t('community.list.noMore') }}
            template(#no-results) {{ $t('community.list.noMore') }}
            template(#error="{ trigger }")
              span {{ $t('community.error.generic') }}
              Button(size="small" @click="trigger") {{ $t('error.tryAgain') }}

    MountingPortal(mount-to="body" append)
      CommunityPendingDialog(:is-open.sync="isPendingOpen" :community="community" @changed="handleChanged")
      CommunityMembersDialog(:is-open.sync="isMembersOpen" :community="community" @changed="handleChanged")
      CommunityDeleteDialog(:is-open.sync="isDeleteOpen" :community="community")
      ReportDialog(:is-open="isReportOpen" :scope="reportTypeEnum.COMMUNITY" :additional="reportAdditional" @closed="isReportOpen = false")
        template(#prepend)
          ReportQuote(:community="community")
      ReportDialog(:is-open="!!reportedPost" :scope="reportTypeEnum.POST" :additional="postReportAdditional" @closed="reportedPost = null")
        template(#prepend)
          ReportQuote(v-if="reportedPost" :post="reportedPost")
</template>

<script>
import { defineComponent, useContext, useStore, ref, computed, watch, onMounted, useMeta } from '@nuxtjs/composition-api'
import { Button, Empty } from 'vant'
import InfiniteLoading from 'vue-infinite-loading'
import { communityHead } from '@/helpers/communitySeo'
import { reportTypeEnum } from '@/enums/report-type.enum'
import { communityViewerRoleEnum, communityPostPermissionEnum } from '@/enums/community.enum'

const SORTS = ['recent', 'popular', 'oldest']
const SORT_ICONS = { recent: 'tabler:clock', popular: 'tabler:flame', oldest: 'tabler:history' }

export default defineComponent({
  components: { Button, Empty, InfiniteLoading },
  layout: 'Default/Default.layout',
  setup() {
    const store = useStore()
    const { i18n, route, $auth } = useContext()

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

    const reportedPost = ref(null)
    const postReportAdditional = computed(() => JSON.stringify({ postDocumentId: reportedPost.value?.documentId }))
    const reportAdditional = computed(() => JSON.stringify({ communityDocumentId: community.value?.documentId }))
    const sortOptions = computed(() =>
      SORTS.map(key => ({ key, icon: SORT_ICONS[key], label: i18n.t(`community.detail.feedSort.${key}`) }))
    )
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

      // a post prepended by the composer shifts offsets, so the next page may repeat it
      const seen = new Set(items.value.map(item => item.documentId))

      items.value = nextPage === 1 ? data.items : [...items.value, ...data.items.filter(item => !seen.has(item.documentId))]
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

    const handleReportPost = post => (reportedPost.value = post)

    const handlePostDeleted = post => {
      items.value = items.value.filter(item => item.documentId !== post.documentId)
      community.value = { ...community.value, postCount: Math.max(0, community.value.postCount - 1) }
    }

    const handlePosted = post => {
      community.value = { ...community.value, postCount: (community.value.postCount || 0) + 1 }

      // the newest post belongs at the end of an oldest-first feed
      if (sort.value === 'oldest') return reloadFeed()

      items.value = [post, ...items.value]
    }

    const handleOpenPending = () => (isPendingOpen.value = true)
    const handleOpenMembers = () => (isMembersOpen.value = true)
    const handleOpenDelete = () => (isDeleteOpen.value = true)

    const isManager = () => [communityViewerRoleEnum.OWNER, communityViewerRoleEnum.MODERATOR].includes(community.value?.viewerRole)

    // mirrors the backend rule: managers always, members when everyone may post; never while hidden
    const canPost = computed(
      () =>
        !!community.value &&
        !community.value.isHidden &&
        (isManager() ||
          (community.value.viewerRole === communityViewerRoleEnum.MEMBER &&
            community.value.postPermission === communityPostPermissionEnum.EVERYONE))
    )

    // guests get the composer as a sign-in prompt where members could post
    const canGuestSeeComposer = computed(
      () =>
        !$auth.loggedIn &&
        !!community.value &&
        !community.value.isHidden &&
        community.value.postPermission === communityPostPermissionEnum.EVERYONE
    )

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

    useMeta(() =>
      community.value
        ? communityHead({ locale: i18n.locale, community: community.value, posts: isLocked.value ? [] : items.value })
        : {
            title: i18n.t('seo.main.title'),
            meta: [{ hid: 'robots', name: 'robots', content: isNotFound.value ? 'noindex,follow' : 'index,follow' }]
          }
    )

    return {
      community,
      isLoading,
      isNotFound,
      isReportOpen,
      isPendingOpen,
      isMembersOpen,
      isDeleteOpen,
      reportAdditional,
      reportedPost,
      postReportAdditional,
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
      handleReportPost,
      handlePostDeleted,
      handlePosted,
      canPost,
      canGuestSeeComposer,
      handleOpenPending,
      handleOpenMembers,
      handleOpenDelete
    }
  },
  head: {}
})
</script>

<style lang="scss" src="./CommunityDetail.page.scss"></style>
