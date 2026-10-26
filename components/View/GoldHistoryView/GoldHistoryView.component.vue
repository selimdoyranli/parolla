<template lang="pug">
.gold-history-view
  .gold-history-view__login(v-if="!loggedIn")
    p {{ $t('economy.history.loginPrompt') }}
    Button(color="var(--color-brand-02)" round @click="openLogin") {{ $t('economy.collection.login') }}

  template(v-else)
    p.gold-history-view__balance
      | {{ $t('economy.history.balance') }}:
      GoldAmount.ms-1(:amount="balance")

    .gold-history-view__error(v-if="failed && !items.length")
      p {{ $t('economy.errors.generic') }}
      Button(round :loading="loading" @click="loadMore") {{ $t('economy.retry') }}

    p.gold-history-view__empty(v-else-if="loaded && !items.length") {{ $t('economy.history.empty') }}

    ul.gold-history-view__list(v-else)
      li.gold-history-view__row(v-for="(row, i) in items" :key="i")
        .gold-history-view__info
          b {{ reasonLabel(row) }}
          small.gold-history-view__note(v-if="row.note") “{{ row.note }}”
          time {{ formatDate(row.createdAt) }}
        .gold-history-view__amount(:class="row.amount >= 0 ? 'gold-history-view__amount--plus' : 'gold-history-view__amount--minus'")
          GoldAmount(signed :amount="row.amount")
          GoldAmount(size="sm" muted :amount="row.balanceAfter")

    p.gold-history-view__error(v-if="failed && items.length") {{ $t('economy.errors.generic') }}
    Button(v-if="hasMore || (failed && items.length)" block plain :loading="loading" @click="loadMore") {{ $t('economy.history.more') }}
</template>

<script>
import { defineComponent, computed, ref, onMounted, watch, useContext, useStore } from '@nuxtjs/composition-api'
import { Button } from 'vant'

export default defineComponent({
  components: { Button },
  setup() {
    const store = useStore()
    const { i18n, $auth } = useContext()

    const loggedIn = computed(() => $auth.loggedIn)
    const balance = computed(() => store.state.economy.wallet.gold)
    const items = ref([])
    const page = ref(0)
    const hasMore = ref(false)
    const loading = ref(false)
    const loaded = ref(false)
    const failed = ref(false)

    const reasonLabel = ({ reason, username, itemName }) => {
      // gift rows name the other player
      const key = username && i18n.te(`economy.history.reasonsWithUser.${reason}`) ? 'reasonsWithUser' : 'reasons'

      return i18n.te(`economy.history.${key}.${reason}`) ? i18n.t(`economy.history.${key}.${reason}`, { username, item: itemName }) : reason
    }
    const formatDate = iso =>
      new Date(iso).toLocaleString(i18n.locale === 'en' ? 'en-GB' : 'tr-TR', { dateStyle: 'medium', timeStyle: 'short' })

    const loadMore = async () => {
      if (loading.value) return

      loading.value = true

      try {
        const { data } = await store.dispatch('economy/fetchHistory', page.value + 1)

        failed.value = !data

        if (!data) return

        page.value = data.page
        items.value = items.value.concat(data.items)
        hasMore.value = data.hasMore
        loaded.value = true
      } finally {
        loading.value = false
      }
    }

    const start = () => {
      if (!loggedIn.value) return

      store.dispatch('economy/fetchWallet')
      loadMore()
    }

    const openLogin = () => store.commit('auth/SET_AUTH_DIALOG_IS_OPEN', true)

    watch(loggedIn, start)
    onMounted(start)

    return { loggedIn, balance, items, hasMore, loading, loaded, failed, reasonLabel, formatDate, loadMore, openLogin }
  }
})
</script>

<style lang="scss" src="./GoldHistoryView.component.scss"></style>
