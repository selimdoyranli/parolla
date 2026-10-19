import { computed, useStore } from '@nuxtjs/composition-api'

// Catalog lookups for rendering equipped cosmetics. Unknown/removed keys resolve to null/falsy so callers render nothing.
export default () => {
  const store = useStore()
  const catalogMap = computed(() => store.getters['economy/catalogMap'])

  const item = key => (key && catalogMap.value[key]) || null
  const asset = key => (item(key) || {}).asset || null
  const isAnimated = key => Boolean((item(key) || {}).animated)

  // name_color value is {color} or {gradient}; returns an inline style object
  const nameStyle = key => {
    const value = (item(key) || {}).value

    if (!value) return {}

    if (value.gradient) {
      return { backgroundImage: value.gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }
    }

    return value.color ? { color: value.color } : {}
  }

  const titleText = key => ((item(key) || {}).value || {}).text || ''

  return { item, asset, nameStyle, titleText, isAnimated }
}
