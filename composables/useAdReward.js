import { computed, useStore } from '@nuxtjs/composition-api'

// "Watch an ad for gold": only the mobile app build that announces native rewarded ads can show one;
// adReward ({ gold, earnedToday, cap }) comes from /economy/me, so it is set only for logged-in users
export const useAdReward = () => {
  const store = useStore()

  const adReward = computed(() => store.state.economy.wallet.adReward)
  const adsMax = computed(() => (adReward.value ? adReward.value.cap / adReward.value.gold : 0))
  const adsWatched = computed(() => (adReward.value ? Math.floor(adReward.value.earnedToday / adReward.value.gold) : 0))
  const canWatchAd = computed(() => Boolean(adReward.value && process.client && window.__parollaNativeAds?.rewarded))

  return { adReward, adsMax, adsWatched, canWatchAd }
}
