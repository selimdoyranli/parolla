<template lang="pug">
.community-header
  .community-header__cover(:class="{ 'community-header__cover--empty': !community.coverPhoto }")
    img.community-header__cover-image(v-if="community.coverPhoto" :src="community.coverPhoto" draggable="false" :alt="community.name")
    .community-header__actions
      slot(name="actions")

  .community-header__info
    CommunityAvatar.community-header__avatar(:community="community" :size="96")

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
        span.community-header__stat
          AppIcon(name="tabler:users" :width="15" :height="15")
          | {{ community.memberCount }} {{ $t('community.detail.memberCountLabel') }}
        span.community-header__stat
          AppIcon(name="tabler:file-text" :width="15" :height="15")
          | {{ community.postCount }} {{ $t('community.detail.postCountLabel') }}

      CommunityJoinButton.community-header__join(:community="community" @changed="$emit('changed', $event)")

  .community-header__about
    p.community-header__description(v-if="community.description") {{ community.description }}

    .community-header__tags(v-if="community.tags && community.tags.length")
      span.community-header__tag(v-for="tag in community.tags" :key="tag") {{ tag }}

    .community-header__meta
      span.community-header__meta-item
        AppIcon(:name="visibilityIcon" :width="14" :height="14")
        | {{ $t(`community.detail.visibility.${community.visibility}`) }}
      span.community-header__meta-item
        AppIcon(name="tabler:calendar" :width="14" :height="14")
        | {{ $t('community.detail.createdAt') }} {{ createdAt }}
      span.community-header__meta-item(v-if="community.owner")
        | {{ $t('community.detail.createdBy') }}
        PlayerAvatar(with-username open-player-dialog-on-click :size="20" :user="community.owner")
</template>

<script>
import { defineComponent, computed, useContext } from '@nuxtjs/composition-api'

const VISIBILITY_ICON = { public: 'tabler:world', restricted: 'tabler:user-check', private: 'tabler:lock' }

export default defineComponent({
  name: 'CommunityHeader',
  props: {
    community: { type: Object, required: true }
  },
  setup(props) {
    const { i18n } = useContext()
    const visibilityIcon = computed(() => VISIBILITY_ICON[props.community.visibility] || VISIBILITY_ICON.public)
    const createdAt = computed(() =>
      new Date(props.community.createdAt).toLocaleDateString(i18n.locale, { day: 'numeric', month: 'long', year: 'numeric' })
    )

    return { visibilityIcon, createdAt }
  }
})
</script>

<style lang="scss" src="./CommunityHeader.component.scss"></style>
