<template lang="pug">
section.party-card.party-player-list
  header.party-card__head
    .party-card__head-icon
      AppIcon(name="tabler:users" :width="18" :height="18")
    .party-card__head-text
      span.party-card__eyebrow {{ $t('party.lobby.lobby') }}
      h3.party-card__title {{ $t('party.room.players') }}
    span.party-pill.party-pill--brand {{ players.length }} / {{ capacity }}

  ul.party-player-list__list
    li.party-player-list__item(
      v-for="player in players"
      :key="player.id"
      :class="{ 'party-player-list__item--me': player.id === myId, 'party-player-list__item--offline': !player.connected }"
    )
      PlayerAvatar(:user="toUser(player)" :size="30" :open-player-dialog-on-click="!isGuest(player)")
      span.party-player-list__name.party-user-name(:class="{ 'is-link': !isGuest(player) }" @click="openPlayer(player)")
        | {{ player.name }}
        span.gm-username-extra(v-if="isGm(player)") &nbsp;(GM)
      span.party-pill.party-pill--brand(v-if="player.isHost")
        AppIcon(name="tabler:crown" :width="12" :height="12")
        | {{ $t('party.lobby.host') }}
      span.party-pill(v-if="player.id === presenterId")
        AppIcon(name="tabler:presentation" :width="12" :height="12")
        | {{ $t('party.lobby.presenting') }}
      span.party-pill(v-if="player.id === myId") {{ $t('party.lobby.you') }}
      span.party-player-list__offline(v-if="!player.connected") {{ $t('party.lobby.offline') }}
    li.party-player-list__item.party-player-list__item--empty(v-if="emptySlots > 0")
      AppIcon(name="tabler:plus" :width="16" :height="16")
      span {{ $t('party.lobby.emptySlots', { count: emptySlots }) }}

  Button.party-player-list__manage(v-if="isHost" icon="manager-o" round block size="small" @click="isManageOpen = true")
    | {{ $t('party.lobby.manage') }}

  Dialog.dialog.party-player-list__manage-dialog(
    v-model="isManageOpen"
    show-cancel-button
    close-on-click-overlay
    get-container="body"
    :title="$t('party.lobby.manage')"
    :show-confirm-button="false"
    :cancel-button-text="$t('party.lobby.cancel')"
    width="min(92vw, 420px)"
  )
    .party-player-list__manage-body
      p.party-player-list__manage-hint {{ others.length ? $t('party.lobby.kickHint') : $t('party.lobby.noOthers') }}
      .party-player-list__manage-row(v-for="player in others" :key="player.id")
        PlayerAvatar(:user="toUser(player)" :size="32" :open-player-dialog-on-click="!isGuest(player)")
        span.party-player-list__name.party-user-name(:class="{ 'is-link': !isGuest(player) }" @click="openPlayer(player)")
          | {{ player.name }}
          span.gm-username-extra(v-if="isGm(player)") &nbsp;(GM)
        Button(type="danger" size="small" plain round native-type="button" @click="confirmKick(player)")
          | {{ $t('party.lobby.kick') }}
</template>

<script>
import { defineComponent, ref, computed, inject, useStore, useContext } from '@nuxtjs/composition-api'
import { Button, Dialog } from 'vant'
import { wsTypeEnum } from '@/enums/wsType.enum'
import { usePartyUser } from '@/composables/usePartyUser'

export default defineComponent({
  components: { Button, Dialog: Dialog.Component },
  setup() {
    const store = useStore()
    const { i18n } = useContext()
    const send = inject('partySend')
    const isManageOpen = ref(false)

    const players = computed(() => store.getters['party/players'])
    const myId = computed(() => store.state.party.myId)
    const isHost = computed(() => store.getters['party/isHost'])
    const capacity = computed(() => store.state.party.room.capacity || 10)
    const emptySlots = computed(() => capacity.value - players.value.length)

    // in a game the server names the presenter; in the lobby it's the host when presentation is on
    const presenterId = computed(() => {
      const { game, settings, hostId } = store.state.party.room

      if (game) return game.presenterId

      return settings && settings.presentation ? hostId : null
    })

    const others = computed(() => players.value.filter(p => p.id !== myId.value))

    const { toUser, isGuest, isGm, openPlayer } = usePartyUser()

    const confirmKick = player => {
      Dialog.confirm({
        message: i18n.t('party.lobby.kickConfirm', { name: player.name }),
        confirmButtonText: i18n.t('party.lobby.kick'),
        cancelButtonText: i18n.t('party.lobby.cancel'),
        getContainer: 'body'
      })
        .then(() => send(wsTypeEnum.PARTY_KICK, { playerId: player.id }))
        .catch(() => {})
    }

    return {
      isManageOpen,
      players,
      myId,
      isHost,
      capacity,
      emptySlots,
      presenterId,
      others,
      toUser,
      isGuest,
      isGm,
      openPlayer,
      confirmKick
    }
  }
})
</script>

<style lang="scss" src="./PartyPlayerList.component.scss" scoped></style>
