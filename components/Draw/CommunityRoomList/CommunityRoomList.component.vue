<template lang="pug">
.community-room-list
  .community-room-list__top
    Button.community-room-list__create(type="primary" round block @click="onCreate")
      | Yeni Oda Kur
    .community-room-list__join
      Field.community-room-list__join-field(
        v-model="joinCode"
        placeholder="Oda kodu"
        :maxlength="6"
        @keyup.enter.native="onJoin"
        @input="onCodeInput"
      )
      Button.community-room-list__join-btn(type="primary" round :disabled="!canJoin" @click="onJoin") Katıl

  .community-room-list__empty(v-if="!communityRooms.length") Açık oda yok. İlk odayı sen kur.

  .community-room-list__rooms(v-else)
    .community-room-list__room(v-for="r in communityRooms" :key="r.code" @click="$emit('join', r.code)")
      .community-room-list__room-main
        .community-room-list__room-head
          span.community-room-list__room-name {{ r.hostName || r.code }}
          span.community-room-list__room-category(v-if="categoryFor(r)") {{ categoryFor(r) }}
          .community-room-list__live(v-if="isLive(r.state)")
            .community-room-list__live-dot
            span.community-room-list__live-label CANLI
          span.community-room-list__room-state(v-else) {{ stateLabel(r.state) }}

        .community-room-list__room-meta
          span.community-room-list__meta-pill
            AppIcon.community-room-list__meta-icon(name="tabler:users" :width="13" :height="13")
            span {{ r.playerCount }}/{{ r.capacity }}
          span.community-room-list__meta-pill(v-if="r.currentRoundIndex != null && r.state !== 'lobby'")
            AppIcon.community-room-list__meta-icon(name="tabler:rotate" :width="13" :height="13")
            span Tur {{ (r.currentRoundIndex || 0) + 1 }}

      Button.community-room-list__room-cta(type="primary" size="small" round @click.stop="$emit('join', r.code)") Katıl
</template>

<script>
import { defineComponent, ref, computed } from '@nuxtjs/composition-api'
import { Button, Field } from 'vant'

const STATE_LABELS = {
  lobby: 'Lobi',
  picking: 'Seçiliyor',
  drawing: 'Oynuyor',
  roundEnd: 'Ara',
  gameEnd: 'Bitti'
}

const LIVE_STATES = new Set(['picking', 'drawing', 'roundEnd'])

export default defineComponent({
  components: { Button, Field },
  props: {
    communityRooms: { type: Array, default: () => [] },
    // slug → title map fetched by the lobby. We get only slugs from the WS
    // and resolve the localized title here. Falls back to the slug itself
    // until the map populates (Strapi fetch latency).
    categoryTitles: { type: Object, default: () => ({}) }
  },
  emits: ['create', 'join'],
  setup(props, { emit }) {
    const joinCode = ref('')
    const canJoin = computed(() => joinCode.value.length === 6)

    const onCodeInput = v => {
      joinCode.value = String(v || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 6)
    }

    const onJoin = () => {
      if (canJoin.value) emit('join', joinCode.value)
    }

    const onCreate = () => emit('create')

    const stateLabel = s => STATE_LABELS[s] || s
    const isLive = s => LIVE_STATES.has(s)

    const categoryFor = r => {
      const slug = Array.isArray(r.categories) && r.categories.length ? r.categories[0] : null

      if (!slug) return ''

      return props.categoryTitles[slug] || slug
    }

    return { joinCode, canJoin, onCodeInput, onJoin, onCreate, stateLabel, isLive, categoryFor }
  }
})
</script>

<style src="./CommunityRoomList.component.scss" lang="scss" scoped />
