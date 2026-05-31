<template lang="pug">
.draw-chat
  .draw-chat__log(ref="log")
    .draw-chat__empty(v-if="!chat.length") {{ disabled ? 'Çizim sırasında sohbet kapalı' : 'Tahmininizi yazın…' }}
    template(v-else)
      .draw-chat__msg(v-for="(m, i) in chat" :key="i" :class="msgClasses(m)")
        // ── System rows: inline label + text, no bubble, left-aligned ──
        template(v-if="m.isSystem")
          AppIcon.draw-chat__sys-icon(:name="iconFor(m)" :width="14" :height="14")
          span.draw-chat__sys-label Sistem
          span.draw-chat__sep &nbsp;:&nbsp;
          span.draw-chat__sys-text {{ m.message }}

        // ── Player rows: inline avatar+username, then ": text", no bubble ──
        template(v-else)
          PlayerAvatar.draw-chat__avatar(with-username :open-player-dialog-on-click="!m.isGuest" :user="buildAvatarUser(m)" :size="22")
          span.draw-chat__sep &nbsp;:&nbsp;
          span.draw-chat__text {{ m.message }}

  .draw-chat__input
    Field.draw-chat__field(v-model="text" :placeholder="placeholder" :maxlength="64" :disabled="disabled" @keyup.enter.native="send")
    Button.draw-chat__send(type="primary" size="small" round :disabled="disabled || !text.trim()" @click="send") Gönder
</template>

<script>
import { defineComponent, ref, computed, watch, nextTick, getCurrentInstance } from '@nuxtjs/composition-api'
import { Field, Button } from 'vant'

export default defineComponent({
  components: { Field, Button },
  props: {
    chat: { type: Array, default: () => [] },
    players: { type: Array, default: () => [] },
    myId: { type: [String, Number], default: null },
    iAmDrawer: { type: Boolean, default: false },
    iGuessedCorrectly: { type: Boolean, default: false },
    isDrawing: { type: Boolean, default: false }
  },
  emits: ['send'],
  setup(props, { emit }) {
    const vm = getCurrentInstance().proxy
    const text = ref('')
    const log = ref(null)

    const disabled = computed(() => false)

    const kindOf = m => {
      // Backward-compat: older payloads only had isCloseHint to mark a
      // 'close guess' system message. New code attaches systemKind directly.
      if (m.systemKind) return m.systemKind

      if (m.isCloseHint) return 'warning'

      return 'info'
    }

    const iconFor = m => {
      const kind = kindOf(m)

      if (kind === 'success') return 'tabler:circle-check'

      if (kind === 'warning') return 'tabler:alert-triangle'

      if (kind === 'danger') return 'tabler:alert-octagon'

      return 'tabler:info-circle'
    }

    const msgClasses = m => {
      const isMine = !m.isSystem && props.myId != null && String(m.playerId) === String(props.myId)

      if (!m.isSystem) {
        return {
          'draw-chat__msg--player': true,
          'draw-chat__msg--mine': isMine
        }
      }

      const kind = kindOf(m)

      return {
        'draw-chat__msg--system': true,
        [`draw-chat__msg--system-${kind}`]: true
      }
    }

    const placeholder = computed(() => {
      if (props.iGuessedCorrectly) return 'Doğru bildin, kazananlarla sohbet et'

      return 'Tahmin et / sohbet et…'
    })

    const send = () => {
      const t = text.value.trim()

      if (!t) return
      emit('send', t)
      text.value = ''
    }

    watch(
      () => props.chat.length,
      async () => {
        await nextTick()

        if (log.value) log.value.scrollTop = log.value.scrollHeight
      }
    )

    // Chat WS payloads only carry playerId + playerName. Look the sender up
    // in the room's player list so PlayerAvatar can render real avatar art
    // (uploaded photo / diceBear config) and so the click→player-dialog flow
    // works for everyone, not just senders whose data was fully attached.
    const playersById = computed(() => {
      const map = new Map()

      for (const p of props.players || []) {
        if (p && p.id != null) map.set(String(p.id), p)
      }

      return map
    })

    const buildAvatarUser = message => {
      const enriched = message.playerId != null ? playersById.value.get(String(message.playerId)) : null
      const isGuest = !!message.isGuest || !!(enriched && enriched.isGuest)
      const rawName = enriched?.name || message.playerName || ''
      const labeledName = isGuest ? `${rawName} ${vm.$t('common.guestLabel')}` : rawName

      return {
        id: message.playerId,
        username: labeledName,
        avatarSource: enriched?.avatarSource,
        profilePhoto: typeof enriched?.profilePhoto === 'string' ? { url: enriched.profilePhoto } : enriched?.profilePhoto,
        diceBear: enriched?.diceBear,
        role: enriched?.role,
        isGuest
      }
    }

    return { text, log, disabled, placeholder, send, iconFor, msgClasses, buildAvatarUser }
  }
})
</script>

<style src="./DrawChat.component.scss" lang="scss" scoped />
