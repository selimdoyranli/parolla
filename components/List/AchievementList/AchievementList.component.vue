<template lang="pug">
.achievement-list
  section.achievement-list__family(v-for="family in families" :key="family.key")
    h5.achievement-list__family-name {{ family.name }}
    p.achievement-list__family-note(v-if="family.note") {{ family.note }}
    .achievement-list__tier(v-for="t in family.tiers" :key="t.key" :class="{ 'achievement-list__tier--locked': !t.unlocked }")
      AppIcon.achievement-list__icon(:name="t.unlocked ? 'tabler:trophy' : 'tabler:lock'" :width="18" :height="18")
      .achievement-list__body
        .achievement-list__title
          span {{ goalText(t) }}
          span.achievement-list__chip(v-if="family.tiers.length > 1") {{ roman(t.tier) }}
      .achievement-list__side
        span.achievement-list__progress {{ t.current.toLocaleString(lang) }} / {{ t.goal.toLocaleString(lang) }}
        GoldAmount(size="sm" :amount="t.reward")
</template>

<script>
import { defineComponent, computed, useContext } from '@nuxtjs/composition-api'

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
    const lang = computed(() => (i18n.locale === 'en' ? 'en' : 'tr'))

    // One section per family, tiers in order
    const families = computed(() => {
      const map = {}

      props.items.forEach(a => {
        map[a.family] = map[a.family] || []
        map[a.family].push(a)
      })

      return Object.keys(map).map(key => {
        const tiers = map[key].slice().sort((a, b) => a.tier - b.tier)

        const noteKey = `economy.achievements.note.${key}`

        return { key, tiers, name: baseName(tiers[0]), note: i18n.te(noteKey) ? i18n.t(noteKey) : null }
      })
    })

    // Names carry a trailing roman numeral ("Alfabe Ustası II"); the tier chip shows it instead
    const baseName = t => t.name[lang.value].replace(/\s+[IVX]+$/, '')

    // Falls back to the tier name for families without a goal template
    const goalText = t => {
      const key = `economy.achievements.goal.${t.stat === 'firstLegendary' ? 'firstLegendary' : t.family}`

      return i18n.te(key) ? i18n.t(key, { n: t.goal.toLocaleString(lang.value) }) : baseName(t)
    }

    return { families, baseName, goalText, lang, roman: n => ROMAN[n] || String(n) }
  }
})
</script>

<style lang="scss" src="./AchievementList.component.scss"></style>
