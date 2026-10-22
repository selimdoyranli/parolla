<template lang="pug">
.community-about
  h3.community-about__title {{ $t('community.detail.aboutTitle') }}

  p.community-about__description(v-if="community.description") {{ community.description }}

  .community-about__tags(v-if="community.tags && community.tags.length")
    span.community-about__tag(v-for="tag in community.tags" :key="tag") {{ tag }}

  .community-about__row
    AppIcon(:name="visibilityIcon" :width="18" :height="18")
    div
      strong {{ $t(`community.detail.visibility.${community.visibility}`) }}
      small {{ $t(`community.detail.visibility.${community.visibility}Description`) }}

  .community-about__row
    AppIcon(name="tabler:calendar" :width="18" :height="18")
    div
      strong {{ $t('community.detail.createdAt') }}
      small {{ createdAt }}

  .community-about__row(v-if="community.owner")
    PlayerAvatar(with-username open-player-dialog-on-click :size="28" :user="community.owner")
    small {{ $t('community.detail.createdBy') }}
</template>

<script>
import { defineComponent, computed, useContext } from '@nuxtjs/composition-api'

const VISIBILITY_ICON = { public: 'tabler:world', restricted: 'tabler:user-check', private: 'tabler:lock' }

export default defineComponent({
  name: 'CommunityAboutPanel',
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

<style lang="scss" src="./CommunityAboutPanel.component.scss"></style>
