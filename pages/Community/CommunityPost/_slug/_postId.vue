<template lang="pug">
.page.community-post-page
  Loading(v-if="isLoading" type="spinner")
  Empty(v-else-if="isLocked" image-size="96" :description="$t('community.detail.feedLocked')")
    template(#image)
      AppIcon(name="fluent-emoji-flat:locked" :width="96" :height="96")
  Empty(v-else-if="isNotFound" image="search" :description="$t('community.error.notFound')")
  Empty(v-else-if="!post" image="error" :description="$t('community.error.generic')")
    Button(@click="load") {{ $t('error.tryAgain') }}

  .community-post-page__body(v-else)
    CommunityPostCard(:post="post" @report="isReportOpen = true" @deleted="handleDeleted")
    h4.community-post-page__comments-title {{ $t('comments.filter.comments') }}
      span ({{ post.commentCount }})
    CommentThreadView(
      inline
      :post-id="post.documentId"
      :community-slug="post.community.slug"
      :target-comment-id="targetCommentId"
      @changed="refreshCommentCount"
    )

    MountingPortal(mount-to="body" append)
      ReportDialog(:is-open="isReportOpen" :scope="reportTypeEnum.POST" :additional="reportAdditional" @closed="isReportOpen = false")
        template(#prepend)
          ReportQuote(:post="post")
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted, useContext, useStore, useMeta, useRouter } from '@nuxtjs/composition-api'
import { Button, Empty, Loading } from 'vant'
import { reportTypeEnum } from '@/enums/report-type.enum'
import { communityPostHead } from '@/helpers/communitySeo'

export default defineComponent({
  components: { Button, Empty, Loading },
  layout: 'Default/Default.layout',
  setup() {
    const store = useStore()
    const router = useRouter()
    const { route, i18n, app } = useContext()

    const post = ref(null)
    // first comment page, only for the head's JSON-LD (the thread view loads its own)
    const seoComments = ref([])
    const isLoading = ref(true)
    const isNotFound = ref(false)
    const isLocked = ref(false)
    const isReportOpen = ref(false)

    const targetCommentId = computed(() => route.value.query.comment || null)
    const reportAdditional = computed(() => JSON.stringify({ postDocumentId: post.value?.documentId }))

    const load = async () => {
      isLoading.value = true
      isNotFound.value = false
      isLocked.value = false

      const [{ data, error }, { data: commentData }] = await Promise.all([
        store.dispatch('community/fetchPost', { documentId: route.value.params.postId }),
        store.dispatch('comment/fetchComments', { postId: route.value.params.postId })
      ])

      post.value = data
      seoComments.value = commentData?.items || []
      isNotFound.value = error?.code === 404
      isLocked.value = error?.code === 403
      isLoading.value = false
    }

    // the card's comment counter follows comments added or removed below it
    const refreshCommentCount = async () => {
      const { data } = await store.dispatch('community/fetchPost', { documentId: route.value.params.postId })

      if (data && post.value) post.value = { ...post.value, commentCount: data.commentCount }
    }

    const handleDeleted = () => router.push(app.localePath({ name: 'Community-Community-slug', params: { slug: route.value.params.slug } }))

    watch(() => route.value.params.postId, load)
    onMounted(load)

    // missing or members-only (403) posts stay out of the index
    useMeta(() =>
      post.value
        ? communityPostHead({ locale: i18n.locale, post: post.value, comments: seoComments.value })
        : { title: i18n.t('seo.main.title'), meta: [{ hid: 'robots', name: 'robots', content: 'noindex,follow' }] }
    )

    return {
      post,
      isLoading,
      isNotFound,
      isLocked,
      isReportOpen,
      reportTypeEnum,
      reportAdditional,
      targetCommentId,
      load,
      refreshCommentCount,
      handleDeleted
    }
  },
  head: {}
})
</script>

<style lang="scss" src="./CommunityPost.page.scss"></style>
