<template lang="pug">
.page.party-page
  .party-remote-gate(v-if="!loggedIn")
    AppIcon(name="tabler:lock" :width="22" :height="22")
    p {{ $t('party.remote.loginNotice') }}
    Button(round size="small" @click="login") {{ $t('party.gate.login') }}
  PartyRemoteControls(v-else :code="code")
</template>

<script>
import { defineComponent, computed, useContext, useRoute, useStore, useMeta } from '@nuxtjs/composition-api'
import { Button } from 'vant'

export default defineComponent({
  components: { Button },
  layout: 'Default/Default.layout',
  setup() {
    const { app, i18n } = useContext()
    // private rooms: never indexed (the /party landing is the page that ranks)
    useMeta(() => ({
      title: `${i18n.t('seo.partyRoom.title')} - ${i18n.t('seo.main.title')}`,
      meta: [
        { hid: 'description', name: 'description', content: i18n.t('seo.partyRoom.description') },
        { hid: 'og:title', name: 'og:title', content: `${i18n.t('seo.partyRoom.title')} - ${i18n.t('seo.main.title')}` },
        { hid: 'og:description', name: 'og:description', content: i18n.t('seo.partyRoom.description') },
        { hid: 'twitter:description', name: 'twitter:description', content: i18n.t('seo.partyRoom.description') },
        { hid: 'robots', name: 'robots', content: 'noindex,nofollow' }
      ]
    }))

    const route = useRoute()
    const store = useStore()
    const code = computed(() => route.value.params.code)
    const loggedIn = computed(() => Boolean(app.$auth.loggedIn))
    const login = () => store.commit('auth/SET_AUTH_DIALOG_IS_OPEN', true)

    return { code, loggedIn, login }
  },
  head: {}
})
</script>

<style lang="scss" scoped>
.party-page {
  padding: 12px;
}

.party-remote-gate {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  max-width: var(--mobile);
  margin: 0 auto;
  padding: 16px;
  color: var(--color-text-01);
  text-align: center;
  background: color-mix(in sRGB, var(--color-danger-01) 14%, transparent);
  border: 1px solid color-mix(in sRGB, var(--color-danger-01) 45%, transparent);
  border-radius: 14px;

  p {
    margin: 0;
  }
}
</style>
