<template lang="pug">
transition(name="cookie-consent")
  .cookie-consent(v-if="isVisible" role="region" :aria-label="$t('cookieConsent.link')")
    i18n.cookie-consent__text(path="cookieConsent.text" tag="p")
      template(#link)
        NuxtLink(:to="localePath({ name: 'Page-CookiePolicy' })") {{ $t('cookieConsent.link') }}
    Button.cookie-consent__accept(round size="small" @click="accept") {{ $t('cookieConsent.accept') }}
</template>

<script>
import { defineComponent, ref, onMounted } from '@nuxtjs/composition-api'
import { Button } from 'vant'

const STORAGE_KEY = 'parolla:cookieConsent'

export default defineComponent({
  components: { Button },
  setup() {
    const isVisible = ref(false)

    // storage can throw (private mode, blocked site data): then the notice just shows each visit
    onMounted(() => {
      try {
        isVisible.value = !localStorage.getItem(STORAGE_KEY)
      } catch {
        isVisible.value = true
      }
    })

    const accept = () => {
      isVisible.value = false

      try {
        localStorage.setItem(STORAGE_KEY, '1')
      } catch {}
    }

    return { isVisible, accept }
  }
})
</script>

<style lang="scss" src="./CookieConsent.component.scss"></style>
