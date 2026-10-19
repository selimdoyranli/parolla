<template lang="pug">
.jeton-earned(v-if="pending || earned || capped || completed.length || guestJeton")
  .jeton-earned__placeholder(v-if="pending")
  template(v-else-if="$auth.loggedIn")
    p.jeton-earned__amount(v-if="earned") {{ $t('economy.earned.amount', { amount: earned }) }}
    p.jeton-earned__note(v-if="capped") {{ $t('economy.earned.capped') }}
    .jeton-earned__quest(v-for="title in completed" :key="title")
      span {{ $t('economy.earned.questDone', { title }) }}
      Button(type="primary" size="mini" round @click="openQuests") {{ $t('economy.earned.viewQuests') }}
  template(v-else-if="guestJeton")
    p.jeton-earned__note {{ $t('economy.earned.guestTeaser', { amount: guestJeton }) }}
    Button(type="primary" size="small" round @click="openLogin") {{ $t('economy.earned.login') }}
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
    const guestJeton = computed(() => {
      const g = store.state.economy.guestPreview

      return g && g.mode === props.mode ? g.jeton : 0
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

    const openQuests = () => store.commit('economy/SET_IS_OPEN_QUESTS_DIALOG', true)
    const openLogin = () => store.commit('auth/SET_AUTH_DIALOG_IS_OPEN', true)

    return { pending, earned, capped, guestJeton, completed, openQuests, openLogin }
  }
})
</script>

<style lang="scss" src="./JetonEarned.component.scss"></style>
