import { Notify } from 'vant'

export default ({ app, store }) => {
  let running = false

  const dailyLogin = async () => {
    if (running || !app.$auth.loggedIn) return
    running = true

    try {
      await store.dispatch('economy/fetchWallet')

      if (store.state.economy.wallet.canClaimDaily) {
        const { data } = await store.dispatch('economy/claimDaily')

        if (data && data.status === 'claimed') {
          Notify({
            message: app.i18n.t('economy.dailyReward', { amount: data.amount, streak: data.streak }),
            color: 'var(--color-text-04)',
            background: 'var(--color-success-01)',
            duration: 4000
          })
        }
      }
    } finally {
      running = false
    }
  }

  store.dispatch('economy/fetchCatalog')
  dailyLogin()
  // login happens later without a reload (Google/Apple callback)
  store.watch(
    () => app.$auth.loggedIn,
    loggedIn => loggedIn && dailyLogin()
  )
}
