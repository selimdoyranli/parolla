<template lang="pug">
.auth-google-native-start-page
  p {{ $t('auth.google.callback.redirecting') }}
</template>

<script lang="ts">
import { defineComponent, onMounted } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'AuthGoogleNativeStartPage',
  layout: 'Default/Default.layout',
  setup() {
    // Entry point for the Expo in-app auth overlay. The native app opens this page (carrying
    // its custom-scheme redirect + the Strapi connect URL), we flag the session so the
    // callback page later bounces back to the app, then we forward into the normal Strapi
    // Google OAuth flow. Only the native overlay ever loads this page.
    onMounted(() => {
      const params = new URLSearchParams(window.location.search)
      const redirect = params.get('redirect')
      const connect = params.get('connect') || `${process.env.API_URL}/connect/google`

      if (redirect) {
        window.sessionStorage.setItem('parollaNativeAuthRedirect', redirect)
      }

      window.location.href = connect
    })
  }
})
</script>
