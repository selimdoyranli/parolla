<template lang="pug">
.draw-lobby
  .draw-lobby__hero
    span.draw-lobby__eyebrow Çiz Modu
    h1.draw-lobby__title Çiz, tahmin et, kazan
    p.draw-lobby__subtitle Arkadaşlarınla gerçek zamanlı çizim ve tahmin oyunu. Bir oda kur ya da kodla katıl.

  .draw-lobby__actions
    Button.draw-lobby__cta(type="primary" size="large" round block @click="onCreate")
      AppIcon(name="tabler:pencil-plus" :width="18" :height="18")
      span Yeni Oda Kur
    .draw-lobby__join
      Field.draw-lobby__join-field(
        v-model="joinCode"
        placeholder="Oda kodu"
        :maxlength="6"
        @keyup.enter.native="onJoin"
        @input="onJoinInput"
      )
      Button.draw-lobby__join-btn(type="default" size="large" round @click="onJoin") Katıl

  section.draw-lobby__rooms
    .draw-lobby__rooms-head
      h2 Açık odalar
      span.draw-lobby__rooms-count(v-if="publicRooms.length") {{ publicRooms.length }}

    .draw-lobby__empty(v-if="!publicRooms.length")
      AppIcon(name="tabler:door" :width="28" :height="28")
      p Şu anda açık oda yok. İlk odayı sen kur.

    CellGroup.draw-lobby__cells(v-else inset)
      Cell.draw-lobby__room(v-for="r in publicRooms" :key="r.code" is-link @click="joinPublic(r)")
        template(#title)
          .draw-lobby__room-line
            span.draw-lobby__room-code {{ r.code }}
            Tag.draw-lobby__room-state(:type="stateTagType(r.state)" plain) {{ stateLabel(r.state) }}
            AppIcon.draw-lobby__room-lock(v-if="r.hasPassword" name="tabler:lock" :width="14" :height="14")
        template(#label)
          .draw-lobby__room-meta
            span
              AppIcon(name="tabler:users" :width="12" :height="12")
              | &nbsp;{{ r.playerCount }}/{{ r.capacity }}
            span
              AppIcon(name="tabler:rotate" :width="12" :height="12")
              | &nbsp;{{ r.roundCount }} tur

  DrawRoomCreateDialog(v-if="showCreate" @close="showCreate = false" @submit="submitCreate")
</template>

<script>
import { defineComponent, computed, ref, getCurrentInstance } from '@nuxtjs/composition-api'
import { Field, Button, Cell, CellGroup, Tag } from 'vant'
import { useDrawSocket } from '@/composables/useDrawSocket'
import { wsTypeEnum } from '@/enums/wsType.enum'

const STATE_LABELS = {
  lobby: 'Lobi',
  picking: 'Seçiliyor',
  drawing: 'Oynuyor',
  roundEnd: 'Ara',
  gameEnd: 'Bitti'
}

const STATE_TAG_TYPES = {
  lobby: 'success',
  picking: 'warning',
  drawing: 'primary',
  roundEnd: 'default',
  gameEnd: 'default'
}

export default defineComponent({
  components: { Field, Button, Cell, CellGroup, Tag },
  layout: 'Default/Default.layout',
  middleware: 'auth',
  setup() {
    const { send } = useDrawSocket()
    const joinCode = ref('')
    const showCreate = ref(false)
    const vm = getCurrentInstance().proxy
    const store = vm.$store

    const publicRooms = computed(() => store.state.draw.publicRooms)

    const onCreate = () => {
      showCreate.value = true
    }

    const submitCreate = settings => {
      send(wsTypeEnum.DRAW_ROOM_CREATE, { settings })
      showCreate.value = false
    }

    const onJoinInput = v => {
      joinCode.value = String(v || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 6)
    }

    const onJoin = () => {
      const code = joinCode.value.trim().toUpperCase()

      if (!code) return
      send(wsTypeEnum.DRAW_ROOM_JOIN, { code })
    }

    const joinPublic = r => {
      send(wsTypeEnum.DRAW_ROOM_JOIN, { code: r.code })
    }

    const stateLabel = s => STATE_LABELS[s] || s
    const stateTagType = s => STATE_TAG_TYPES[s] || 'default'

    store.watch(
      s => s.draw.room && s.draw.room.code,
      code => {
        if (code) vm.$router.push(vm.localePath({ name: 'DrawMode-DrawRoom-code', params: { code } }))
      }
    )

    return {
      publicRooms,
      joinCode,
      onCreate,
      onJoin,
      onJoinInput,
      joinPublic,
      submitCreate,
      showCreate,
      stateLabel,
      stateTagType
    }
  }
})
</script>

<style src="./DrawLobby.page.scss" lang="scss" scoped />
