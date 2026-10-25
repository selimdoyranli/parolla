import { computed, useContext, useStore } from '@nuxtjs/composition-api'

// "Watch an ad for gold": only the mobile app build that announces native rewarded ads can show one;
// adReward ({ gold, earnedToday, cap }) comes from /economy/me, so it is set only for logged-in users
// shortcut: guests see Strapi's AD_REWARD_GOLD / AD_REWARD_DAILY_CAP copied here, keep in sync if those change
const GUEST_AD_REWARD = Object.freeze({ gold: 20, earnedToday: 0, cap: 60 })

export const useAdReward = () => {
  const store = useStore()
  const { $auth } = useContext()

  // guests get the row too (tapping it asks them to log in first)
  const adReward = computed(() => store.state.economy.wallet.adReward || ($auth.loggedIn ? null : GUEST_AD_REWARD))
  const adsMax = computed(() => (adReward.value ? adReward.value.cap / adReward.value.gold : 0))
  const adsWatched = computed(() => (adReward.value ? Math.floor(adReward.value.earnedToday / adReward.value.gold) : 0))
  const canWatchAd = computed(() => Boolean(adReward.value && process.client && window.__parollaNativeAds?.rewarded))

  return { adReward, adsMax, adsWatched, canWatchAd }
}
