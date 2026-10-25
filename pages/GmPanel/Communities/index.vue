<template lang="pug">
.page.gm-panel-page
  GmPanel(:description="$t('gmPanel.communities.description')")
    CellGroup.gm-panel__group(inset)
      Search(v-model="search" :placeholder="$t('gmPanel.communities.search')" @input="handleSearch")
      Cell(center :title="$t('gmPanel.communities.onlyHidden')")
        template(#right-icon)
          VanSwitch(v-model="onlyHidden" size="22px")
      Cell(center :title="$t('gmPanel.communities.onlyAiFlagged')")
        template(#right-icon)
          VanSwitch(v-model="onlyAiFlagged" size="22px")

    Loading(v-if="isLoading && !items.length" color="var(--color-brand-02)")
    Empty(v-else-if="hasError" image="error" :description="$t('community.error.generic')")
      Button(@click="load(true)") {{ $t('error.tryAgain') }}
    Empty(v-else-if="!items.length" image="search" :description="$t('gmPanel.communities.empty')")

    template(v-else)
      CellGroup.gm-panel__group(v-for="item in items" :key="item.documentId" inset)
        Cell(
          :label="rowLabel(item)"
          center
          is-link
          :to="localePath({ name: 'Community-Community-slug', params: { slug: item.slug } })"
          :title="item.name"
        )
          template(#right-icon)
            Tag(v-if="item.isHidden" type="warning" round) {{ $t('gmPanel.communities.hidden') }}
        Cell(
          v-if="item.isHidden && item.moderationNote"
          :label="`${item.moderationSource || ''} ${item.moderationNote}`.trim()"
          :title="$t('gmPanel.communities.note')"
        )
        Cell(v-if="item.aiModerationFlag" :label="item.aiModerationFlag" :title="$t('gmPanel.communities.aiFlag')")
        .gm-panel__actions
          Button(v-if="!item.isHidden" v-bind="btn(item)" @click="askHide(item)") {{ $t('gmPanel.communities.hide') }}
          Button(v-else v-bind="btn(item)" @click="unhide(item)") {{ $t('gmPanel.communities.unhide') }}
          Button(v-if="item.aiModerationFlag" v-bind="btn(item)" @click="dismissAiFlag(item)") {{ $t('gmPanel.communities.dismissAiFlag') }}
          Button(v-bind="btn(item, true)" type="danger" @click="remove(item)") {{ $t('gmPanel.communities.delete') }}
      .gm-panel__actions(v-if="hasMore")
        Button(plain round block :loading="isLoading" @click="load(false)") {{ $t('community.profileTab.more') }}

    Dialog(
      v-model="hideDialog.isOpen"
      show-cancel-button
      :title="$t('gmPanel.communities.hide')"
      :message="$t('gmPanel.communities.confirmHide')"
      @confirm="hide"
    )
      Field(
        v-model="hideDialog.note"
        type="textarea"
        :placeholder="$t('gmPanel.communities.notePlaceholder')"
        rows="2"
        autosize
        maxlength="1000"
      )
</template>

<script>
import { defineComponent, useContext, useStore, ref, reactive, watch } from '@nuxtjs/composition-api'
import { useDebounceFn } from '@vueuse/core'
import { Loading, Empty, Button, Cell, CellGroup, Field, Search, Switch, Tag, Dialog } from 'vant'
import { showToast } from '@/helpers/toast'

export default defineComponent({
  name: 'GmPanelCommunitiesPage',
  components: { Loading, Empty, Button, Cell, CellGroup, Field, Search, VanSwitch: Switch, Tag, Dialog: Dialog.Component },
  layout: 'Default/Default.layout',
  middleware: ['gm-control'],
  setup() {
    const { i18n } = useContext()
    const store = useStore()

    const search = ref('')
    const onlyHidden = ref(false)
    const onlyAiFlagged = ref(false)
    const items = ref([])
    const page = ref(1)
    const hasMore = ref(false)
    const isLoading = ref(false)
    const hasError = ref(false)
    const busyId = ref(null)
    const hideDialog = reactive({ isOpen: false, note: '', item: null })
    let reqId = 0

    const fetchPage = nextPage =>
      store.dispatch('community/gmFetchCommunities', {
        page: nextPage,
        search: search.value.trim(),
        hidden: onlyHidden.value,
        aiFlagged: onlyAiFlagged.value
      })

    const load = async reset => {
      const id = ++reqId
      const nextPage = reset ? 1 : page.value + 1

      isLoading.value = true
      hasError.value = false

      const { data, error } = await fetchPage(nextPage)

      // stale: filters changed while this request was in flight
      if (id !== reqId) return

      isLoading.value = false

      if (error) {
        hasError.value = true

        return
      }

      items.value = reset ? data.items : [...items.value, ...data.items]
      page.value = nextPage
      hasMore.value = data.hasMore
    }

    // reload the row's page so flags/notes are the server's; hidden filter may drop the row
    const refresh = () => load(true)

    const run = async (item, action, doneKey, payload = {}) => {
      busyId.value = item.documentId
      const { error } = await store.dispatch(`community/${action}`, { documentId: item.documentId, ...payload })

      busyId.value = null

      if (error) {
        showToast.fail(error.message || i18n.t('error.anErrorOccurred'))

        return
      }

      showToast.success(i18n.t(doneKey))
      await refresh()
    }

    // An AI-reported community opens with the AI's reason as the note, for the GM to keep or edit
    const askHide = item => Object.assign(hideDialog, { isOpen: true, note: item.aiModerationFlag || '', item })
    const hide = () => run(hideDialog.item, 'gmHideCommunity', 'gmPanel.communities.hiddenDone', { note: hideDialog.note.trim() })
    const unhide = item => run(item, 'gmUnhideCommunity', 'gmPanel.communities.unhiddenDone')
    const dismissAiFlag = item => run(item, 'gmDismissCommunityAiFlag', 'gmPanel.communities.aiFlagDismissed')
    const remove = item =>
      Dialog.confirm({ title: item.name, message: i18n.t('gmPanel.communities.confirmDelete') })
        .then(() => run(item, 'gmDeleteCommunity', 'gmPanel.communities.deletedDone'))
        .catch(() => {})

    const rowLabel = item =>
      [
        `${i18n.t('gmPanel.communities.owner')}: ${item.owner ? item.owner.username : '-'}`,
        `${i18n.t('gmPanel.communities.members')}: ${item.memberCount}`,
        `${i18n.t('gmPanel.communities.reports')}: ${item.reportCount}`
      ].join(' · ')

    const btn = (item, isDelete = false) => ({
      size: 'small',
      plain: true,
      round: true,
      nativeType: 'button',
      loading: !isDelete && busyId.value === item.documentId,
      disabled: isDelete && busyId.value === item.documentId
    })

    const handleSearch = useDebounceFn(() => load(true), 400)

    watch([onlyHidden, onlyAiFlagged], () => load(true), { immediate: true })

    return {
      search,
      onlyHidden,
      onlyAiFlagged,
      items,
      hasMore,
      isLoading,
      hasError,
      busyId,
      hideDialog,
      load,
      askHide,
      hide,
      unhide,
      dismissAiFlag,
      remove,
      handleSearch
    }
  },
  head() {
    return { title: this.$t('gmPanel.title') }
  }
})
</script>
