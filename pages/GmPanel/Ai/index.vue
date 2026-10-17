<template lang="pug">
.page.gm-panel-page
  GmPanel(:description="$t('gmPanel.ai.settings.description')")
    Loading(v-if="!form" color="var(--color-brand-02)")

    template(v-else)
      span.gm-panel__itemsTitle {{ $t('gmPanel.ai.settings.provider') }}
      CellGroup.gm-panel__group(inset)
        RadioGroup(v-model="form.provider")
          Cell(v-for="provider in providers" :key="provider" clickable :title="providerLabels[provider]" @click="form.provider = provider")
            template(#right-icon)
              Radio(:name="provider")
        Field(
          v-model="form.model"
          :label="$t('gmPanel.ai.settings.model')"
          :placeholder="$t('gmPanel.ai.settings.modelPlaceholder')"
          input-align="right"
        )

      span.gm-panel__itemsTitle {{ $t('gmPanel.ai.settings.apiKeys') }}
      CellGroup.gm-panel__group(inset)
        // Write-only: the stored key never comes back, the field shows a "*****a1b2" hint
        Field(
          v-for="provider in providers"
          :key="provider"
          :type="keys[provider].isEditing ? 'password' : 'text'"
          :value="keys[provider].isEditing ? keys[provider].value : apiKeyHints[provider]"
          :label="providerLabels[provider]"
          :placeholder="keys[provider].isEditing ? $t('gmPanel.ai.settings.newKey') : $t('gmPanel.ai.settings.keyNotSet')"
          autocomplete="new-password"
          spellcheck="false"
          :readonly="!keys[provider].isEditing"
          @input="setKey(provider, $event)"
        )
          template(#right-icon)
            Icon(:name="keys[provider].isEditing ? 'cross' : 'edit'" @click="toggleEdit(provider)")

      span.gm-panel__itemsTitle {{ $t('gmPanel.ai.settings.features') }}
      CellGroup.gm-panel__group(inset)
        Cell(:label="$t('gmPanel.ai.settings.tagGenerationHint')" center :title="$t('gmPanel.ai.settings.tagGeneration')")
          template(#right-icon)
            VanSwitch(v-model="form.isTagGenerationEnabled" size="22px")
        Cell(:label="$t('gmPanel.ai.settings.roomModerationHint')" center :title="$t('gmPanel.ai.settings.roomModeration')")
          template(#right-icon)
            VanSwitch(v-model="form.isRoomModerationEnabled" size="22px")

      span.gm-panel__itemsTitle {{ $t('gmPanel.ai.settings.tagPrompt') }}
      CellGroup.gm-panel__group(inset)
        Field(v-model="form.tagSystemPrompt" type="textarea" rows="6" autosize)

      span.gm-panel__itemsTitle {{ $t('gmPanel.ai.settings.moderationPrompt') }}
      CellGroup.gm-panel__group(inset)
        Field(v-model="form.moderationSystemPrompt" type="textarea" rows="6" autosize)

      .gm-panel__actions
        Button(type="info" icon="success" round block :loading="isSaving" @click="save") {{ $t('general.save') }}
</template>

<script>
import { defineComponent, useContext, useStore, ref, onMounted } from '@nuxtjs/composition-api'
import { Loading, CellGroup, Cell, Field, RadioGroup, Radio, Switch, Button, Icon } from 'vant'
import { showToast } from '@/helpers/toast'

const PROVIDER_LABELS = { nvidia: 'NVIDIA NIM', openrouter: 'OpenRouter', vercel: 'Vercel AI Gateway' }

export default defineComponent({
  name: 'GmPanelAiPage',
  components: {
    Loading,
    CellGroup,
    Cell,
    Field,
    RadioGroup,
    Radio,
    VanSwitch: Switch,
    Button,
    Icon
  },
  layout: 'Default/Default.layout',
  middleware: ['gm-control'],
  setup() {
    const { i18n } = useContext()
    const store = useStore()

    const form = ref(null)
    const providers = ref([])
    const apiKeyHints = ref({})
    const isSaving = ref(false)

    // A new key typed by the GM lives only here (never in the persisted store) until saved.
    // Built whole and assigned: Vue 2 doesn't track keys added to an existing object.
    const keys = ref({})

    const applySettings = data => {
      const { providers: list, apiKeyHints: hints, ...settings } = data

      form.value = settings
      providers.value = list
      apiKeyHints.value = hints
      keys.value = Object.fromEntries(list.map(provider => [provider, { isEditing: false, isDirty: false, value: '' }]))
    }

    // Edit opens an empty field for a new key; cancel drops what was typed
    const toggleEdit = provider => {
      const key = keys.value[provider]

      key.isEditing = !key.isEditing
      key.isDirty = false
      key.value = ''
    }

    const setKey = (provider, value) => {
      keys.value[provider].value = value
      keys.value[provider].isDirty = true
    }

    const save = async () => {
      isSaving.value = true
      const apiKeys = Object.fromEntries(
        Object.entries(keys.value)
          .filter(([, key]) => key.isDirty)
          .map(([provider, key]) => [provider, key.value])
      )
      const { model, provider, isTagGenerationEnabled, isRoomModerationEnabled, tagSystemPrompt, moderationSystemPrompt } = form.value
      const { data, error } = await store.dispatch('gm/updateAiSettings', {
        model,
        provider,
        isTagGenerationEnabled,
        isRoomModerationEnabled,
        tagSystemPrompt,
        moderationSystemPrompt,
        apiKeys
      })

      isSaving.value = false

      if (error) {
        showToast.fail(error.message || i18n.t('error.anErrorOccurred'))

        return
      }

      applySettings(data.data)
      showToast.success(i18n.t('gmPanel.actionDone'))
    }

    onMounted(async () => {
      const { data, error } = await store.dispatch('gm/fetchAiSettings')

      if (error) {
        showToast.fail(error.message || i18n.t('error.anErrorOccurred'))

        return
      }

      applySettings(data.data)
    })

    return {
      form,
      providers,
      providerLabels: PROVIDER_LABELS,
      keys,
      isSaving,
      apiKeyHints,
      toggleEdit,
      setKey,
      save
    }
  },
  head() {
    return { title: this.$t('gmPanel.title') }
  }
})
</script>
