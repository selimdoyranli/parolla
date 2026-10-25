<template lang="pug">
.quests-view
  AdRewardRow
  .quests-view__login(v-if="!loggedIn")
    p {{ $t('economy.quests.loginPrompt') }}
    Button(color="var(--color-brand-02)" round @click="openLogin") {{ $t('economy.collection.login') }}
  template(v-else-if="quests")
    // Streak freeze: one compact row, not a banner
    .quests-view__freeze
      AppIcon.quests-view__freeze-icon(name="emojione:snowflake" :width="22" :height="22")
      .quests-view__freeze-body
        b {{ $t('economy.shop.freeze.title') }}
        span {{ $t('economy.shop.freeze.desc') }}
      span.quests-view__freeze-count {{ freezes }}/{{ MAX_FREEZES }}
      button.shop-buy.shop-buy--owned(v-if="freezes >= MAX_FREEZES" type="button" disabled)
        AppIcon(name="tabler:check" :width="14" :height="14")
        span {{ $t('economy.shop.freeze.full') }}
      button.shop-buy(v-else type="button" @click="isFreezeOpen = true")
        GoldAmount(size="sm" :amount="FREEZE_PRICE")
    section.quests-view__section
      h4.quests-view__heading {{ $t('economy.quests.daily') }}
      QuestCard(
        v-for="q in quests.daily"
        :key="q.key"
        :quest="q"
        :can-reroll="quests.rerollAvailable && !q.completed"
        :busy="busy"
        @claim="claim"
        @reroll="reroll"
      )
    InlineAd
    section.quests-view__section
      h4.quests-view__heading {{ $t('economy.quests.weekly') }}
      QuestCard(v-for="q in quests.weekly" :key="q.key" :quest="q" :busy="busy" @claim="claim")
      .quests-view__chest(:class="{ 'quests-view__chest--done': quests.chest.claimed }")
        AppIcon.quests-view__chest-icon(name="noto:coin" :width="24" :height="24")
        .quests-view__chest-body
          .quests-view__chest-title {{ $t('economy.quests.chestTitle') }}
          .quests-view__chest-hint {{ $t('economy.quests.chestHint') }} · {{ claimedCount }} / {{ quests.weekly.length }}
        AppIcon.quests-view__chest-check(v-if="quests.chest.claimed" name="tabler:check" :width="20" :height="20")
        Button(v-else-if="chestReady" color="var(--color-brand-02)" size="small" :disabled="busy" @click="claimChest")
          | {{ $t('economy.quests.claim') }}
          GoldAmount.ms-1(size="sm" :amount="quests.chest.reward")
        GoldAmount(v-else size="sm" :amount="quests.chest.reward")
    section.quests-view__section(v-if="achievements.length || achievementsFailed")
      h4.quests-view__heading {{ $t('economy.achievements.title') }}
      AchievementList(v-if="achievements.length" :items="achievements")
      .quests-view__error(v-else)
        p {{ $t('economy.errors.generic') }}
        Button(size="small" @click="load") {{ $t('economy.retry') }}
  .quests-view__error(v-else-if="failed")
    p {{ $t('economy.errors.generic') }}
    Button(size="small" @click="load") {{ $t('economy.retry') }}
  Loading.quests-view__loading(v-else)

  // mounted only while open: the dialog moves itself to body, which breaks sibling patches when quests load
  LazyPurchaseDialog(v-if="isFreezeOpen" is-open :target="freezeTarget" @closed="isFreezeOpen = false")
</template>

<script>
import { defineComponent, computed, ref, watch, onMounted, useContext, useStore } from '@nuxtjs/composition-api'
import { Button, Loading, Notify } from 'vant'

const MAX_FREEZES = 2
const FREEZE_PRICE = 200

export default defineComponent({
  components: { Button, Loading },
  setup() {
    const store = useStore()
    const { i18n, $auth } = useContext()

    const loggedIn = computed(() => $auth.loggedIn)
    const busy = ref(false)
    const isFreezeOpen = ref(false)
    const freezeTarget = computed(() => ({
      type: 'freeze',
      name: i18n.t('economy.shop.freeze.title'),
      price: FREEZE_PRICE,
      max: MAX_FREEZES
    }))
    const freezes = computed(() => store.state.economy.wallet.streakFreezes)

    const failed = ref(false)
    const achievementsFailed = ref(false)
    const quests = computed(() => store.state.economy.quests)
    const achievements = computed(() => store.state.economy.achievements || [])
    const claimedCount = computed(() => (quests.value ? quests.value.weekly.filter(q => q.claimed).length : 0))

    const chestReady = computed(() => quests.value.chest.ready && !quests.value.chest.claimed)

    const refresh = () =>
      Promise.all([
        store.dispatch('economy/fetchWallet'),
        store.dispatch('economy/fetchQuests'),
        store.dispatch('economy/fetchAchievements')
      ])

    const toast = (message, ok) =>
      Notify({
        message,
        color: 'var(--color-text-04)',
        background: ok ? 'var(--color-success-01)' : 'var(--color-danger-01)',
        duration: 3000
      })

    const load = async () => {
      failed.value = false

      try {
        const [{ error }, ach] = await Promise.all([store.dispatch('economy/fetchQuests'), store.dispatch('economy/fetchAchievements')])

        failed.value = Boolean(error)
        achievementsFailed.value = Boolean(ach.error)
      } catch (e) {
        failed.value = true
      }
    }

    const run = async (action, arg, success) => {
      if (busy.value) return
      busy.value = true

      try {
        const { data, error } = await store.dispatch(action, arg)
        const code = error && error.details && error.details.code
        const key = `economy.errors.${code}`

        if (error) toast(i18n.te(key) ? i18n.t(key) : i18n.t('economy.errors.generic'), false)
        else toast(success(data), true)

        await refresh()
      } catch (e) {
        toast(i18n.t('economy.errors.generic'), false)
      } finally {
        busy.value = false
      }
    }

    const claim = q => run('economy/claimQuest', q.key, d => i18n.t('economy.quests.claimed', { amount: d.reward }))
    const reroll = q => run('economy/rerollQuest', q.key, () => i18n.t('economy.quests.rerolled'))
    const claimChest = () => run('economy/claimChest', undefined, d => i18n.t('economy.quests.chestClaimed', { amount: d.reward }))

    const openLogin = () => store.commit('auth/SET_AUTH_DIALOG_IS_OPEN', true)

    watch(loggedIn, value => value && load())
    onMounted(() => loggedIn.value && load())

    return {
      MAX_FREEZES,
      FREEZE_PRICE,
      freezes,
      isFreezeOpen,
      freezeTarget,
      achievementsFailed,
      loggedIn,
      openLogin,
      quests,
      busy,
      failed,
      load,
      claimedCount,
      achievements,
      chestReady,
      claim,
      reroll,
      claimChest
    }
  }
})
</script>

<style lang="scss" src="./QuestsView.component.scss"></style>
