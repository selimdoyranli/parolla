<template lang="pug">
.community-header
  //- avatar zoom, like the profile page's photo preview
  MountingPortal(mount-to="body" append)
    ImagePreview.community-header-preview(
      v-model="isAvatarPreviewOpen"
      :images="community.avatar ? [community.avatar] : []"
      :show-index="false"
      :close-on-popstate="true"
    )
      template(#cover)
        button.community-header-preview__close(type="button" :aria-label="$t('general.close')" @click="isAvatarPreviewOpen = false")
          AppIcon(name="ion:md-close" color="#fff" :width="24" :height="24")

  //- banner with the identity (avatar, name, counts) overlaid on its bottom gradient
  QuizCover.community-header__cover(:room="coverRoom")
    .community-header__shade
    .community-header__actions
      slot(name="actions")

    .community-header__identity
      CommunityAvatar.community-header__avatar(
        :community="community"
        :size="72"
        :class="{ 'community-header__avatar--clickable': community.avatar }"
        @click.native="isAvatarPreviewOpen = !!community.avatar"
      )
      .community-header__text
        .community-header__title-row
          h1.community-header__name {{ community.name }}
          AppIcon.community-header__visibility(
            :name="visibilityIcon"
            :title="$t(`community.detail.visibility.${community.visibility}`)"
            :width="18"
            :height="18"
          )
        .community-header__stats
          button.community-header__stat.community-header__stat--button(type="button" @click="$emit('open-members')")
            AppIcon(name="tabler:users" :width="15" :height="15")
            | {{ community.memberCount }} {{ $t('community.detail.memberCountLabel') }}
          //- only managers get pendingCount
          button.community-header__pending(v-if="community.pendingCount > 0" type="button" @click="$emit('open-pending')")
            | {{ $t('community.detail.pendingCount', { count: community.pendingCount }) }}
          span.community-header__stat
            AppIcon(name="tabler:file-text" :width="15" :height="15")
            | {{ community.postCount }} {{ $t('community.detail.postCountLabel') }}

  .community-header__about
    p.community-header__description(v-if="community.description") {{ community.description }}

    .community-header__tags(v-if="community.tags && community.tags.length")
      NuxtLink.community-header__tag(
        v-for="tag in community.tags"
        :key="tag"
        :to="localePath({ name: 'Community-CommunityList', query: { tag } })"
      ) \#{{ tag }}

    .community-header__meta
      span.community-header__meta-item
        AppIcon(:name="visibilityIcon" :width="14" :height="14")
        | {{ $t(`community.detail.visibility.${community.visibility}`) }}
      span.community-header__meta-item
        AppIcon(name="tabler:calendar" :width="14" :height="14")
        | {{ $t('community.detail.createdAt') }} {{ createdAt }}

    .community-header__footer
      CreatorByline(v-if="community.owner" :user="community.owner")
      CommunityJoinButton.community-header__join(:community="community" @changed="$emit('changed', $event)")
</template>

<script>
import { defineComponent, computed, ref, useContext } from '@nuxtjs/composition-api'
import { ImagePreview } from 'vant'

const VISIBILITY_ICON = { public: 'tabler:world', restricted: 'tabler:user-check', private: 'tabler:lock' }

export default defineComponent({
  name: 'CommunityHeader',
  components: { ImagePreview: ImagePreview.Component },
  props: {
    community: { type: Object, required: true }
  },
  emits: ['changed', 'open-members', 'open-pending'],
  setup(props) {
    const { i18n } = useContext()
    const isAvatarPreviewOpen = ref(false)
    const visibilityIcon = computed(() => VISIBILITY_ICON[props.community.visibility] || VISIBILITY_ICON.public)
    const createdAt = computed(() =>
      new Date(props.community.createdAt).toLocaleDateString(i18n.locale, { day: 'numeric', month: 'long', year: 'numeric' })
    )
    // QuizCover only needs a room-like object for the photo and the placeholder palette (same as CommunityCard)
    const coverRoom = computed(() => ({
      documentId: props.community.documentId,
      title: props.community.name,
      coverPhoto: props.community.coverPhoto ? { url: props.community.coverPhoto } : null
    }))

    return { isAvatarPreviewOpen, visibilityIcon, createdAt, coverRoom }
  }
})
</script>

<style lang="scss" src="./CommunityHeader.component.scss"></style>
