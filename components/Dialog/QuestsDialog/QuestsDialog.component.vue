<template lang="pug">
Dialog.dialog.quests-dialog(
  v-model="state.isOpen"
  :title="$t('economy.quests.title')"
  :cancel-button-text="$t('general.close')"
  :show-confirm-button="false"
  :show-cancel-button="true"
  :close-on-click-overlay="false"
  @closed="$emit('closed')"
)
  template(v-if="quests")
    h4.quests-dialog__heading {{ $t('economy.quests.daily') }}
    QuestCard(
      v-for="q in quests.daily"
      :key="q.key"
      :quest="q"
      :can-reroll="quests.rerollAvailable && !q.completed"
      :busy="busy"
      @claim="claim"
      @reroll="reroll"
    )
    h4.quests-dialog__heading {{ $t('economy.quests.weekly') }}
    QuestCard(v-for="q in quests.weekly" :key="q.key" :quest="q" :busy="busy" @claim="claim")
    .quests-dialog__chest
      span {{ $t('economy.quests.chest', { done: claimedCount, total: quests.weekly.length }) }}
      Button(type="primary" size="small" :disabled="busy || !chestReady" @click="claimChest")
        | {{ $t('economy.quests.openChest') }}
        GoldAmount.ms-1(size="sm" :amount="quests.chest.reward")
  .quests-dialog__error(v-else-if="failed")
    p {{ $t('economy.errors.generic') }}
    Button(size="small" @click="load") {{ $t('economy.retry') }}
  Loading.quests-dialog__loading(v-else)
</template>

<script>
import { defineComponent, computed, reactive, ref, watch, useContext, useStore } from '@nuxtjs/composition-api'
import { Dialog, Button, Loading, Notify } from 'vant'

export default defineComponent({
  components: { Dialog: Dialog.Component, Button, Loading },
  props: {
    isOpen: { type: Boolean, required: false, default: false }
  },
  setup(props) {
    const store = useStore()
    const { i18n } = useContext()

    const state = reactive({ isOpen: props.isOpen })
    const busy = ref(false)
    const failed = ref(false)
    const quests = computed(() => store.state.economy.quests)
    const claimedCount = computed(() => (quests.value ? quests.value.weekly.filter(q => q.claimed).length : 0))

    const chestReady = computed(() => quests.value.chest.ready && !quests.value.chest.claimed)

    const refresh = () => Promise.all([store.dispatch('economy/fetchWallet'), store.dispatch('economy/fetchQuests')])

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
        const { error } = await store.dispatch('economy/fetchQuests')

        failed.value = Boolean(error)
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

    watch(
      () => props.isOpen,
      value => {
        state.isOpen = value

        if (value) load()
      },
      { immediate: true }
    )

    return { state, quests, busy, failed, load, claimedCount, chestReady, claim, reroll, claimChest }
  }
})
</script>

<style lang="scss" src="./QuestsDialog.component.scss"></style>
