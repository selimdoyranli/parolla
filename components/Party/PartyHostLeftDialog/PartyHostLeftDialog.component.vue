<template lang="pug">
//- blocking: no close button, no overlay close; the only way out is the quiz list
Dialog.party-host-left(
  :value="true"
  get-container="body"
  :show-confirm-button="false"
  :show-cancel-button="false"
  :close-on-click-overlay="false"
  :close-on-popstate="false"
)
  .party-host-left__inner
    .party-host-left__icon
      AppIcon(name="tabler:door-exit" :width="28" :height="28")
    h3.party-host-left__title {{ $t('party.closed.noHostTitle') }}
    p.party-host-left__text {{ $t('party.closed.noHostText') }}
    Button(color="var(--color-brand-02)" round block @click="goQuizzes") {{ $t('party.closed.backToQuizzes') }}
</template>

<script>
import { defineComponent, useContext, useRouter } from '@nuxtjs/composition-api'
import { Dialog, Button } from 'vant'

export default defineComponent({
  components: { Dialog: Dialog.Component, Button },
  setup() {
    const { localePath } = useContext()
    const router = useRouter()

    const goQuizzes = () => router.replace(localePath({ name: 'CreatorMode-CreatorModeRooms' }))

    return { goQuizzes }
  }
})
</script>

<style lang="scss" src="./PartyHostLeftDialog.component.scss" scoped></style>
