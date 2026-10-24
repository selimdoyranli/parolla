<template lang="pug">
.community-compose-form__section.community-compose-form__summary
  img.community-compose-form__summary-cover(v-if="media.coverPhoto" :src="media.coverPhoto.url" alt)
  CommunityAvatar(:community="preview" :size="64")
  strong {{ form.name }}
  p(v-if="form.description") {{ form.description }}
  .community-compose-form__tags(v-if="form.tags.length")
    Tag(v-for="tag in form.tags" :key="tag" type="primary") {{ tag }}
  small(v-else) {{ $t('community.wizard.noTags') }}
  small {{ $t('community.form.visibility.label') }}: {{ $t(`community.detail.visibility.${form.visibility}`) }}
  small {{ $t('community.form.postPermission.label') }}: {{ $t(`community.detail.postPermission.${postPermissionKey}`) }}
</template>

<script>
import { defineComponent, computed } from '@nuxtjs/composition-api'
import { Tag } from 'vant'
import { communityPostPermissionEnum } from '@/enums/community.enum'

export default defineComponent({
  name: 'Step4Complete',
  components: { Tag },
  props: {
    form: { type: Object, required: true },
    media: { type: Object, required: true }
  },
  setup(props) {
    // CommunityAvatar wants a community-shaped object
    const preview = computed(() => ({
      name: props.form.name,
      avatar: props.media.avatar?.url || null,
      avatarInitials: props.form.name.trim().slice(0, 2).toLocaleUpperCase('tr')
    }))
    const postPermissionKey = computed(() =>
      props.form.postPermission === communityPostPermissionEnum.MODS_ONLY ? 'modsOnly' : 'everyone'
    )

    return { preview, postPermissionKey }
  }
})
</script>
