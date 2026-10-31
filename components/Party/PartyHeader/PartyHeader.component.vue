<template lang="pug">
//- one block: whose room + help / leave on top, the join code (QR, copy, share) under it
header.party-header
  .party-header__top
    //- the host: avatar + name open their player dialog
    PlayerAvatar.party-header__avatar(v-if="host" :user="toUser(host)" :size="40" :open-player-dialog-on-click="!isGuest(host)")
    .party-header__text
      span.party-header__eyebrow
        AppIcon(name="tabler:confetti" :width="12" :height="12")
        | {{ $t('party.lobby.eyebrow') }}
      strong.party-header__title
        span.party-user-name(v-if="host" :class="{ 'is-link': !isGuest(host) }" @click="openPlayer(host)") {{ host.name }}
        | {{ titleRest }}
        span.gm-username-extra(v-if="host && isGm(host)") &nbsp;(GM)
    button.party-header__icon(type="button" :aria-label="$t('party.lobby.help')" @click="showHelp")
      AppIcon(name="tabler:help" :width="18" :height="18")
    button.party-header__leave(type="button" @click="leave")
      AppIcon(name="tabler:logout" :width="16" :height="16")
      span {{ $t('party.lobby.leave') }}
  PartyCodeCard.party-header__code
</template>

<script>
import { defineComponent, computed, inject, useStore, useContext, useRouter } from '@nuxtjs/composition-api'
import { Dialog } from 'vant'
import { wsTypeEnum } from '@/enums/wsType.enum'
import { usePartyUser } from '@/composables/usePartyUser'
import { genitiveSuffix as genitive } from '@/helpers/genitive'

export default defineComponent({
  setup() {
    const store = useStore()
    const router = useRouter()
    const { i18n, localePath } = useContext()
    const send = inject('partySend')

    const { toUser, isGuest, isGm, openPlayer } = usePartyUser()
    const host = computed(() => store.getters['party/players'].find(p => p.isHost) || null)

    // "selim'in odası" with the name as its own (clickable) piece
    const titleRest = computed(() => {
      const name = (host.value && host.value.name) || (store.state.party.room && store.state.party.room.hostName) || ''

      return i18n.t('party.lobby.roomOf', { name, suffix: genitive(name) }).replace(host.value ? name : '', '')
    })

    const showHelp = () =>
      Dialog.alert({
        title: i18n.t('party.lobby.help'),
        message: i18n.t('party.lobby.helpText'),
        confirmButtonText: i18n.t('general.ok'),
        getContainer: 'body'
      })

    const { openPartyLeaveDialog } = useDialog()

    const leave = () =>
      openPartyLeaveDialog({
        confirm: () => {
          send(wsTypeEnum.PARTY_LEAVE)
          router.replace(localePath({ name: 'Party' }))
        }
      })

    return { host, titleRest, toUser, isGuest, isGm, openPlayer, showHelp, leave }
  }
})
</script>

<style lang="scss" src="./PartyHeader.component.scss" scoped></style>
