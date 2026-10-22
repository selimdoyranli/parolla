<template lang="pug">
Button.community-join-button(
  v-if="config"
  :type="config.type"
  round
  size="small"
  :loading="isLoading"
  :disabled="config.disabled || isLoading"
  @click.stop.prevent="handleClick"
) {{ config.label }}
</template>

<script>
import { defineComponent, computed, ref, useStore, useContext, useRouter } from '@nuxtjs/composition-api'
import { Button, Dialog } from 'vant'
import { communityViewerRoleEnum } from '@/enums/community.enum'

export default defineComponent({
  name: 'CommunityJoinButton',
  components: { Button },
  props: {
    community: { type: Object, required: true }
  },
  setup(props, { emit }) {
    const store = useStore()
    const router = useRouter()
    const { i18n, app, $auth } = useContext()
    const isLoading = ref(false)
    const role = computed(() => props.community.viewerRole || communityViewerRoleEnum.NONE)

    // spec 5.7 state machine; the member state shows "Üyesin", clicking it asks to leave
    const config = computed(() => {
      const t = key => i18n.t(`community.joinButton.${key}`)

      if (role.value === communityViewerRoleEnum.OWNER) return { label: t('owner'), type: 'default' }

      if (role.value === communityViewerRoleEnum.PENDING) return { label: t('pending'), type: 'default' }

      if (role.value === communityViewerRoleEnum.NONE) {
        return { label: $auth.loggedIn ? t('join') : t('guestJoin'), type: 'warning' }
      }

      return { label: t('member'), type: 'default' }
    })

    const call = async action => {
      isLoading.value = true

      const { data, error } = await store.dispatch(`community/${action}`, { documentId: props.community.documentId })

      isLoading.value = false

      if (!error) emit('changed', { viewerRole: data?.viewerRole ?? communityViewerRoleEnum.NONE })
    }

    const confirmThen = (message, action) =>
      Dialog.confirm({
        message: i18n.t(`community.joinButton.${message}`),
        cancelButtonText: i18n.t('general.cancel'),
        confirmButtonText: i18n.t('general.apply')
      })
        .then(() => call(action))
        .catch(() => {})

    const handleClick = () => {
      if (role.value === communityViewerRoleEnum.OWNER) {
        return router.push(app.localePath({ name: 'Community-CommunityEdit-slug', params: { slug: props.community.slug } }))
      }

      if (role.value === communityViewerRoleEnum.PENDING) return confirmThen('confirmCancel', 'leaveCommunity')

      if (role.value !== communityViewerRoleEnum.NONE) return confirmThen('confirmLeave', 'leaveCommunity')

      if (!$auth.loggedIn) return store.commit('auth/SET_AUTH_DIALOG_IS_OPEN', true)

      return call('joinCommunity')
    }

    return { config, isLoading, handleClick }
  }
})
</script>

<style lang="scss" src="./CommunityJoinButton.component.scss"></style>
