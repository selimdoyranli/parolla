<template lang="pug">
Dialog.create-guest-drawer-dialog(
  v-model="visible"
  :show-confirm-button="false"
  :show-cancel-button="false"
  :close-on-click-overlay="true"
  @closed="$emit('close')"
)
  .create-guest-drawer-dialog__inner
    header.create-guest-drawer-dialog__head
      h3.create-guest-drawer-dialog__title {{ $t('dialog.guestDrawer.title') }}

    .create-guest-drawer-dialog__avatar-block
      PlayerAvatar.create-guest-drawer-dialog__avatar(:user="avatarUser" :size="96")
      Button(plain size="small" round @click="onRegenerateAvatar") {{ $t('dialog.guestDrawer.regenerateAvatar') }}

    label.create-guest-drawer-dialog__label {{ $t('dialog.guestDrawer.usernameLabel') }}
    .create-guest-drawer-dialog__field-row
      Field.create-guest-drawer-dialog__field(v-model="inputName" :maxlength="30" :error="!!errorMsg")
      Button(plain size="small" round @click="onRegenerateName") {{ $t('dialog.guestDrawer.regenerateName') }}
    .create-guest-drawer-dialog__error(v-if="errorMsg") {{ $t(errorMsg) }}

    .create-guest-drawer-dialog__actions
      Button(type="primary" block round @click="onConfirm") {{ $t('dialog.guestDrawer.confirm') }}
</template>

<script>
import { defineComponent, ref, computed, onMounted } from '@nuxtjs/composition-api'
import { Dialog, Field, Button } from 'vant'
import { useDrawGuestIdentity } from '@/composables/useDrawGuestIdentity'
import { useDrawSocket } from '@/composables/useDrawSocket'
import { wsTypeEnum } from '@/enums/wsType.enum'

export default defineComponent({
  components: {
    Dialog: Dialog.Component,
    Field,
    Button
  },
  emits: ['close'],
  setup() {
    const visible = ref(true)

    const { ensureIdentity, identity, regenerateName, regenerateAvatar, setName } = useDrawGuestIdentity()
    const { send } = useDrawSocket()

    const inputName = ref('')
    const errorMsg = ref(null)

    const avatarUser = computed(() => ({
      username: identity.value.name || '',
      avatarSource: 'diceBear',
      diceBear: { seed: identity.value.avatarSeed }
    }))

    const sendProfileUpdate = () => {
      const { id, name, avatarSeed } = identity.value

      if (!id || !name || !avatarSeed) return
      send(wsTypeEnum.DRAW_GUEST_PROFILE_UPDATE, { payload: { name, avatarSeed } })
    }

    const onRegenerateAvatar = () => {
      regenerateAvatar()
      sendProfileUpdate()
    }

    const onRegenerateName = () => {
      regenerateName()
      inputName.value = identity.value.name
      errorMsg.value = null
      sendProfileUpdate()
    }

    const onConfirm = async () => {
      const candidate = inputName.value.trim()

      if (!candidate || candidate === identity.value.name) {
        visible.value = false

        return
      }
      const r = await setName(candidate)

      if (!r.ok) {
        errorMsg.value = r.error

        return
      }
      errorMsg.value = null
      sendProfileUpdate()
      visible.value = false
    }

    onMounted(() => {
      ensureIdentity()
      inputName.value = identity.value.name || ''
    })

    return {
      visible,
      inputName,
      errorMsg,
      avatarUser,
      onRegenerateAvatar,
      onRegenerateName,
      onConfirm
    }
  }
})
</script>

<style src="./CreateGuestDrawerDialog.component.scss" lang="scss" scoped />
