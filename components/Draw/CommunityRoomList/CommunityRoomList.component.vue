<template lang="pug">
.community-room-list
  .community-room-list__top
    Button.community-room-list__create(type="primary" round block @click="$emit('create')")
      | Yeni Oda Kur
    .community-room-list__join
      Field.community-room-list__join-field(
        v-model="joinCode"
        placeholder="Oda kodu"
        :maxlength="6"
        @keyup.enter.native="onJoin"
        @input="onCodeInput"
      )
      Button.community-room-list__join-btn(type="default" round :disabled="!canJoin" @click="onJoin") Katıl

  .community-room-list__empty(v-if="!communityRooms.length") Açık oda yok. İlk odayı sen kur.

  CellGroup.community-room-list__cells(v-else inset)
    Cell.community-room-list__room(v-for="r in communityRooms" :key="r.code" is-link @click="$emit('join', r.code)")
      template(#title)
        .community-room-list__room-line
          span.community-room-list__room-code {{ r.hostName || r.code }}
          Tag.community-room-list__room-state(plain) {{ stateLabel(r.state) }}
      template(#label)
        .community-room-list__room-meta
          span {{ r.playerCount }}/{{ r.capacity }}
</template>

<script>
import { defineComponent, ref, computed } from '@nuxtjs/composition-api'
import { Button, Field, Cell, CellGroup, Tag } from 'vant'

const STATE_LABELS = {
  lobby: 'Lobi',
  picking: 'Seçiliyor',
  drawing: 'Oynuyor',
  roundEnd: 'Ara',
  gameEnd: 'Bitti'
}

export default defineComponent({
  components: { Button, Field, Cell, CellGroup, Tag },
  props: {
    communityRooms: { type: Array, default: () => [] }
  },
  emits: ['create', 'join'],
  setup(_, { emit }) {
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
    const stateLabel = s => STATE_LABELS[s] || s

    return { joinCode, canJoin, onCodeInput, onJoin, stateLabel }
  }
})
</script>

<style src="./CommunityRoomList.component.scss" lang="scss" scoped />
