<template lang="pug">
//- public party rooms (hosts who turned on "Listede göster"); refreshed every few seconds while open
Dialog.dialog.party-rooms-dialog(
  :value="value"
  show-cancel-button
  close-on-click-overlay
  get-container="body"
  :title="$t('party.rooms.title')"
  :cancel-button-text="$t('general.close')"
  :show-confirm-button="false"
  @input="$emit('input', $event)"
)
  .party-rooms
    .party-rooms__status
      span.party-rooms__live
        i.party-rooms__pulse
        | {{ $t('party.rooms.live') }}
      span.party-rooms__count(v-if="loaded") {{ $t('party.rooms.count', { n: rooms.length }) }}

    .party-rooms__state(v-if="!loaded")
      Loading(type="spinner" color="var(--color-brand-02)" size="28")
    .party-rooms__state(v-else-if="failed && !rooms.length")
      AppIcon(name="tabler:wifi-off" :width="28" :height="28")
      p {{ $t('party.rooms.failed') }}
    .party-rooms__state(v-else-if="!rooms.length")
      AppIcon(name="tabler:confetti" :width="32" :height="32")
      strong {{ $t('party.rooms.emptyTitle') }}
      p {{ $t('party.rooms.emptyText') }}

    transition-group.party-rooms__list(v-else name="party-rooms-item" tag="ul")
      li.party-rooms__item(v-for="room in rooms" :key="room.code" :class="{ 'party-rooms__item--closed': !!blocker(room) }")
        QuizCover.party-rooms__cover(:room="room.game || null" :seed="room.code")
          span.party-rooms__initials(v-if="!hasPhoto(room)")
            AppIcon(:name="coverIcon(room)" :width="22" :height="22")

        .party-rooms__info
          strong.party-rooms__title {{ room.game ? room.game.title : $t('party.rooms.noGame') }}
          .party-rooms__host(v-if="room.host")
            PlayerAvatar(:user="toUser(room.host)" :size="18")
            span.party-rooms__host-name
              | {{ $t('party.lobby.roomOf', { name: room.host.name, suffix: genitive(room.host.name) }) }}
              span.gm-username-extra(v-if="isGm(room.host)") &nbsp;(GM)
          .party-rooms__pills
            span.party-pill(:class="room.state === 'lobby' ? 'party-rooms__pill--lobby' : 'party-pill--brand'")
              i.party-rooms__dot
              | {{ $t(room.state === 'lobby' ? 'party.rooms.inLobby' : 'party.rooms.inGame') }}
            span.party-pill
              AppIcon(name="tabler:users" :width="12" :height="12")
              | {{ room.players }}/{{ room.capacity }}
            span.party-pill(v-if="room.hasPassword")
              AppIcon(name="tabler:key" :width="12" :height="12")
            span.party-pill(v-if="room.locked")
              AppIcon(name="tabler:lock" :width="12" :height="12")

        .party-rooms__action
          Button(v-if="!blocker(room)" color="var(--color-brand-02)" size="small" round @click="join(room)") {{ $t('party.entry.join') }}
          small.party-rooms__blocker(v-else) {{ $t(`party.rooms.blocked.${blocker(room)}`) }}
</template>

<script>
import { defineComponent, watch, useContext, useRouter } from '@nuxtjs/composition-api'
import { Dialog, Button, Loading } from 'vant'
import { usePartyRooms } from '@/composables/usePartyRooms'
import { usePartyUser } from '@/composables/usePartyUser'
import { genitiveSuffix } from '@/helpers/genitive'

export default defineComponent({
  components: { Dialog: Dialog.Component, Button, Loading },
  props: { value: { type: Boolean, default: false } },
  emits: ['input'],
  setup(props, { emit }) {
    const router = useRouter()
    const { localePath } = useContext()
    const { rooms, loaded, failed, start, stop } = usePartyRooms()
    const { toUser, isGm } = usePartyUser()

    // polls only while the dialog is open
    watch(
      () => props.value,
      open => (open ? start() : stop()),
      { immediate: true }
    )

    // why a room can't be joined from the list right now (same rules as the server's join)
    const blocker = room => {
      if (room.state !== 'lobby') return 'inGame'

      if (room.locked) return 'locked'

      if (room.players >= room.capacity) return 'full'

      return null
    }

    const hasPhoto = room => Boolean(room.game?.coverPhoto?.url)
    // daily / unlimited sets show their mode icon, a room without a game the party icon
    const coverIcon = room => ({ daily: 'tabler:calendar-event', unlimited: 'tabler:infinity' }[room.game?.roomId] || 'tabler:confetti')

    // the room page asks for the password when there is one
    const join = room => {
      emit('input', false)
      router.push(localePath({ name: 'Party-code', params: { code: room.code } }))
    }

    return {
      rooms,
      loaded,
      failed,
      blocker,
      hasPhoto,
      coverIcon,
      join,
      genitive: genitiveSuffix,
      toUser: u => toUser({ ...u, playerId: u.id }),
      isGm
    }
  }
})
</script>

<style lang="scss" src="./PartyRoomsDialog.component.scss" scoped></style>
