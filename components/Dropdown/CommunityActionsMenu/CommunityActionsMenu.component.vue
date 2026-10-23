<template lang="pug">
.community-actions-menu.dropdown
  DropdownMenu(withDropdownCloser direction="right" :overlay="false" :is-open="isOpen" @opened="isOpen = true" @closed="isOpen = false")
    template(#trigger)
      ActionButton.community-actions-menu__trigger(
        :label="$t('community.detail.menu.label')"
        icon="tabler:dots"
        :badge="isManager && community.pendingCount > 0 ? community.pendingCount : null"
      )
    template(#body)
      nav.community-actions-menu__nav
        .community-actions-menu__item(v-if="isOwner" dropdown-closer @click="goSettings")
          AppIcon(name="tabler:settings" :width="18" :height="18")
          span {{ $t('community.detail.menu.settings') }}
        .community-actions-menu__item(v-if="isManager" dropdown-closer @click="$emit('open-pending')")
          AppIcon(name="tabler:user-plus" :width="18" :height="18")
          span {{ $t('community.detail.menu.pending') }}
          span.community-actions-menu__badge(v-if="community.pendingCount > 0") {{ community.pendingCount }}
        .community-actions-menu__item(v-if="isManager" dropdown-closer @click="$emit('open-members')")
          AppIcon(name="tabler:users" :width="18" :height="18")
          span {{ $t('community.detail.menu.members') }}
        .community-actions-menu__item.is-danger(v-if="isOwner" dropdown-closer @click="$emit('open-delete')")
          AppIcon(name="tabler:trash" :width="18" :height="18")
          span {{ $t('community.detail.menu.delete') }}
        .community-actions-menu__item(v-if="!isOwner" dropdown-closer @click="$emit('open-report')")
          AppIcon(name="tabler:flag" :width="18" :height="18")
          span {{ $t('community.report') }}
</template>

<script>
import { defineComponent, computed, ref, onBeforeUnmount, watch, useContext, useRouter } from '@nuxtjs/composition-api'
import DropdownMenu from 'v-dropdown-menu'
import 'v-dropdown-menu/dist/v-dropdown-menu.css'
import { communityViewerRoleEnum } from '@/enums/community.enum'

export default defineComponent({
  name: 'CommunityActionsMenu',
  components: { DropdownMenu },
  props: {
    community: { type: Object, required: true }
  },
  setup(props) {
    const router = useRouter()
    const { localePath } = useContext()
    const isOpen = ref(false)

    const isOwner = computed(() => props.community.viewerRole === communityViewerRoleEnum.OWNER)
    const isManager = computed(() => isOwner.value || props.community.viewerRole === communityViewerRoleEnum.MODERATOR)

    const goSettings = () => router.push(localePath({ name: 'Community-CommunityEdit-slug', params: { slug: props.community.slug } }))

    // the library has no Escape support; closing the prop closes the menu
    const closeOnEscape = event => event.key === 'Escape' && (isOpen.value = false)

    watch(isOpen, open => document[`${open ? 'add' : 'remove'}EventListener`]('keydown', closeOnEscape))
    onBeforeUnmount(() => document.removeEventListener('keydown', closeOnEscape))

    return { isOpen, isOwner, isManager, goSettings }
  }
})
</script>

<style lang="scss" src="./CommunityActionsMenu.component.scss"></style>
