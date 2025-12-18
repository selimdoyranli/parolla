<template lang="pug">
.filter-dropdown.dropdown
  DropdownMenu(
    v-bind="$attrs"
    withDropdownCloser
    :direction="$attrs.direction || 'right'"
    :overlay="false"
    :is-open="isOpen"
    @closed="onClose"
  )
    template(#trigger)
      Button.filter-dropdown-trigger-button(size="small" round)
        template(v-if="selectedOption && Object.keys(selectedOption).length > 0")
          AppIcon.filter-dropdown-trigger-button__icon(:name="selectedOption.icon")
          span.filter-dropdown-trigger-button__title {{ selectedOption.label }}
        template(v-else)
          AppIcon.filter-dropdown-trigger-button__icon(name="tabler:list-details")
          span.filter-dropdown-trigger-button__title {{ triggerButtonTitle }}

        AppIcon.filter-dropdown-trigger-button__icon.caret-down(name="tabler:caret-down-filled")
    template(v-if="headerTitle" #header)
      span.filter-dropdown-header-title {{ headerTitle }}
    template(#body)
      nav.filter-dropdown-nav(v-if="options?.length > 0")
        template(v-for="(item, index) in options")
          .filter-dropdown-nav-item(:key="index" dropdown-closer @click="handleOptionSelect(item)")
            AppIcon.filter-dropdown-nav-item__icon(v-if="item.icon" :name="item.icon" :width="20" :height="20")
            span.filter-dropdown-nav-item__title {{ item.label }}
</template>

<script>
import { defineComponent, ref, useContext, computed } from '@nuxtjs/composition-api'
import DropdownMenu from 'v-dropdown-menu'
import 'v-dropdown-menu/dist/v-dropdown-menu.css'
import { Button } from 'vant'

export default defineComponent({
  components: {
    DropdownMenu,
    Button
  },
  props: {
    triggerTitle: {
      type: String,
      required: false,
      default: null
    },
    headerTitle: {
      type: String,
      required: false,
      default: null
    },
    selected: {
      type: Object,
      required: false,
      default: null
    },
    options: {
      type: Array,
      required: true,
      default: () => []
    }
  },
  setup(props, { emit }) {
    const context = useContext()

    const isOpen = ref(false)

    const onClose = () => {
      isOpen.value = false
    }

    const triggerButtonTitle = computed(() => props.triggerTitle || context.i18n.t('general.filter'))

    const selectedOption = ref(props.selected || {})

    const handleOptionSelect = option => {
      selectedOption.value = option

      emit('on-select-option', option)
    }

    return {
      isOpen,
      onClose,
      triggerButtonTitle,
      selectedOption,
      handleOptionSelect
    }
  }
})
</script>

<style lang="scss" src="./FilterDropdown.component.scss"></style>
