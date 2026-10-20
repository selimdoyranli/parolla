<template lang="pug">
Dialog.dialog.preview-dialog(
  v-model="state.isOpen"
  get-container="body"
  :title="$t('economy.collection.preview')"
  :cancel-button-text="$t('general.close')"
  :show-confirm-button="false"
  :show-cancel-button="true"
  :close-on-click-overlay="true"
  @closed="$emit('closed')"
)
  ProfileView.preview-dialog__profile(v-if="player" preview :player="player")
</template>

<script>
import { defineComponent, computed, reactive, watch, useContext } from '@nuxtjs/composition-api'
import { Dialog } from 'vant'

// The viewer's profile card with their current loadout, optionally with `patch` slots applied on top
// (purchase preview: "how it would look if bought").
export default defineComponent({
  components: { Dialog: Dialog.Component },
  props: {
    isOpen: { type: Boolean, default: false },
    patch: { type: Object, default: null }
  },
  setup(props) {
    const { $auth } = useContext()

    const state = reactive({ isOpen: props.isOpen })
    const player = computed(() =>
      $auth.loggedIn ? { ...$auth.user, loadout: { ...($auth.user.loadout || {}), ...(props.patch || {}) } } : null
    )

    watch(
      () => props.isOpen,
      value => (state.isOpen = value)
    )

    return { state, player }
  }
})
</script>

<style lang="scss" src="./PreviewDialog.component.scss"></style>
