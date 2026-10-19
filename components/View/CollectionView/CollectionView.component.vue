<template lang="pug">
.collection-view
  h1.collection-view__title {{ $t('economy.collection.title') }}

  .collection-view__login(v-if="!loggedIn")
    p {{ $t('economy.collection.loginPrompt') }}
    Button(type="primary" round @click="openLogin") {{ $t('economy.collection.login') }}

  template(v-else)
    .collection-view__preview
      h2.collection-view__heading {{ $t('economy.collection.preview') }}
      .collection-view__preview-top
        PlayerAvatar(with-username :user="previewUser" :size="64")
        .collection-view__plate(:style="plateStyle(previewUser)") {{ previewUser.username }}
      ProfileView.collection-view__profile(preview :player="previewUser")
      .collection-view__save
        span(v-if="dirty") {{ $t('economy.collection.unsaved') }}
        Button(type="primary" round :loading="saving" :disabled="!loaded || !dirty" @click="save") {{ $t('economy.collection.save') }}

    .collection-view__error(v-if="failed")
      p {{ $t('economy.errors.generic') }}
      Button(round :loading="retrying" @click="load") {{ $t('economy.retry') }}

    .collection-view__empty(v-if="loaded && !groups.length")
      p {{ $t('economy.collection.empty') }}
      Button(type="primary" round @click="$router.push(localePath({ name: 'Shop' }))") {{ $t('economy.collection.goShop') }}

    section.collection-view__group(v-for="g in groups" :key="g.category")
      h2.collection-view__heading {{ $t(`economy.shop.categories.${g.category}`) }}
      .collection-view__grid
        .collection-view__tile(v-for="item in g.items" :key="item.key")
          CosmeticCard(preview-only :variants="[item]" :viewer="viewer")
          b.collection-view__name {{ item.name }}
          Button(:type="isOn(item) ? 'default' : 'primary'" size="small" round @click="toggle(item)")
            | {{ $t(isOn(item) ? 'economy.collection.unequip' : 'economy.collection.equip') }}
</template>

<script>
import { defineComponent, computed, ref, onMounted, watch, useContext, useStore } from '@nuxtjs/composition-api'
import { Button, Notify } from 'vant'

// catalog category -> loadout slot, in display order
const SLOTS = {
  avatar_frame: 'frame',
  avatar_decoration: 'decoration',
  nameplate: 'nameplate',
  name_color: 'nameColor',
  title: 'title',
  profile_cover: 'profileCover',
  profile_frame: 'profileFrame',
  profile_effect: 'profileEffect'
}

const clean = loadout => Object.fromEntries(Object.entries(loadout || {}).filter(([, v]) => v))
const sorted = loadout => JSON.stringify(Object.entries(clean(loadout)).sort())

export default defineComponent({
  components: { Button },
  setup() {
    const store = useStore()
    const { i18n, $auth } = useContext()
    const { plateStyle } = useCosmetics()

    const loggedIn = computed(() => $auth.loggedIn)
    const viewer = computed(() => ($auth.loggedIn ? $auth.user : null))
    const loaded = ref(false)
    const saving = ref(false)
    const failed = ref(false)
    const retrying = ref(false)
    const draft = ref({})

    const catalogMap = computed(() => store.getters['economy/catalogMap'])
    const inventory = computed(() => store.state.economy.inventory)
    const dirty = computed(() => sorted(draft.value) !== sorted(inventory.value && inventory.value.loadout))
    const previewUser = computed(() => ({ ...(viewer.value || {}), loadout: draft.value }))

    const groups = computed(() => {
      const items = ((inventory.value && inventory.value.owned) || []).map(o => catalogMap.value[o.itemKey]).filter(Boolean)

      return Object.keys(SLOTS)
        .map(category => ({ category, items: items.filter(i => i.category === category) }))
        .filter(g => g.items.length)
    })

    const isOn = item => draft.value[SLOTS[item.category]] === item.key
    const toggle = item => (draft.value = { ...draft.value, [SLOTS[item.category]]: isOn(item) ? null : item.key })

    const load = async () => {
      if (!loggedIn.value) return

      retrying.value = true

      try {
        // catalog first (cached = instant): filtering against a still-empty catalog would drop every key
        const [{ error }] = await Promise.all([store.dispatch('economy/fetchInventory'), store.dispatch('economy/fetchCatalog')])

        failed.value = Boolean(error)

        if (error) return

        // server resolveLoadout already drops dead keys
        draft.value = clean(store.state.economy.inventory && store.state.economy.inventory.loadout)
        loaded.value = true
      } finally {
        retrying.value = false
      }
    }

    const toast = (message, ok) =>
      Notify({
        message,
        color: 'var(--color-text-04)',
        background: ok ? 'var(--color-success-01)' : 'var(--color-danger-01)',
        duration: 3000
      })

    const save = async () => {
      if (saving.value) return

      saving.value = true

      try {
        // PUT replaces the whole loadout, so the full draft goes out
        const { error } = await store.dispatch('economy/saveLoadout', clean(draft.value))

        if (error) {
          const key = `economy.errors.${error.details && error.details.code}`

          return toast(i18n.te(key) ? i18n.t(key) : i18n.t('economy.errors.generic'), false)
        }

        toast(i18n.t('economy.collection.saved'), true)
      } finally {
        saving.value = false
      }
    }

    const openLogin = () => store.commit('auth/SET_AUTH_DIALOG_IS_OPEN', true)

    watch(loggedIn, load)
    onMounted(load)

    return {
      loggedIn,
      viewer,
      loaded,
      failed,
      retrying,
      load,
      saving,
      dirty,
      previewUser,
      groups,
      plateStyle,
      isOn,
      toggle,
      save,
      openLogin
    }
  }
})
</script>

<style lang="scss" src="./CollectionView.component.scss"></style>
