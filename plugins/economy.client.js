import { Notify } from 'vant'

export default ({ app, store }) => {
  let running = false
  // the nuxtAuth vuex module is registered after plugins start, so it can be absent on the first read
  const isLoggedIn = () => Boolean(store.state.nuxtAuth && store.state.nuxtAuth.loggedIn)

  const dailyLogin = async () => {
    if (running || !isLoggedIn()) return
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
    } catch (e) {
      // a failed notification/claim must not surface as an unhandled rejection
    } finally {
      running = false
    }
  }

  store.dispatch('economy/fetchCatalog')
  dailyLogin()
  // login happens later without a reload (Google/Apple callback)
  store.watch(
    () => isLoggedIn(),
    loggedIn => (loggedIn ? dailyLogin() : store.commit('economy/RESET'))
  )
}
