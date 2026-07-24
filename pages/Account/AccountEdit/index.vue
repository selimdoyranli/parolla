<template lang="pug">
.page.account-edit-page
  template(v-if="fetchState.pending")
    Loading(color="var(--color-brand-02)")

  template(v-else-if="fetchState.error")
    Empty(image="error" :description="$t('error.anErrorOccurred')")
      Button(@click="reFetch") {{ $t('error.tryAgain') }}

  template(v-else)
    ProfileEditForm
</template>

<script>
import { defineComponent, useStore, useFetch } from '@nuxtjs/composition-api'
import { Loading, Empty, Button } from 'vant'

export default defineComponent({
  components: {
    Loading,
    Empty,
    Button
  },
  layout: 'Default/Default.layout',
  middleware: ['auth-control'],
  setup() {
    const store = useStore()

    const { fetch, fetchState } = useFetch(async () => {
      await store.dispatch('auth/fetchMe')
    })

    const reFetch = async () => {
      await fetch()
    }

    return {
      fetchState,
      reFetch
    }
  }
})
</script>

<style lang="scss" src="./AccountEdit.page.scss"></style>
