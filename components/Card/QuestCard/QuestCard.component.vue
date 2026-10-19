<template lang="pug">
.quest-card(:class="{ 'quest-card--claimed': quest.claimed }")
  .quest-card__body
    .quest-card__title {{ title }}
    .quest-card__bar
      .quest-card__fill(:style="{ width: percent + '%' }")
    .quest-card__meta
      | {{ quest.progress }}/{{ quest.goal }} ·
      GoldAmount(size="sm" :amount="quest.reward")
  .quest-card__actions
    Button(v-if="isClaimable" type="primary" size="small" :disabled="busy" @click="$emit('claim', quest)") {{ $t('economy.quests.claim') }}
    AppIcon.quest-card__done(v-else-if="quest.claimed" name="tabler:check" :width="22" :height="22")
    Button(v-else-if="canReroll" size="small" plain :disabled="busy" @click="$emit('reroll', quest)")
      | {{ $t('economy.quests.reroll') }}
      GoldAmount.ms-1(size="sm" :amount="REROLL_COST")
</template>

<script>
import { defineComponent, computed, useContext } from '@nuxtjs/composition-api'
import { Button } from 'vant'
import { REROLL_COST } from '@/store/economy/constants'

export default defineComponent({
  components: { Button },
  props: {
    quest: { type: Object, required: true },
    canReroll: { type: Boolean, default: false },
    busy: { type: Boolean, default: false }
  },
  setup(props) {
    const { i18n } = useContext()

    const title = computed(() => props.quest.title[i18n.locale] || props.quest.title.tr)
    const percent = computed(() => Math.min(100, Math.round((props.quest.progress / props.quest.goal) * 100)) || 0)

    const isClaimable = computed(() => props.quest.completed && !props.quest.claimed)

    return { title, percent, isClaimable, REROLL_COST }
  }
})
</script>

<style lang="scss" src="./QuestCard.component.scss"></style>
