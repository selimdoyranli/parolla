<template lang="pug">
.notification-item(
  :class="{ 'notification-item--unread': !item.isRead, 'notification-item--clickable': !isAnnouncement }"
  @click="$emit('select', item)"
)
  //- announcements come from parolla itself: app logo + name, full text instead of an excerpt
  template(v-if="isAnnouncement")
    img.notification-item__avatar.notification-item__avatar--app(src="/img/core/logo.webp" :alt="APP_NAME" width="40" height="40")
  PlayerAvatar.notification-item__avatar(v-else-if="item.actor" :user="item.actor" :size="40")
  .notification-item__body
    template(v-if="isAnnouncement")
      p.notification-item__text
        strong {{ APP_NAME }}
      p.notification-item__announcement {{ item.meta && item.meta.content }}
    template(v-else)
      p.notification-item__text
        strong {{ actorLabel }}
        Tag.notification-item__owner(v-if="item.isQuizOwnerActor" round) {{ $t('comments.quizOwner') }}
        | {{ ' ' + text }}
      p.notification-item__excerpt(v-if="item.meta && item.meta.excerpt") “{{ item.meta.excerpt }}”
    small.notification-item__meta
      span(v-if="item.room") {{ item.room.title }} ·
      |
      |
      Timeago(:datetime="item.createdAt" :auto-update="60" :locale="$i18n.locale")
  span.notification-item__dot(v-if="!item.isRead")
</template>

<script>
import { defineComponent, computed, useContext } from '@nuxtjs/composition-api'
import { Tag } from 'vant'
import { APP_NAME } from '@/system/constant'

export default defineComponent({
  components: { Tag },
  props: {
    item: { type: Object, required: true }
  },
  emits: ['select'],
  setup(props) {
    const { i18n } = useContext()

    const isAnnouncement = computed(() => props.item.type === 'announcement')
    const name = computed(() => props.item.actor?.username || '')
    const actorLabel = computed(() =>
      props.item.actorCount > 1 ? i18n.t('notifications.andOthers', { name: name.value, count: props.item.actorCount - 1 }) : name.value
    )
    // the type string starts with "{actor}"; actor is rendered bold separately, so strip it
    const text = computed(() => i18n.t(`notifications.types.${props.item.type}`, { actor: '', rating: props.item.meta?.rating }).trim())

    return { APP_NAME, isAnnouncement, actorLabel, text }
  }
})
</script>

<style lang="scss" src="./NotificationItem.component.scss"></style>
