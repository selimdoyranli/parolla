<template lang="pug">
.socket-status-banner(v-if="status" role="status" aria-live="polite" :class="`socket-status-banner--${status}`")
  Loading.socket-status-banner__spinner(v-if="isRetrying" color="currentColor" size="14px")
  AppIcon.socket-status-banner__icon(v-else name="tabler:plug-connected-x" :width="16" :height="16")
  span.socket-status-banner__text {{ $t(`socketStatus.${status}`) }}
  Button.socket-status-banner__action(v-if="!isRetrying" size="mini" round @click="$emit('reconnect')") {{ $t('socketStatus.reconnect') }}
</template>

<script>
import { defineComponent, computed } from '@nuxtjs/composition-api'
import { Button, Loading } from 'vant'

// status: null | 'restarting' | 'reconnecting' (auto-retrying) | 'idle' | 'kicked' | 'gmKicked' (waits for the user)
export default defineComponent({
  components: {
    Button,
    Loading
  },
  props: {
    status: {
      type: String,
      required: false,
      default: null
    }
  },
  setup(props) {
    const isRetrying = computed(() => props.status === 'restarting' || props.status === 'reconnecting')

    return { isRetrying }
  }
})
</script>

<style lang="scss" src="./SocketStatusBanner.component.scss"></style>
