<template lang="pug">
Dialog.party-remote-dialog(
  :value="value"
  close-on-click-overlay
  get-container="body"
  :show-confirm-button="false"
  :show-cancel-button="false"
  @input="$emit('input', $event)"
)
  .party-remote-dialog__body
    button.party-remote-dialog__close(type="button" :aria-label="$t('party.lobby.close')" @click="$emit('input', false)")
      AppIcon(name="tabler:x" :width="16" :height="16")
    .party-remote-dialog__icon
      AppIcon(name="tabler:device-mobile" :width="22" :height="22")
    strong.party-remote-dialog__title {{ $t('party.remote.title') }}
    p.party-remote-dialog__text {{ $t('party.remote.dialogText') }}
    img.party-remote-dialog__qr(v-if="qrSrc" :src="qrSrc" :alt="$t('party.remote.title')")
    button.party-remote-dialog__link(type="button" @click="copy")
      span.party-remote-dialog__url {{ shortUrl }}
      span.party-remote-dialog__copy
        AppIcon(name="tabler:copy" :width="14" :height="14")
        | {{ $t('party.lobby.copy') }}
</template>

<script>
import { defineComponent, ref, computed, watch, useStore, useContext } from '@nuxtjs/composition-api'
import { Dialog } from 'vant'
import QRCode from 'qrcode'
import { APP_URL } from '@/system/constant'
import { showToast } from '@/helpers/toast'

// Lobby "Kumanda": QR + link of /party/:code/remote (host account only, the page enforces it)
export default defineComponent({
  components: { Dialog: Dialog.Component },
  props: { value: { type: Boolean, default: false } },
  setup() {
    const store = useStore()
    const { i18n, localePath } = useContext()
    const qrSrc = ref('')

    const code = computed(() => (store.state.party.room && store.state.party.room.code) || '')
    const url = computed(() => `${APP_URL}${localePath({ name: 'Party-code-remote', params: { code: code.value } })}`)
    const shortUrl = computed(() => url.value.replace(/^https?:\/\//, ''))

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

    return { qrSrc, shortUrl, copy }
  }
})
</script>

<style lang="scss" src="./PartyRemoteDialog.component.scss" scoped></style>
