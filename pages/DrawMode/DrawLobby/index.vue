<template lang="pug">
.draw-lobby
  .draw-lobby__hero
    span.draw-lobby__eyebrow Çiz Modu
    h1.draw-lobby__title Çiz, tahmin et, kazan
    p.draw-lobby__subtitle Arkadaşlarınla gerçek zamanlı çizim ve tahmin oyunu.
    .draw-lobby__guest(v-if="isGuest" role="button" tabindex="0" @click="showGuestDialog = true" @keyup.enter="showGuestDialog = true")
      PlayerAvatar.draw-lobby__guest-avatar(:user="guestAvatarUser" :size="32")
      span.draw-lobby__guest-name {{ guestName }}
      AppIcon(name="tabler:pencil" :width="14" :height="14")

  Tabs.draw-lobby__tabs(v-model="activeTab" :swipeable="false" :line-width="40")
    Tab(name="official" title="Resmi Odalar")
      SystemRoomList(:system-rooms="systemRooms" @join="onJoinSystem")
    Tab(name="community" title="Topluluk Odaları")
      CommunityRoomList(:community-rooms="communityRooms" @create="onCreate" @join="onJoinCommunity")

  DrawRoomCreateDialog(v-if="showCreate" @close="showCreate = false" @submit="submitCreate")
  CreateGuestDrawerDialog(v-if="showGuestDialog" @close="showGuestDialog = false")
</template>

<script>
import { defineComponent, computed, ref, onMounted, onBeforeUnmount, getCurrentInstance } from '@nuxtjs/composition-api'
import { Tab, Tabs } from 'vant'
import SystemRoomList from '@/components/Draw/SystemRoomList/SystemRoomList.component.vue'
import CommunityRoomList from '@/components/Draw/CommunityRoomList/CommunityRoomList.component.vue'
import DrawRoomCreateDialog from '@/components/Draw/DrawRoomCreateDialog/DrawRoomCreateDialog.component.vue'
import { useDrawSocket } from '@/composables/useDrawSocket'
import { useGuestIdentity } from '@/composables/useGuestIdentity'
import { wsTypeEnum } from '@/enums/wsType.enum'
import CreateGuestDrawerDialog from '@/components/Draw/CreateGuestDrawerDialog/CreateGuestDrawerDialog.component.vue'

export default defineComponent({
  components: { Tab, Tabs, SystemRoomList, CommunityRoomList, DrawRoomCreateDialog, CreateGuestDrawerDialog },
  layout: 'Default/Default.layout',
  // No `middleware: 'auth'` — non-authenticated visitors can browse the
  // official and community room lists as viewers. Join/create actions
  // remain auth-gated via the `auth-control` directive on their buttons.
  setup() {
    const { send } = useDrawSocket()
    const vm = getCurrentInstance().proxy
    const store = vm.$store

    const activeTab = ref('official')
    const showCreate = ref(false)

    const { isGuest, identity, ensureIdentity } = useGuestIdentity()
    const showGuestDialog = ref(false)
    const guestName = computed(() => identity.value.name || '')
    const guestAvatarUser = computed(() => ({
      username: identity.value.name || '',
      avatarSource: 'diceBear',
      diceBear: { seed: identity.value.avatarSeed }
    }))

    const systemRooms = computed(() => store.state.draw.systemRooms)
    const communityRooms = computed(() =>
      store.state.draw.communityRooms.length ? store.state.draw.communityRooms : store.state.draw.publicRooms
    )

    onMounted(() => {
      if (isGuest.value) ensureIdentity()
      send(wsTypeEnum.DRAW_LOBBY_SUBSCRIBE)
    })
    onBeforeUnmount(() => {
      send(wsTypeEnum.DRAW_LOBBY_UNSUBSCRIBE)
    })

    const onCreate = () => {
      showCreate.value = true
    }

    const submitCreate = settings => {
      send(wsTypeEnum.DRAW_ROOM_CREATE, { settings })
      showCreate.value = false
    }

    const onJoinSystem = identifier => {
      send(wsTypeEnum.DRAW_ROOM_JOIN, { code: identifier })
    }

    const onJoinCommunity = code => {
      send(wsTypeEnum.DRAW_ROOM_JOIN, { code })
    }

    // For system rooms (kind='system') the URL should display the lowercase
    // slug ("/ciz/oda/yemekler"); community rooms keep the canonical 6-char
    // code as-is.
    store.watch(
      s => s.draw.room && s.draw.room.code,
      code => {
        if (!code) return
        const kind = store.state.draw.roomKind
        const param = kind === 'system' ? String(code).toLowerCase() : code
        vm.$router.push(vm.localePath({ name: 'DrawMode-DrawRoom-code', params: { code: param } }))
      }
    )

    return {
      activeTab,
      systemRooms,
      communityRooms,
      showCreate,
      onCreate,
      submitCreate,
      onJoinSystem,
      onJoinCommunity,
      isGuest,
      showGuestDialog,
      guestName,
      guestAvatarUser
    }
  }
})
</script>

<style src="./DrawLobby.page.scss" lang="scss" scoped />
