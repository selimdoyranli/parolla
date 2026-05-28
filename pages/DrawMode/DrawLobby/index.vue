<template lang="pug">
.draw-lobby
  .draw-lobby__hero
    span.draw-lobby__eyebrow Çiz Modu
    h1.draw-lobby__title Çiz, tahmin et, kazan
    p.draw-lobby__subtitle Arkadaşlarınla gerçek zamanlı çizim ve tahmin oyunu. Bir oda kur ya da kodla katıl.
    .draw-lobby__actions
      button.draw-lobby__cta(@click="onCreate") Yeni Oda Kur
      .draw-lobby__join
        input(v-model="joinCode" placeholder="Oda kodu" maxlength="6")
        button(@click="onJoin") Katıl

  section.draw-lobby__rooms
    h2 Açık odalar
    .draw-lobby__empty(v-if="!publicRooms.length") Şu anda açık oda yok. İlk odayı sen kur.
    .draw-lobby__room(v-for="r in publicRooms" :key="r.code" @click="joinPublic(r)")
      .draw-lobby__room-code {{ r.code }}
      .draw-lobby__room-meta
        span.draw-lobby__room-count {{ r.playerCount }}/{{ r.capacity }} oyuncu
        span {{ r.roundCount }} tur
        span(v-if="r.hasPassword") 🔒
        span.badge {{ r.state }}
      AppIcon.draw-lobby__room-arrow(name="tabler:chevron-right" :width="20" :height="20")

  DrawRoomCreateDialog(v-if="showCreate" @close="showCreate = false" @submit="submitCreate")
</template>

<script>
import { defineComponent, computed, ref, getCurrentInstance } from '@nuxtjs/composition-api'
import { useDrawSocket } from '@/composables/useDrawSocket'
import { wsTypeEnum } from '@/enums/wsType.enum'

export default defineComponent({
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

    const onJoin = () => {
      const code = joinCode.value.trim().toUpperCase()

      if (!code) return
      send(wsTypeEnum.DRAW_ROOM_JOIN, { code })
    }

    const joinPublic = r => {
      send(wsTypeEnum.DRAW_ROOM_JOIN, { code: r.code })
    }

    store.watch(
      s => s.draw.room && s.draw.room.code,
      code => {
        if (code) vm.$router.push(vm.localePath({ name: 'DrawMode-DrawRoom-code', params: { code } }))
      }
    )

    return { publicRooms, joinCode, onCreate, onJoin, joinPublic, submitCreate, showCreate }
  }
})
</script>

<style src="./DrawLobby.page.scss" lang="scss" scoped />
