<template lang="pug">
NuxtLink.community-card(:to="localePath({ name: 'Community-Community-slug', params: { slug: community.slug } })" :title="community.name")
  QuizCover.community-card__cover(:room="coverRoom")
    span.community-card__badge(v-if="roleBadge") {{ roleBadge }}

  .community-card__body
    CommunityAvatar.community-card__avatar(:community="community" :size="56")

    .community-card__title-row
      h3.community-card__name {{ community.name }}
      AppIcon.community-card__visibility(
        :name="visibilityIcon"
        :title="$t(`community.detail.visibility.${community.visibility}`)"
        :width="16"
        :height="16"
      )

    .community-card__tags(v-if="community.tags && community.tags.length")
      //- a tag filters the list instead of opening the community
      button.community-card__tag(
        v-for="tag in community.tags.slice(0, 3)"
        :key="tag"
        type="button"
        @click.prevent.stop="handleTagClick(tag)"
      ) \#{{ tag }}
      span.community-card__tag(v-if="community.tags.length > 3") +{{ community.tags.length - 3 }}

    .community-card__stats
      span.community-card__stat
        AppIcon(name="tabler:users" :width="14" :height="14")
        | {{ $t('community.list.members', { count: community.memberCount }) }}
      span.community-card__stat
        AppIcon(name="tabler:file-text" :width="14" :height="14")
        | {{ $t('community.list.posts', { count: community.postCount }) }}
</template>

<script>
import { defineComponent, computed, useContext, useRouter } from '@nuxtjs/composition-api'
import { communityViewerRoleEnum } from '@/enums/community.enum'

const VISIBILITY_ICON = { public: 'tabler:world', restricted: 'tabler:user-check', private: 'tabler:lock' }

export default defineComponent({
  name: 'CommunityCard',
  props: {
    community: { type: Object, required: true }
  },
  // tag-click: tag picked on the card; without a listener the card opens the list filtered by it
  emits: ['tag-click'],
  setup(props, { emit, listeners }) {
    const { i18n, localePath } = useContext()
    const router = useRouter()

    // QuizCover only needs a room-like object for the photo and the placeholder palette
    const coverRoom = computed(() => ({
      documentId: props.community.documentId,
      title: props.community.name,
      coverPhoto: props.community.coverPhoto ? { url: props.community.coverPhoto } : null
    }))
    const visibilityIcon = computed(() => VISIBILITY_ICON[props.community.visibility] || VISIBILITY_ICON.public)

    // owner / member / pending only; moderators read as members here
    const roleBadge = computed(() => {
      const role = props.community.viewerRole

      if (role === communityViewerRoleEnum.OWNER) return i18n.t('community.detail.owner')

      if (role === communityViewerRoleEnum.MEMBER || role === communityViewerRoleEnum.MODERATOR)
        return i18n.t('community.joinButton.member')

      if (role === communityViewerRoleEnum.PENDING) return i18n.t('community.joinButton.pending')

      return null
    })

    const handleTagClick = tag =>
      listeners['tag-click'] ? emit('tag-click', tag) : router.push(localePath({ name: 'Community-CommunityList', query: { tag } }))

    return { coverRoom, visibilityIcon, roleBadge, handleTagClick }
  }
})
</script>

<style lang="scss" src="./CommunityCard.component.scss"></style>
