<template lang="pug">
.profile-achievements(v-if="isSelf")
  .profile-achievements__state(v-if="loading")
    Loading(color="var(--color-brand-02)")
  Empty(v-else-if="error" image="error" :description="$t('dialog.player.callback.error.title')")
    Button(@click="load") {{ $t('dialog.player.callback.error.action') }}
  AchievementList(v-else :items="items")
</template>

<script>
import { defineComponent, computed, ref, useStore, onMounted } from '@nuxtjs/composition-api'
import { Loading, Empty, Button } from 'vant'

export default defineComponent({
  components: { Loading, Empty, Button },
  setup() {
    const store = useStore()
    const loading = ref(true)
    const error = ref(null)

    const me = computed(() => store.getters['auth/user'])
    const player = computed(() => store.getters['profile/player'])
    // The endpoint is user-scoped, so the tab only makes sense on the viewer's own profile
    const isSelf = computed(() => Boolean(me.value && player.value && me.value.username === player.value.username))
    const items = computed(() => store.state.economy.achievements || [])

    const load = async () => {
      loading.value = true
      error.value = null

      if (isSelf.value) {
        const res = await store.dispatch('economy/fetchAchievements')

        error.value = res.error || null
      }

      loading.value = false
    }

    onMounted(load)

    return { isSelf, items, loading, error, load }
  }
})
</script>

<style scoped>
.profile-achievements {
  padding: 8px var(--base-p-x) 32px;
}

.profile-achievements__state {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}
</style>
