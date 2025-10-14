<template lang="pug">
Dialog.dialog.avatar-editor-dialog(
  :value="isOpenAvatarEditorDialog"
  :title="$t('dialog.avatarEditor.title')"
  :cancel-button-text="$t('general.cancel')"
  :confirm-button-text="$t('general.apply')"
  :show-confirm-button="true"
  :show-cancel-button="true"
  :close-on-click-overlay="false"
  @input="handleDialogInput"
  @closed="onClosed"
  @opened="$emit('opened')"
  @confirm="handleConfirm"
)
  .avatar-editor-content
    template(v-if="player && Object.keys(player).length > 0")
      // Preview Section
      .preview-section
        .preview-avatar(v-html="previewSvg")
        .preview-label {{ $t('dialog.avatarEditor.livePreview') }}

      // Options Section
      .options-section
        // Ağız
        .option-group
          .group-title {{ $t('dialog.avatarEditor.mouth') }}
          .option-grid
            button.option-item(
              v-for="option in options.mouth"
              :key="option.id"
              :class="{ active: config.mouth === option.id }"
              @click="handleOptionChange('mouth', option.id)"
            )
              div(v-html="getThumbnailSvg('mouth', option.id)")

        // Eyes
        .option-group
          .group-title {{ $t('dialog.avatarEditor.eyes') }}
          .option-grid
            button.option-item(
              v-for="option in options.eyes"
              :key="option.id"
              :class="{ active: config.eyes === option.id }"
              @click="handleOptionChange('eyes', option.id)"
            )
              div(v-html="getThumbnailSvg('eyes', option.id)")

        // Eyebrows
        .option-group
          .group-title {{ $t('dialog.avatarEditor.eyebrows') }}
          .option-grid
            button.option-item(
              v-for="option in options.eyebrows"
              :key="option.id"
              :class="{ active: config.eyebrows === option.id }"
              @click="handleOptionChange('eyebrows', option.id)"
            )
              div(v-html="getThumbnailSvg('eyebrows', option.id)")

        // Hair
        .option-group
          .group-title {{ $t('dialog.avatarEditor.hair') }}
          .option-grid
            button.option-item(
              v-for="option in options.hair"
              :key="option.id"
              :class="{ active: config.hair === option.id }"
              @click="handleOptionChange('hair', option.id)"
            )
              div(v-html="getThumbnailSvg('hair', option.id)")

        // Hair Color
        .option-group
          .group-title {{ $t('dialog.avatarEditor.hairColor') }}
          .option-grid.color-grid
            button.option-item.color-item(
              v-for="option in options.hairColor"
              :key="option.id"
              :class="{ active: config.hairColor && config.hairColor[0] === option.id }"
              @click="handleOptionChange('hairColor', option.id)"
            )
              .color-swatch(:style="{ backgroundColor: `#${option.id}` }")

        // Earrings
        .option-group
          .group-title {{ $t('dialog.avatarEditor.earrings') }}
          .option-grid
            button.option-item(
              v-for="option in options.earrings"
              :key="option.id"
              :class="{ active: config.earrings === option.id }"
              @click="handleOptionChange('earrings', option.id)"
            )
              div(v-html="getThumbnailSvg('earrings', option.id)")

        // Features
        .option-group
          .group-title {{ $t('dialog.avatarEditor.features') }}
          .option-grid
            button.option-item(
              v-for="option in options.features"
              :key="option.id"
              :class="{ active: config.features === option.id }"
              @click="handleOptionChange('features', option.id)"
            )
              div(v-html="getThumbnailSvg('features', option.id)")

        // Glasses
        .option-group
          .group-title {{ $t('dialog.avatarEditor.glasses') }}
          .option-grid
            button.option-item(
              v-for="option in options.glasses"
              :key="option.id"
              :class="{ active: config.glasses === option.id }"
              @click="handleOptionChange('glasses', option.id)"
            )
              div(v-html="getThumbnailSvg('glasses', option.id)")

        // Skin Color
        .option-group
          .group-title {{ $t('dialog.avatarEditor.skinColor') }}
          .option-grid.color-grid-4
            button.option-item.color-item(
              v-for="option in options.skinColor"
              :key="option.id"
              :class="{ active: config.skinColor && config.skinColor[0] === option.id }"
              @click="handleOptionChange('skinColor', option.id)"
            )
              .color-swatch(:style="{ backgroundColor: `#${option.id}` }")

        // Background Color
        .option-group
          .group-title {{ $t('dialog.avatarEditor.backgroundColor') }}
          .option-grid.color-grid
            button.option-item.color-item(
              v-for="option in options.backgroundColor"
              :key="option.id"
              :class="{ active: config.backgroundColor && config.backgroundColor[0] === option.id }"
              @click="handleOptionChange('backgroundColor', option.id)"
            )
              .color-swatch(:style="{ backgroundColor: `#${option.id}` }")

    template(v-else)
      Loading(color="var(--color-brand-02)") {{ $t('dialog.player.loading') }}
</template>

<script>
import { defineComponent, useStore, computed, reactive, ref } from '@nuxtjs/composition-api'
import { Dialog, Loading, Toast } from 'vant'
import { createAvatar } from '@dicebear/core'
import * as adventurer from '@dicebear/adventurer'

export default defineComponent({
  components: {
    Dialog: Dialog.Component,
    Loading,
    Toast
  },
  props: {
    user: {
      type: Object,
      required: true
    },
    cancelButtonText: {
      type: String,
      required: false,
      default: null
    }
  },
  setup(props, { emit }) {
    const store = useStore()

    const player = computed(() => props.user)

    const isOpenAvatarEditorDialog = computed(() => store.getters['profile/isOpenAvatarEditorDialog'])

    // Default avatar configuration
    const defaultConfig = {
      seed: 'Mason',
      backgroundColor: ['ff7878']
    }

    // Avatar Configuration
    const config = reactive({
      ...defaultConfig,
      ...(player.value.diceBear?.config && {
        ...player.value.diceBear.config
      })
    })

    // Reactivity trigger
    const configVersion = ref(0)

    // Options definitions
    const options = {
      mouth: Array.from({ length: 30 }, (_, i) => ({
        id: `variant${String(i + 1).padStart(2, '0')}`,
        label: `Mouth ${i + 1}`
      })),
      eyes: Array.from({ length: 26 }, (_, i) => ({
        id: `variant${String(i + 1).padStart(2, '0')}`,
        label: `Eyes ${i + 1}`
      })),
      eyebrows: Array.from({ length: 15 }, (_, i) => ({
        id: `variant${String(i + 1).padStart(2, '0')}`,
        label: `Eyebrows ${i + 1}`
      })),
      hair: [
        ...Array.from({ length: 26 }, (_, i) => ({
          id: `long${String(i + 1).padStart(2, '0')}`,
          label: `Long Hair ${i + 1}`
        })),
        ...Array.from({ length: 19 }, (_, i) => ({
          id: `short${String(i + 1).padStart(2, '0')}`,
          label: `Short Hair ${i + 1}`
        }))
      ],
      hairColor: [
        { id: '0e0e0e', label: 'Black' },
        { id: '6a4e23', label: 'Kahverengi' },
        { id: 'c68642', label: 'Light Brown' },
        { id: 'e8c07e', label: 'Yellow' },
        { id: 'ff0000', label: 'Red' },
        { id: 'ffffff', label: 'White' }
      ],
      earrings: [
        { id: 'none', label: 'None' },
        ...Array.from({ length: 6 }, (_, i) => ({
          id: `variant${String(i + 1).padStart(2, '0')}`,
          label: `Earrings ${i + 1}`
        }))
      ],
      features: [
        { id: 'none', label: 'None' },
        { id: 'birthmark', label: 'Birthmark' },
        { id: 'blush', label: 'Blush' },
        { id: 'freckles', label: 'Freckles' },
        { id: 'mustache', label: 'Mustache' }
      ],
      glasses: [
        { id: 'none', label: 'None' },
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `variant${String(i + 1).padStart(2, '0')}`,
          label: `Glasses ${i + 1}`
        }))
      ],
      skinColor: [
        { id: 'f5d7b1', label: 'Light' },
        { id: 'd5a57d', label: 'Medium' },
        { id: 'ae8b67', label: 'Dark' },
        { id: '8d5524', label: 'Very Dark' }
      ],
      backgroundColor: [
        { id: '65c9ff', label: 'Blue' },
        { id: 'ff6b9d', label: 'Pink' },
        { id: 'ffd93d', label: 'Yellow' },
        { id: '6bcf7f', label: 'Green' },
        { id: 'a78bfa', label: 'Purple' },
        { id: 'f59e0b', label: 'Orange' }
      ]
    }

    // Generate avatar SVG
    const generateAvatarSvg = cfg => {
      const avatarOptions = {
        seed: cfg.seed || 'Mason'
      }

      if (cfg.mouth) avatarOptions.mouth = [cfg.mouth]

      if (cfg.eyes) avatarOptions.eyes = [cfg.eyes]

      if (cfg.eyebrows) avatarOptions.eyebrows = [cfg.eyebrows]

      if (cfg.hair) avatarOptions.hair = [cfg.hair]

      if (cfg.hairColor) avatarOptions.hairColor = cfg.hairColor

      if (cfg.earrings && cfg.earrings !== 'none') {
        avatarOptions.earrings = [cfg.earrings]
        avatarOptions.earringsProbability = 100
      }

      if (cfg.features && cfg.features !== 'none') {
        avatarOptions.features = [cfg.features]
        avatarOptions.featuresProbability = 100
      }

      if (cfg.glasses && cfg.glasses !== 'none') {
        avatarOptions.glasses = [cfg.glasses]
        avatarOptions.glassesProbability = 100
      }

      if (cfg.skinColor) avatarOptions.skinColor = cfg.skinColor

      if (cfg.backgroundColor) avatarOptions.backgroundColor = cfg.backgroundColor

      return createAvatar(adventurer, avatarOptions).toString()
    }

    const generateAvatarDataImage = cfg => {
      const avatarOptions = {
        seed: cfg.seed || 'Mason'
      }

      if (cfg.mouth) avatarOptions.mouth = [cfg.mouth]

      if (cfg.eyes) avatarOptions.eyes = [cfg.eyes]

      if (cfg.eyebrows) avatarOptions.eyebrows = [cfg.eyebrows]

      if (cfg.hair) avatarOptions.hair = [cfg.hair]

      if (cfg.hairColor) avatarOptions.hairColor = cfg.hairColor

      if (cfg.earrings && cfg.earrings !== 'none') {
        avatarOptions.earrings = [cfg.earrings]
        avatarOptions.earringsProbability = 100
      }

      if (cfg.features && cfg.features !== 'none') {
        avatarOptions.features = [cfg.features]
        avatarOptions.featuresProbability = 100
      }

      if (cfg.glasses && cfg.glasses !== 'none') {
        avatarOptions.glasses = [cfg.glasses]
        avatarOptions.glassesProbability = 100
      }

      if (cfg.skinColor) avatarOptions.skinColor = cfg.skinColor

      if (cfg.backgroundColor) avatarOptions.backgroundColor = cfg.backgroundColor

      return createAvatar(adventurer, avatarOptions).toDataUri()
    }

    // Preview SVG
    const previewSvg = computed(() => {
      if (isOpenAvatarEditorDialog.value) {
        // Force reactivity by accessing configVersion
        const version = configVersion.value

        // Force reactivity by accessing all config properties
        const currentConfig = {
          seed: config.seed,
          mouth: config.mouth,
          eyes: config.eyes,
          eyebrows: config.eyebrows,
          hair: config.hair,
          hairColor: config.hairColor,
          earrings: config.earrings,
          features: config.features,
          glasses: config.glasses,
          skinColor: config.skinColor,
          backgroundColor: config.backgroundColor
        }

        return generateAvatarSvg(currentConfig)
      }

      return ''
    })

    // Handle option change
    const handleOptionChange = (category, value) => {
      if (category === 'hairColor') {
        config.hairColor = [value]
      } else if (category === 'skinColor') {
        config.skinColor = [value]
      } else if (category === 'backgroundColor') {
        config.backgroundColor = [value]
      } else {
        config[category] = value
      }

      // Trigger reactivity
      configVersion.value++
    }

    // Generate thumbnail SVG
    const getThumbnailSvg = (category, value) => {
      const tempConfig = {
        seed: config.seed,
        mouth: config.mouth,
        eyes: config.eyes,
        eyebrows: config.eyebrows,
        hair: config.hair,
        hairColor: config.hairColor,
        earrings: config.earrings,
        features: config.features,
        glasses: config.glasses,
        skinColor: config.skinColor,
        backgroundColor: config.backgroundColor
      }

      if (category === 'hairColor') {
        tempConfig.hairColor = [value]
      } else if (category === 'skinColor') {
        tempConfig.skinColor = [value]
      } else if (category === 'backgroundColor') {
        tempConfig.backgroundColor = [value]
      } else {
        tempConfig[category] = value
      }

      return generateAvatarSvg(tempConfig)
    }

    const handleConfirm = async () => {
      store.commit('profile/SET_AVATAR_EDITOR_DIALOG_IS_OPEN', false)
    }

    const handleDialogInput = value => {
      if (!value) {
        store.commit('profile/SET_AVATAR_EDITOR_DIALOG_IS_OPEN', false)

        emit('on-confirm', {
          dataImage: generateAvatarDataImage(config),
          config: config
        })
      }
    }

    const onClosed = () => {
      emit('on-closed')
    }

    return {
      isOpenAvatarEditorDialog,
      player,
      handleDialogInput,
      onClosed,
      config,
      options,
      previewSvg,
      handleOptionChange,
      getThumbnailSvg,
      handleConfirm
    }
  }
})
</script>

<style lang="scss" src="./AvatarEditorDialog.component.scss"></style>
