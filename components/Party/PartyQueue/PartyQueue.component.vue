<template lang="pug">
section.party-card.party-queue
  header.party-card__head
    .party-card__head-icon
      AppIcon(name="tabler:list-numbers" :width="18" :height="18")
    .party-card__head-text
      span.party-card__eyebrow {{ $t('party.lobby.queueEyebrow') }}
      h3.party-card__title {{ $t('party.lobby.queue') }}
    span.party-pill {{ queue.length }}

  ol.party-queue__list(v-if="queue.length")
    li.party-queue__item(
      v-for="(item, index) in queue"
      :key="`${item.roomId}-${index}`"
      :class="{ 'party-queue__item--next': index === 0 }"
    )
      span.party-queue__index {{ index + 1 }}
      QuizCover.party-queue__cover(:room="item")
        span.party-queue__initials(v-if="!hasPhoto(item)") {{ initialsOf(item) }}
      .party-queue__info
        strong.party-queue__title {{ item.title }}
        .party-queue__pills
          span.party-pill {{ $t(`party.lobby.types.${typeOf(item)}`) }}
          span.party-pill.party-pill--brand(v-if="index === 0") {{ $t('party.lobby.nextBadge') }}
      .party-queue__controls(v-if="isHost")
        button.party-queue__icon(
          type="button"
          :aria-label="$t('party.lobby.moveUp')"
          :disabled="locked || index === 0"
          @click="move(index, -1)"
        )
          AppIcon(name="tabler:arrow-up" :width="16" :height="16")
        button.party-queue__icon(
          type="button"
          :aria-label="$t('party.lobby.moveDown')"
          :disabled="locked || index === queue.length - 1"
          @click="move(index, 1)"
        )
          AppIcon(name="tabler:arrow-down" :width="16" :height="16")
        button.party-queue__icon.party-queue__icon--danger(
          type="button"
          :aria-label="$t('party.lobby.remove')"
          :disabled="locked"
          @click="remove(index)"
        )
          AppIcon(name="tabler:trash" :width="16" :height="16")
        Button.party-queue__play(color="var(--color-brand-02)" icon="play" size="mini" round :disabled="locked" @click="play(index)")
          | {{ $t('party.lobby.play') }}

  button.party-queue__add(v-if="isHost" type="button" :disabled="locked" @click="$emit('add-game')")
    span.party-queue__add-icon
      AppIcon(name="tabler:plus" :width="20" :height="20")
    span.party-queue__add-text
      strong {{ $t('party.lobby.addGame') }}
      small {{ $t('party.lobby.addGameSub') }}
</template>

<script>
import { defineComponent, computed, inject, useStore } from '@nuxtjs/composition-api'
import { Button } from 'vant'
import { wsTypeEnum } from '@/enums/wsType.enum'
import { getInitials } from '@/transformers/community.transformer'

export default defineComponent({
  components: { Button },
  emits: ['add-game'],
  setup() {
    const store = useStore()
    const send = inject('partySend')
    const queue = computed(() => store.getters['party/queue'])
    const isHost = computed(() => store.getters['party/isHost'])
    // the server ignores queue edits outside the lobby
    const locked = computed(() => store.state.party.room.state !== 'lobby')

    const move = (index, dir) => send(wsTypeEnum.PARTY_QUEUE_MOVE, { index, dir })
    const remove = index => send(wsTypeEnum.PARTY_QUEUE_REMOVE, { index })
    const play = index => send(wsTypeEnum.PARTY_QUEUE_PLAY, { index })

    const hasPhoto = room => Boolean(room.coverPhoto && room.coverPhoto.url)
    const initialsOf = room => getInitials(room.title)
    // daily / unlimited sets travel as qa quizzes; label them by their mode id
    const typeOf = room => (['daily', 'unlimited'].includes(room.roomId) ? room.roomId : room.quizType)

    return { queue, isHost, locked, move, remove, play, hasPhoto, initialsOf, typeOf }
  }
})
</script>

<style lang="scss" src="./PartyQueue.component.scss" scoped></style>
