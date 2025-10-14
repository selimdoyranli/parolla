<template lang="pug">
.page.profile-edit-page
  template(v-if="fetchState.pending")
    Loading(color="var(--color-brand-02)")

  template(v-else-if="fetchState.error")
    Empty(image="error" :description="$t('error.anErrorOccurred')")
      Button(@click="reFetch") {{ $t('error.tryAgain') }}

  template(v-else)
    ProfileEditForm
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

    const username = computed(() => route.value.query.username)

    const { fetch, fetchState } = useFetch(async () => {
      await store.dispatch('profile/fetchPlayer', { username: username.value })
    })

    const player = computed(() => store.getters['profile/player'])

    const reFetch = async () => {
      await fetch()
    }

    return {
      fetch,
      fetchState,
      player,
      reFetch
    }
  }
})
</script>

<style lang="scss" src="./ProfileEdit.page.scss"></style>
