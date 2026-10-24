<template lang="pug">
.community-avatar(:style="{ width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.4}px` }")
  img.community-avatar__image(v-if="community.avatar" :src="community.avatar" loading="lazy" draggable="false" :alt="community.name")
  span.community-avatar__initials(v-else) {{ community.avatarInitials }}
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'CommunityAvatar',
  props: {
    community: { type: Object, required: true },
    size: { type: Number, required: false, default: 48 }
  }
})
</script>

<style lang="scss" src="./CommunityAvatar.component.scss"></style>
