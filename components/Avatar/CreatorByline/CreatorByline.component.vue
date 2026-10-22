<template lang="pug">
//- "Oluşturan" label over the username, right of the avatar; no user → anonymous avatar, no player dialog
PlayerAvatar.creator-byline(:user="user" :size="size" :open-player-dialog-on-click="Boolean(user)")
  template(#append)
    .creator-byline__meta
      small {{ $t('playIntro.creator') }}
      strong(v-if="user") {{ user.username }}
        span.gm-username-extra(v-if="user.role?.name === 'GM'") &nbsp;(GM)
      strong(v-else) {{ $t('playIntro.anon') }}
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'CreatorByline',
  props: {
    user: { type: Object, required: false, default: null },
    size: { type: Number, required: false, default: 44 }
  }
})
</script>

<style lang="scss" src="./CreatorByline.component.scss"></style>
