<template lang="pug">
.system-room-list
  .system-room-list__loading(v-if="loading && !systemRooms.length")
    Loading(color="var(--color-brand-02)") {{ $t('general.loading') }}...

  .system-room-list__empty(v-else-if="!systemRooms.length") Resmi oda yok.

  .system-room-list__grid(v-else)
    .system-room-list__card(
      v-for="(r, i) in systemRooms"
      :key="r.code"
      role="button"
      tabindex="0"
      :style="cardStyle(r)"
      :aria-label="(r.categoryTitle || r.slug) + ' odasına katıl'"
      :data-index="i"
      @click="onJoin(r)"
      @keydown.enter.space.prevent="onJoin(r)"
    )
      .system-room-list__cover
        .system-room-list__cover-gradient
        .system-room-list__cover-noise

        .system-room-list__live(v-if="isLive(r.state)")
          .system-room-list__live-dot
          span.system-room-list__live-label CANLI

        .system-room-list__sub-chip(v-if="r.subIndex > 1") {{ '#' + r.subIndex }}

        .system-room-list__emoji {{ emojiFor(r.slug) }}

      .system-room-list__body
        .system-room-list__title {{ r.categoryTitle || r.slug }}
        .system-room-list__meta {{ stateLabelFor(r) }}

      .system-room-list__footer
        .system-room-list__stats
          AppIcon.system-room-list__stat-icon(name="tabler:users" :width="15" :height="15")
          span.system-room-list__stat-value {{ r.playerCount }} / {{ r.capacity }}

        Button.system-room-list__join-btn(type="primary" size="small" round @click.stop="onJoin(r)") Katıl
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import { Button, Loading } from 'vant'

const PLACEHOLDER_PALETTES = [
  { from: '#ff7878', to: '#c83a5a', tint: 'rgba(255, 220, 220, 0.18)' },
  { from: '#7c5ce8', to: '#3a3da8', tint: 'rgba(225, 220, 255, 0.18)' },
  { from: '#1f9e8e', to: '#0c5a64', tint: 'rgba(200, 245, 240, 0.18)' },
  { from: '#d4a017', to: '#9b5b0a', tint: 'rgba(255, 235, 200, 0.18)' },
  { from: '#e85a8a', to: '#7a2d5a', tint: 'rgba(255, 220, 235, 0.18)' },
  { from: '#3b7dd8', to: '#163f7a', tint: 'rgba(210, 225, 255, 0.18)' }
]

const hashSeed = key => {
  const s = String(key || '')
  let h = 0

  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }

  return Math.abs(h)
}

const SLUG_EMOJI = {
  genel: '✨',
  yemekler: '🍕',
  nesneler: '🪑',
  hayvanlar: '🦁',
  meslekler: '👨‍⚕️',
  bayraklar: '🚩',
  logolar: '🏷️',
  'marvel-dc': '🦸'
}

const FALLBACK_EMOJI = '🎨'

const LIVE_STATES = new Set(['picking', 'drawing', 'roundEnd'])

function stateLabelFor(r) {
  if (r.state === 'waiting') return 'Oyuncular bekleniyor'

  if (r.state === 'finalScoreboard') return 'Final • Yeni döngü hazırlanıyor'

  if (r.state === 'roundEnd') return `Tur ${(r.currentRoundIndex || 0) + 1}/50 • Ara`

  return `Tur ${(r.currentRoundIndex || 0) + 1}/50`
}

export default defineComponent({
  name: 'SystemRoomList',
  components: { Button, Loading },
  props: {
    systemRooms: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false }
  },
  emits: ['join'],
  setup(_, { emit }) {
    const emojiFor = slug => SLUG_EMOJI[slug] || FALLBACK_EMOJI

    const isLive = state => LIVE_STATES.has(state)

    const linkFor = r => (r.subIndex > 1 ? `${r.slug}-${r.subIndex}` : r.slug)

    const cardStyle = r => {
      const palette = PLACEHOLDER_PALETTES[hashSeed(r.slug || r.code || '') % PLACEHOLDER_PALETTES.length]

      return {
        '--src-from': palette.from,
        '--src-to': palette.to,
        '--src-tint': palette.tint
      }
    }

    const onJoin = r => emit('join', linkFor(r))

    return { emojiFor, isLive, cardStyle, stateLabelFor, onJoin }
  }
})
</script>

<style lang="scss" src="./SystemRoomList.component.scss" scoped></style>
