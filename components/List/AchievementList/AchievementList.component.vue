<template lang="pug">
.achievement-list
  .achievement-list__family(v-for="family in families" :key="family.key" :class="{ 'achievement-list__family--done': family.done }")
    .achievement-list__head
      strong.achievement-list__name {{ family.current.name[lang] }}
      span.achievement-list__reward(v-if="!family.done") {{ $t('economy.achievements.reward', { amount: family.current.reward }) }}
      span.achievement-list__reward(v-else) {{ $t('economy.achievements.completed') }}
    .achievement-list__bar
      .achievement-list__bar-fill(:style="{ width: family.percent + '%' }")
    .achievement-list__foot
      span.achievement-list__progress {{ family.current.current }} / {{ family.current.goal }}
      span.achievement-list__tiers
        i.achievement-list__tier(v-for="t in family.tiers" :key="t.key" :class="{ 'achievement-list__tier--on': t.unlocked }")
</template>

<script>
import { defineComponent, computed, useContext } from '@nuxtjs/composition-api'

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

    // One card per family showing its first locked tier (or the last tier once all are unlocked)
    const families = computed(() => {
      const map = {}

      props.items.forEach(a => {
        map[a.family] = map[a.family] || []
        map[a.family].push(a)
      })

      return Object.keys(map).map(key => {
        const tiers = map[key].slice().sort((a, b) => a.tier - b.tier)
        const next = tiers.find(t => !t.unlocked)
        const current = next || tiers[tiers.length - 1]

        return { key, tiers, current, done: !next, percent: Math.min(100, Math.round((current.current / current.goal) * 100)) }
      })
    })

    return { families, lang }
  }
})
</script>

<style lang="scss" src="./AchievementList.component.scss"></style>
