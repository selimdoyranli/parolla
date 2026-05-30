<template lang="pug">
.system-room-list
  .system-room-list__empty(v-if="!grouped.length") Resmi oda yok.

  .system-room-list__group(v-for="g in grouped" :key="g.slug")
    h4.system-room-list__group-title {{ g.title }}

    .system-room-list__cards
      .system-room-list__card(v-for="r in g.rooms" :key="r.code" @click="$emit('join', linkFor(r))")
        .system-room-list__card-title
          span {{ g.title }}
          span.system-room-list__card-sub(v-if="r.subIndex > 1") &nbsp;{{ '#' + r.subIndex }}
        .system-room-list__card-meta
          | {{ r.playerCount }}/{{ r.capacity }} ·
          | &nbsp;{{ stateLabel(r) }}
</template>

<script>
import { defineComponent, computed } from '@nuxtjs/composition-api'

const STATE_LABELS = {
  waiting: 'Oyuncular bekleniyor',
  picking: 'Kelime seçiliyor',
  drawing: 'Çiziliyor',
  roundEnd: 'Tur bitti',
  finalScoreboard: 'Final'
}

function stateLabelFor(r) {
  if (r.state === 'waiting') return STATE_LABELS.waiting

  if (r.state === 'finalScoreboard') return STATE_LABELS.finalScoreboard

  return `Tur ${(r.currentRoundIndex || 0) + 1}/50`
}

export default defineComponent({
  props: {
    systemRooms: { type: Array, default: () => [] }
  },
  emits: ['join'],
  setup(props) {
    const grouped = computed(() => {
      const map = new Map()

      for (const r of props.systemRooms) {
        if (!map.has(r.slug)) {
          map.set(r.slug, { slug: r.slug, title: r.categoryTitle || r.slug, rooms: [] })
        }
        map.get(r.slug).rooms.push(r)
      }

      for (const g of map.values()) g.rooms.sort((a, b) => (a.subIndex || 1) - (b.subIndex || 1))

      return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title, 'tr'))
    })
    const linkFor = r => (r.subIndex > 1 ? `${r.slug}-${r.subIndex}` : r.slug)

    return { grouped, linkFor, stateLabel: stateLabelFor }
  }
})
</script>

<style src="./SystemRoomList.component.scss" lang="scss" scoped />
