<template lang="pug">
header.party-header
  .party-header__badge
    AppIcon(name="tabler:confetti" :width="22" :height="22")
  .party-header__text
    span.party-header__eyebrow {{ $t('party.lobby.eyebrow') }}
    strong.party-header__title {{ title }}
  button.party-header__icon(type="button" :aria-label="$t('party.lobby.help')" @click="showHelp")
    AppIcon(name="tabler:help" :width="18" :height="18")
  button.party-header__leave(type="button" @click="leave")
    AppIcon(name="tabler:logout" :width="16" :height="16")
    span {{ $t('party.lobby.leave') }}
</template>

<script>
import { defineComponent, computed, inject, useStore, useContext, useRouter } from '@nuxtjs/composition-api'
import { Dialog } from 'vant'
import { wsTypeEnum } from '@/enums/wsType.enum'

// Turkish genitive suffix by vowel harmony: selim'in, murat'ın, doğu'nun, gül'ün
const genitive = name => {
  const lower = String(name).toLocaleLowerCase('tr')
  const vowels = lower.match(/[aeıioöuü]/g)
  const last = vowels ? vowels[vowels.length - 1] : 'i'
  const vowel = { a: 'ı', ı: 'ı', e: 'i', i: 'i', o: 'u', u: 'u', ö: 'ü', ü: 'ü' }[last]

  return /[aeıioöuü]$/.test(lower) ? `n${vowel}n` : `${vowel}n`
}

export default defineComponent({
  setup() {
    const store = useStore()
    const router = useRouter()
    const { i18n, localePath } = useContext()
    const send = inject('partySend')

    const title = computed(() => {
      const name = (store.state.party.room && store.state.party.room.hostName) || ''

      return i18n.t('party.lobby.roomOf', { name, suffix: genitive(name) })
    })

    const showHelp = () =>
      Dialog.alert({ title: i18n.t('party.lobby.help'), message: i18n.t('party.lobby.helpText'), getContainer: 'body' })

    const leave = () => {
      send(wsTypeEnum.PARTY_LEAVE)
      router.replace(localePath({ name: 'Party' }))
    }

    return { title, showHelp, leave }
  }
})
</script>

<style lang="scss" src="./PartyHeader.component.scss" scoped></style>
