<template lang="pug">
.auth-google-callback-page
  p {{ $t('auth.google.callback.redirecting') }}
  small(v-html="$t('auth.google.callback.ifNoRedirect')")
</template>

<script lang="ts">
import { defineComponent, useStore, useRouter, useContext, onMounted } from '@nuxtjs/composition-api'
const { getQuery, stringifyQuery } = require('ufo')

export default defineComponent({
  name: 'AuthGoogleCallbackPage',
  layout: 'Default/Default.layout',
  setup() {
    const context = useContext()
    const store = useStore()
    const router = useRouter()

    const fetchUser = async () => {
      const callbackParams = getQuery(window.location.href)

      const { data } = await store.dispatch('auth/fetchGoogleUser', stringifyQuery(callbackParams))

      return {
        data
      }
    }

    const setUser = async () => {
      const callbackParams = getQuery(window.location.href)

      const { data } = await fetchUser()

      if (data) {
        await store.dispatch('auth/setGoogleUser', { callbackParams, googleResponse: data })
      }

      const { data: meData } = await store.dispatch('auth/fetchMe')

      if (meData) {
        store.commit('auth/SET_USER', meData)
      }
    }

    onMounted(async () => {
      await Promise.allSettled([fetchUser(), setUser()])

      const redirectPath = context.$cookies.get('authNextRedirect')

      if (redirectPath) {
        await router.push(redirectPath)
      }
    })
  }
})
</script>

<style lang="scss" src="./AuthGoogleCallback.page.scss"></style>
