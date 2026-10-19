<template lang="pug">
.achievement-list
  section.achievement-list__family(v-for="family in families" :key="family.key")
    h5.achievement-list__family-name {{ family.name }}
    .achievement-list__tier(v-for="t in family.tiers" :key="t.key" :class="{ 'achievement-list__tier--locked': !t.unlocked }")
      AppIcon.achievement-list__icon(:name="t.unlocked ? 'tabler:trophy' : 'tabler:lock'" :width="18" :height="18")
      .achievement-list__body
        .achievement-list__title
          span {{ baseName(t) }}
          span.achievement-list__chip {{ roman(t.tier) }}
        .achievement-list__hint(v-if="titleName(t)") {{ $t('economy.achievements.titleReward', { name: titleName(t) }) }}
      .achievement-list__side
        span.achievement-list__progress(v-if="!t.unlocked") {{ t.current }} / {{ t.goal }}
        GoldAmount(size="sm" :amount="t.reward")
</template>

<script>
import { defineComponent, computed, onMounted, useContext, useStore } from '@nuxtjs/composition-api'

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']

export default defineComponent({
  props: {
    items: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const { i18n } = useContext()
    const store = useStore()
    const lang = computed(() => (i18n.locale === 'en' ? 'en' : 'tr'))
    const catalogMap = computed(() => store.getters['economy/catalogMap'])

    // One section per family, tiers in order
    const families = computed(() => {
      const map = {}

      props.items.forEach(a => {
        map[a.family] = map[a.family] || []
        map[a.family].push(a)
      })

      return Object.keys(map).map(key => {
        const tiers = map[key].slice().sort((a, b) => a.tier - b.tier)

        return { key, tiers, name: baseName(tiers[0]) }
      })
    })

    // Names carry a trailing roman numeral ("Alfabe Ustası II"); the tier chip shows it instead
    const baseName = t => t.name[lang.value].replace(/\s+[IVX]+$/, '')

    const titleName = t => {
      const item = t.titleItem && catalogMap.value[t.titleItem]

      return item ? item.name : ''
    }

    onMounted(() => store.dispatch('economy/fetchCatalog'))

    return { families, titleName, baseName, roman: n => ROMAN[n] || String(n) }
  }
})
</script>

<style lang="scss" src="./AchievementList.component.scss"></style>
