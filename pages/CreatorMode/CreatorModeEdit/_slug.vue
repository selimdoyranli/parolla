<template lang="pug">
.page.creator-mode-edit-page
  template(v-if="fetchState.pending")
    Loading(color="var(--color-brand-02)")

  template(v-else-if="fetchState.error")
    Empty(image="error" :description="$t('error.anErrorOccurred')")
      Button(@click="reFetch") {{ $t('error.tryAgain') }}

  template(v-else)
    CreatorModeComposeForm(:room="room")
</template>

<script>
import { defineComponent, useRoute, useStore, useFetch, computed } from '@nuxtjs/composition-api'
import { Loading, Empty } from 'vant'

export default defineComponent({
  components: {
    Loading,
    Empty
  },
  layout: 'Default/Default.layout',
  middleware: ['auth-control'],
  setup() {
    const route = useRoute()
    const store = useStore()

    const roomId = computed(() => route.value.params.slug)

    const { fetch, fetchState } = useFetch(async () => {
      await store.dispatch('creator/fetchRoom', roomId.value)
    })

    const room = computed(() => store.getters['creator/room'])

    const reFetch = async () => {
      await fetch()
    }

    return {
      fetch,
      fetchState,
      room,
      reFetch
    }
  }
})
</script>

<style lang="scss" src="./CreatorModeEdit.page.scss"></style>
