<template lang="pug">
.gold-earned(v-if="pending || incomplete || earned || capped || completed.length || guestGold")
  .gold-earned__placeholder(v-if="pending")
  template(v-else-if="$auth.loggedIn")
    p.gold-earned__note(v-if="incomplete") {{ $t('economy.earned.incomplete') }}
    p.gold-earned__amount(v-else-if="earned")
      GoldAmount(size="lg" signed :amount="earned")
    p.gold-earned__note(v-if="capped") {{ $t('economy.earned.capped') }}
    .gold-earned__quest(v-for="title in completed" :key="title")
      span {{ $t('economy.earned.questDone', { title }) }}
      Button(color="var(--color-brand-02)" size="mini" round @click="openQuests") {{ $t('economy.earned.viewQuests') }}
  template(v-else-if="guestGold")
    i18n.gold-earned__note(tag="p" path="economy.earned.guestTeaser")
      template(#amount)
        GoldAmount(:amount="guestGold")
    Button(color="var(--color-brand-02)" size="small" round @click="openLogin") {{ $t('economy.earned.login') }}
</template>

<script>
import { defineComponent, useContext, useStore, computed } from '@nuxtjs/composition-api'
import { Button } from 'vant'

export default defineComponent({
  components: { Button },
  props: {
    mode: { type: String, required: true }
  },
  setup(props) {
    const { i18n } = useContext()
    const store = useStore()

    const last = computed(() => {
      const e = store.state.economy.lastEconomy

      return e && e.mode === props.mode ? e : null
    })
    const pending = computed(() => store.state.economy.pendingMode === props.mode)
    const earned = computed(() => (last.value ? last.value.earned : 0))
    const capped = computed(() => !!(last.value && last.value.capped))
    const incomplete = computed(() => !!(last.value && last.value.incomplete))
    const guestGold = computed(() => {
      const g = store.state.economy.guestPreview

      return g && g.mode === props.mode ? g.gold : 0
    })

    // quest titles come from the quests list; fall back to the raw key until it has loaded
    const completed = computed(() => {
      if (!last.value) return []

      const q = store.state.economy.quests
      const all = q ? [...q.daily, ...q.weekly] : []

      return last.value.questsCompleted.map(key => {
        const found = all.find(x => x.key === key)

        return found ? found.title[i18n.locale] || found.title.tr : key
      })
    })

    const openQuests = () => store.commit('economy/OPEN_INVENTORY_DIALOG', 'quests')
    const openLogin = () => store.commit('auth/SET_AUTH_DIALOG_IS_OPEN', true)

    return { pending, incomplete, earned, capped, guestGold, completed, openQuests, openLogin }
  }
})
</script>

<style lang="scss" src="./GoldEarned.component.scss"></style>
