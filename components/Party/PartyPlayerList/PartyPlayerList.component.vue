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
      PlayerAvatar(:user="toUser(player)" :size="30")
      span.party-player-list__name {{ player.name }}
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

  ActionSheet(
    v-model="isManageOpen"
    close-on-click-action
    get-container="body"
    :actions="kickActions"
    :description="kickActions.length ? $t('party.lobby.kickHint') : $t('party.lobby.noOthers')"
    :cancel-text="$t('party.lobby.cancel')"
    @select="confirmKick"
  )
</template>

<script>
import { defineComponent, ref, computed, inject, useStore, useContext } from '@nuxtjs/composition-api'
import { Button, ActionSheet, Dialog } from 'vant'
import { wsTypeEnum } from '@/enums/wsType.enum'

export default defineComponent({
  components: { Button, ActionSheet },
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

    const kickActions = computed(() =>
      players.value
        .filter(p => p.id !== myId.value)
        .map(p => ({ name: p.name, subname: i18n.t('party.lobby.kick'), color: 'var(--color-danger-01)', playerId: p.id }))
    )

    const toUser = p => ({
      id: p.id,
      username: p.name,
      diceBear: p.diceBear,
      profilePhoto: p.profilePhoto,
      avatarSource: p.avatarSource,
      isGuest: p.isGuest
    })

    const confirmKick = action => {
      Dialog.confirm({
        message: i18n.t('party.lobby.kickConfirm', { name: action.name }),
        confirmButtonText: i18n.t('party.lobby.kick'),
        cancelButtonText: i18n.t('party.lobby.cancel'),
        getContainer: 'body'
      })
        .then(() => send(wsTypeEnum.PARTY_KICK, { playerId: action.playerId }))
        .catch(() => {})
    }

    return { isManageOpen, players, myId, isHost, capacity, emptySlots, presenterId, kickActions, toUser, confirmKick }
  }
})
</script>

<style lang="scss" src="./PartyPlayerList.component.scss" scoped></style>
