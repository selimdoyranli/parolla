<template lang="pug">
.page.community-list-page
  .community-list-page__inner
    .community-list-page__header
      h2.community-list-page__title {{ $t('community.list.title') }}
      Button(
        v-if="$auth.loggedIn"
        color="#ff7878"
        icon="plus"
        round
        size="normal"
        @click="$router.push(localePath({ name: 'Community-CommunityCompose' }))"
      ) {{ $t('community.list.createButton') }}

    .community-list-page__filters
      Search.community-list-page__search(
        v-model="keyword"
        :placeholder="$t('community.list.search')"
        :clearable="true"
        @input="handleSearchInput"
      )
      FilterDropdown(
        :trigger-title="$t(`community.list.sort.${sort}`)"
        :selected="selectedSortOption"
        :options="sortOptions"
        @on-select-option="handleSortSelect"
      )

    .community-list-page__tags(v-if="tagOptions.length")
      button.community-list-page__tag(
        v-for="tag in tagOptions"
        :key="tag"
        type="button"
        :class="{ 'is-active': tag === activeTag }"
        @click="handleTagClick(tag)"
      ) \#{{ tag }}

    Empty(v-if="!items.length && isLoading" :description="$t('general.loading')")
    Empty(v-else-if="!items.length && hasError" image="error" :description="$t('community.error.generic')")
      Button(@click="reload") {{ $t('error.tryAgain') }}
    Empty(v-else-if="!items.length" :description="$t('community.list.empty')")
    .community-list-page__grid(v-else)
      template(v-for="cell in cells")
        .community-list-page__ad(:key="cell.key" v-if="cell.type === 'ad'")
          small.community-list-page__ad-label {{ $t('general.ad') }}
          AppAd(lazy format="rectangle" :data-ad-slot="6048083070")
        CommunityCard(v-else :key="cell.key" :community="cell.community")

    InfiniteLoading(v-if="items.length && hasMore" :identifier="infiniteId" @infinite="handleInfinite")
      template(#no-more) {{ $t('community.list.noMore') }}
      template(#no-results) {{ $t('community.list.noMore') }}
      template(#error="{ trigger }")
        span {{ $t('community.error.generic') }}
        Button(size="small" @click="trigger") {{ $t('error.tryAgain') }}
</template>

<script>
import { defineComponent, useContext, useRouter, useStore, ref, computed, watch, onMounted, useMeta } from '@nuxtjs/composition-api'
import { useDebounceFn } from '@vueuse/core'
import { Button, Empty, Search } from 'vant'
import InfiniteLoading from 'vue-infinite-loading'

const PAGE_SIZE = 12
const MAX_TAGS = 10
const MAX_ADS = 4
const SORTS = ['recent', 'memberCount', 'roomCount']

// outlives the page component: coming back from a community keeps the loaded pages and the scroll spot
const listMemory = { key: null, items: [], page: 1, hasMore: false, scrollTop: 0 }

export default defineComponent({
  components: { Button, Empty, Search, InfiniteLoading },
  beforeRouteLeave(to, from, next) {
    this.rememberPosition()
    next()
  },
  layout: 'Default/Default.layout',
  setup() {
    const router = useRouter()
    const store = useStore()
    const { i18n, route, localePath, getRouteBaseName } = useContext()

    const sort = computed(() => (SORTS.includes(route.value.query.sort) ? route.value.query.sort : 'recent'))
    const activeTag = computed(() => route.value.query.tag || '')
    const search = computed(() => route.value.query.search || '')
    const keyword = ref(search.value)

    const listKey = () => [sort.value, activeTag.value, search.value, i18n.locale].join('|')

    const items = ref([])
    const page = ref(1)
    const hasMore = ref(false)
    const isLoading = ref(false)
    const infiniteId = ref(0)
    const hasError = ref(false)
    let reqId = 0
    const knownTags = ref([])

    const scroller = () => document.querySelector('.layout__main')
    const rememberPosition = () => {
      Object.assign(listMemory, {
        key: listKey(),
        items: items.value,
        page: page.value,
        hasMore: hasMore.value,
        scrollTop: scroller()?.scrollTop || 0
      })
    }

    const load = async (nextPage, id) => {
      const { data, error } = await store.dispatch('community/fetchCommunities', {
        sort: sort.value,
        search: search.value || undefined,
        tag: activeTag.value || undefined,
        page: nextPage,
        pageSize: PAGE_SIZE
      })

      // stale: filters changed while this request was in flight
      if (id !== reqId) return { stale: true }

      if (error || !data) return { error: true }

      items.value = nextPage === 1 ? data.items : [...items.value, ...data.items]
      page.value = nextPage
      hasMore.value = data.hasMore

      return { error: false }
    }

    const reload = async () => {
      const id = ++reqId

      isLoading.value = true
      hasError.value = false
      items.value = []
      infiniteId.value++

      const { error } = await load(1, id)

      if (id !== reqId) return

      hasError.value = !!error
      isLoading.value = false
    }

    const handleInfinite = async $state => {
      const { error, stale } = await load(page.value + 1, reqId)

      if (stale) return

      if (error) return $state.error()

      hasMore.value ? $state.loaded() : $state.complete()
    }

    const goto = query => {
      const next = { ...route.value.query, ...query }

      Object.keys(next).forEach(key => !next[key] && delete next[key])
      router.replace(localePath({ name: 'Community-CommunityList', query: next }))
    }

    const applySearch = useDebounceFn(() => goto({ search: keyword.value.trim() }), 300)
    const handleSearchInput = () => applySearch()
    const handleTagClick = tag => goto({ tag: tag === activeTag.value ? '' : tag })

    const sortOptions = computed(() => SORTS.map(key => ({ key, label: i18n.t(`community.list.sort.${key}`) })))
    const selectedSortOption = computed(() => sortOptions.value.find(option => option.key === sort.value))
    const handleSortSelect = ({ key }) => goto({ sort: key === 'recent' ? '' : key })

    // tags of the loaded communities (no extra endpoint), plus the active one so it can be switched off
    watch(items, value => {
      const tags = new Set(knownTags.value)

      value.forEach(community => (community.tags || []).forEach(tag => tags.add(tag)))
      knownTags.value = [...tags]
    })
    const tagOptions = computed(() => {
      const tags = knownTags.value.slice(0, MAX_TAGS)

      return activeTag.value && !tags.includes(activeTag.value) ? [activeTag.value, ...tags.slice(0, MAX_TAGS - 1)] : tags
    })

    // a card-sized ad after every 4 communities, capped like RoomList
    const cells = computed(() => {
      const result = []
      let ads = 0

      items.value.forEach((community, index) => {
        result.push({ type: 'community', community, key: community.documentId })

        if (ads < MAX_ADS && (index + 1) % 4 === 0) {
          ads++
          result.push({ type: 'ad', key: `ad-${index}` })
        }
      })

      return result
    })

    watch(
      () => route.value.query,
      () => {
        // leaving for a community page: the query is gone, nothing to reload
        if (getRouteBaseName(route.value) !== getRouteBaseName({ name: 'Community-CommunityList' })) return

        if (listKey() === listMemory.key && listMemory.items === items.value) return

        keyword.value = search.value
        reload()
      }
    )

    onMounted(() => {
      if (listMemory.key === listKey() && listMemory.items.length) {
        items.value = listMemory.items
        page.value = listMemory.page
        hasMore.value = listMemory.hasMore
        setTimeout(() => scroller()?.scrollTo(0, listMemory.scrollTop))
      } else {
        reload()
      }
    })

    useMeta(() => ({
      title: `${i18n.t('seo.communityList.title')} - ${i18n.t('seo.main.title')}`,
      meta: [
        { hid: 'description', name: 'description', content: i18n.t('seo.communityList.description') },
        { hid: 'og:title', name: 'og:title', content: `${i18n.t('seo.communityList.title')} - ${i18n.t('seo.main.title')}` },
        { hid: 'twitter:title', name: 'twitter:title', content: `${i18n.t('seo.communityList.title')} - ${i18n.t('seo.main.title')}` },
        { hid: 'og:description', name: 'og:description', content: i18n.t('seo.communityList.description') },
        { hid: 'twitter:description', name: 'twitter:description', content: i18n.t('seo.communityList.description') }
      ]
    }))

    return {
      keyword,
      sort,
      activeTag,
      items,
      cells,
      hasMore,
      isLoading,
      hasError,
      reload,
      infiniteId,
      tagOptions,
      sortOptions,
      selectedSortOption,
      handleSearchInput,
      handleTagClick,
      handleSortSelect,
      handleInfinite,
      rememberPosition
    }
  },
  head: {}
})
</script>

<style lang="scss" src="./CommunityList.page.scss"></style>
