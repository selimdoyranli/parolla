<template lang="pug">
.cookie-consent-root
  transition(name="cookie-consent")
    .cookie-consent(v-if="state.choice === null" role="region" :aria-label="$t('cookieConsent.preferences.title')")
      .cookie-consent__body
        AppIcon.cookie-consent__icon(name="tabler:cookie" :width="22" :height="22")
        i18n.cookie-consent__text(path="cookieConsent.text" tag="p")
          template(#link)
            NuxtLink(:to="localePath({ name: 'Page-CookiePolicy' })") {{ $t('cookieConsent.link') }}
      .cookie-consent__actions
        Button.cookie-consent__button(round size="small" @click="rejectAll") {{ $t('cookieConsent.reject') }}
        Button.cookie-consent__button(round size="small" @click="openPreferences") {{ $t('cookieConsent.manage') }}
        Button.cookie-consent__button.cookie-consent__button--accept(round size="small" @click="acceptAll") {{ $t('cookieConsent.accept') }}

  Dialog.dialog.cookie-preferences(
    v-model="state.isOpenPreferences"
    show-cancel-button
    :title="$t('cookieConsent.preferences.title')"
    :cancel-button-text="$t('cookieConsent.preferences.cancel')"
    :confirm-button-text="$t('cookieConsent.preferences.save')"
    @open="draftAds = Boolean(state.choice && state.choice.ads)"
    @confirm="save({ ads: draftAds })"
  )
    CellGroup.cookie-preferences__list
      Cell(:label="$t('cookieConsent.preferences.necessaryDesc')" :title="$t('cookieConsent.preferences.necessary')")
        template(#right-icon)
          SwitchInput(:value="true" disabled size="22px")
      Cell(:label="$t('cookieConsent.preferences.adsDesc')" :title="$t('cookieConsent.preferences.ads')")
        template(#right-icon)
          SwitchInput(v-model="draftAds" size="22px")
</template>

<script>
import { defineComponent, ref } from '@nuxtjs/composition-api'
import { Button, Dialog, CellGroup, Cell, Switch } from 'vant'

export default defineComponent({
  components: { Button, Dialog: Dialog.Component, CellGroup, Cell, SwitchInput: Switch },
  setup() {
    const { state, save, acceptAll, rejectAll, openPreferences } = useCookieConsent()
    const draftAds = ref(false)

    return { state, draftAds, save, acceptAll, rejectAll, openPreferences }
  }
})
</script>

<style lang="scss" src="./CookieConsent.component.scss"></style>
