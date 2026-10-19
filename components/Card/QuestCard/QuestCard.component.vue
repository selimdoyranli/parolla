<template lang="pug">
.quest-card(:class="{ 'quest-card--claimed': quest.claimed }")
  .quest-card__body
    .quest-card__head
      .quest-card__title {{ title }}
      .quest-card__count {{ quest.progress }} / {{ quest.goal }}
    .quest-card__bar
      .quest-card__fill(:class="{ 'quest-card__fill--done': quest.completed }" :style="{ width: percent + '%' }")
  .quest-card__side
    Button.quest-card__claim(v-if="isClaimable" type="primary" size="small" :disabled="busy" @click="$emit('claim', quest)")
      | {{ $t('economy.quests.claim') }}
      GoldAmount.ms-1(size="sm" :amount="quest.reward")
    template(v-else)
      AppIcon.quest-card__done(v-if="quest.claimed" name="tabler:check" :width="20" :height="20")
      GoldAmount(v-else size="sm" :amount="quest.reward")
      Button.quest-card__reroll(v-if="canReroll" size="mini" plain :disabled="busy" @click="$emit('reroll', quest)")
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
    const percent = computed(() => Math.max(0, Math.min(100, Math.round((props.quest.progress / props.quest.goal) * 100))) || 0)

    const isClaimable = computed(() => props.quest.completed && !props.quest.claimed)

    return { title, percent, isClaimable, REROLL_COST }
  }
})
</script>

<style lang="scss" src="./QuestCard.component.scss"></style>
