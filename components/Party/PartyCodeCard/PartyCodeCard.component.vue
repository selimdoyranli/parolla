<template lang="pug">
section.party-code-card
  button.party-code-card__qr(type="button" :aria-label="$t('party.lobby.qrHint')" @click="isQrOpen = true")
    img(v-if="qrSrc" :src="qrSrc" alt)
  .party-code-card__text
    span.party-code-card__label {{ $t('party.room.code') }}
    strong.party-code-card__code {{ prettyCode }}
  button.party-code-card__action(type="button" :aria-label="$t('party.lobby.copy')" @click="copy")
    AppIcon(name="tabler:copy" :width="18" :height="18")
  button.party-code-card__action(type="button" :aria-label="$t('party.lobby.share')" @click="share")
    AppIcon(name="tabler:share" :width="18" :height="18")

  Dialog.party-code-card__dialog(
    v-model="isQrOpen"
    close-on-click-overlay
    get-container="body"
    :show-confirm-button="false"
    :show-cancel-button="false"
  )
    .party-code-card__big
      img.party-code-card__big-qr(v-if="qrSrc" :src="qrSrc" :alt="prettyCode")
      strong.party-code-card__code {{ prettyCode }}
      p.party-code-card__hint {{ $t('party.lobby.qrHint') }}
      Button(round block @click="isQrOpen = false") {{ $t('party.lobby.close') }}
</template>

<script>
import { defineComponent, ref, computed, watch, useStore, useContext } from '@nuxtjs/composition-api'
import { Dialog, Button } from 'vant'
import QRCode from 'qrcode'
import { APP_URL } from '@/system/constant'
import { showToast } from '@/helpers/toast'

export default defineComponent({
  components: { Dialog: Dialog.Component, Button },
  setup() {
    const store = useStore()
    const { i18n, localePath } = useContext()
    const { postToNative } = useNativeBridge()
    const isQrOpen = ref(false)
    const qrSrc = ref('')

    const code = computed(() => (store.state.party.room && store.state.party.room.code) || '')
    const prettyCode = computed(() => `${code.value.slice(0, 3)} ${code.value.slice(3)}`)
    const url = computed(() => `${APP_URL}${localePath({ name: 'Party-code', params: { code: code.value } })}`)

    // one large render, the thumbnail just scales it down
    watch(
      url,
      async value => {
        qrSrc.value = code.value ? await QRCode.toDataURL(value, { width: 480, margin: 1 }) : ''
      },
      { immediate: true }
    )

    const copy = async () => {
      try {
        await navigator.clipboard.writeText(url.value)
        showToast.default(i18n.t('party.lobby.copied'))
      } catch {
        showToast.fail(url.value)
      }
    }

    // same order as the stats dialogs: native sheet in the app, clipboard + navigator.share on the web
    const share = async () => {
      const text = i18n.t('party.lobby.shareText', { code: prettyCode.value, url: url.value })

      postToNative('sharer', text)

      try {
        await navigator.clipboard.writeText(text)
        await showToast.default(i18n.t('clipboard.callback.success'))
        await navigator.share({ title: 'parolla', text })
      } catch {
        /* share sheet dismissed or unsupported: the text is already on the clipboard */
      }
    }

    return { isQrOpen, qrSrc, prettyCode, copy, share }
  }
})
</script>

<style lang="scss" src="./PartyCodeCard.component.scss" scoped></style>
