<template lang="pug">
//- "Watch an ad for gold" row (mobile app only), shown on the inventory, shop and quests tabs
.ad-reward-row(v-if="canWatchAd")
  AppIcon.ad-reward-row__icon(name="noto:television" :width="22" :height="22")
  .ad-reward-row__body
    b {{ $t('economy.adReward.title') }}
    span {{ $t('economy.adReward.desc', { gold: adReward.gold }) }}
  span.ad-reward-row__count {{ adsWatched }}/{{ adsMax }}
  button.shop-buy.shop-buy--owned(v-if="adsWatched >= adsMax" type="button" disabled)
    AppIcon(name="tabler:check" :width="14" :height="14")
    span {{ $t('economy.adReward.done') }}
  button.shop-buy(v-else type="button" :disabled="adBusy" @click="watchAd")
    GoldAmount(size="sm" :amount="adReward.gold")
</template>

<script>
import { defineComponent, ref, useContext, useStore } from '@nuxtjs/composition-api'
import { Notify } from 'vant'

export default defineComponent({
  setup() {
    const store = useStore()
    const { i18n, $auth } = useContext()
    const { postToNative } = useNativeBridge()
    const { adReward, adsMax, adsWatched, canWatchAd } = useAdReward()
    const adBusy = ref(false)

    const toast = (message, ok) =>
      Notify({
        message,
        color: 'var(--color-text-04)',
        background: ok ? 'var(--color-success-01)' : 'var(--color-danger-01)',
        duration: 3000
      })

    // Strapi grants the gold from AdMob's server-side callback, so the wallet is re-read after
    const watchAd = () => {
      if (!$auth.loggedIn) {
        store.commit('auth/SET_AUTH_DIALOG_IS_OPEN', true)

        return
      }

      if (adBusy.value) return
      adBusy.value = true

      // the SSV callback can land a moment after the ad closes
      const refreshWallet = () => [0, 2000, 5000].forEach(ms => setTimeout(() => store.dispatch('economy/fetchWallet'), ms))
      const timeout = setTimeout(() => (adBusy.value = false), 60000)

      window.__parollaRewardedAdResult = result => {
        clearTimeout(timeout)
        adBusy.value = false

        if (result && result.earned) {
          toast(i18n.t('economy.adReward.earned', { gold: adReward.value.gold }), true)
          refreshWallet()
        } else {
          toast(i18n.t(result && result.error ? 'economy.adReward.failed' : 'economy.adReward.notEarned'), false)
        }
      }

      postToNative('rewarded-ad-request', { userId: $auth.user.id })
    }

    return { adReward, adsMax, adsWatched, canWatchAd, adBusy, watchAd }
  }
})
</script>

<style lang="scss" src="./AdRewardRow.component.scss"></style>
