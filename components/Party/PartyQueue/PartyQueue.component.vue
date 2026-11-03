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
      :class="{ 'party-queue__item--next': index === 0 && !item.request, 'party-queue__item--request': item.request }"
    )
      span.party-queue__index {{ index + 1 }}
      QuizCover.party-queue__cover(:room="item")
        span.party-queue__initials(v-if="!hasPhoto(item)")
          AppIcon(v-if="modeIcon(item)" :name="modeIcon(item)" :width="22" :height="22")
          template(v-else) {{ initialsOf(item) }}
      .party-queue__info
        strong.party-queue__title {{ item.title }}
        .party-queue__pills
          span.party-pill {{ $t(`party.lobby.types.${typeOf(item)}`) }}
          span.party-pill.party-pill--brand(v-if="index === 0 && !item.request") {{ $t('party.lobby.nextBadge') }}
          span.party-pill.party-queue__requestPill(v-if="item.request")
            AppIcon(name="tabler:hand-stop" :width="12" :height="12")
            | {{ $t('party.lobby.request.badge') }}
        //- who asked (the live-room "more" menu on click) and everyone's like / dislike, one vote each, changeable
        .party-queue__request(v-if="item.request")
          PlayerAvatar(with-username player-actions-context="party" :user="toUser(item.request.by)" :size="20")
          .party-queue__votes
            ActionButton(
              :label="$t('party.lobby.request.like')"
              icon="tabler:thumb-up"
              active-icon="tabler:thumb-up-filled"
              tone="success"
              :active="myVote(item) === 1"
              :count="item.request.likes.length"
              @click="vote(item, 1)"
            )
            ActionButton(
              :label="$t('party.lobby.request.dislike')"
              icon="tabler:thumb-down"
              active-icon="tabler:thumb-down-filled"
              tone="danger"
              :active="myVote(item) === -1"
              :count="item.request.dislikes.length"
              @click="vote(item, -1)"
            )
      .party-queue__controls(v-if="isHost")
        ActionButton(
          v-if="item.request"
          :label="$t('party.lobby.request.approve')"
          icon="tabler:circle-check"
          tone="success"
          :disabled="locked"
          @click="approve(item)"
        )
        button.party-queue__icon(
          v-if="!item.request"
          type="button"
          :aria-label="$t('party.lobby.moveUp')"
          :disabled="locked || index === 0"
          @click="move(index, -1)"
        )
          AppIcon(name="tabler:arrow-up" :width="16" :height="16")
        button.party-queue__icon(
          v-if="!item.request"
          type="button"
          :aria-label="$t('party.lobby.moveDown')"
          :disabled="locked || index === lastApproved"
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
        Button.party-queue__play(
          v-if="!item.request"
          color="var(--color-brand-02)"
          icon="play"
          size="mini"
          round
          :disabled="locked"
          @click="play(index)"
        )
          | {{ $t('party.lobby.play') }}

  //- players request games; the host adds them straight away
  button.party-queue__add(type="button" :disabled="locked" @click="openAdd")
    span.party-queue__add-icon
      AppIcon(name="tabler:plus" :width="20" :height="20")
    span.party-queue__add-text
      strong {{ isHost ? $t('party.lobby.addGame') : $t('party.lobby.request.add') }}
      small {{ isHost ? $t('party.lobby.addGameSub') : $t('party.lobby.request.addSub') }}
</template>

<script>
import { defineComponent, computed, inject, useContext, useStore } from '@nuxtjs/composition-api'
import { Button, Notify } from 'vant'
import { wsTypeEnum } from '@/enums/wsType.enum'
import { getInitials } from '@/transformers/community.transformer'
import { usePartyUser } from '@/composables/usePartyUser'

export default defineComponent({
  components: { Button },
  emits: ['add-game'],
  setup(props, { emit }) {
    const { i18n } = useContext()
    const store = useStore()
    const send = inject('partySend')
    const queue = computed(() => store.getters['party/queue'])
    const isHost = computed(() => store.getters['party/isHost'])
    // the server ignores queue edits outside the lobby
    const locked = computed(() => store.state.party.room.state !== 'lobby')

    const move = (index, dir) => send(wsTypeEnum.PARTY_QUEUE_MOVE, { index, dir })
    const remove = index => send(wsTypeEnum.PARTY_QUEUE_REMOVE, { index })
    const play = index => send(wsTypeEnum.PARTY_QUEUE_PLAY, { index })
    // move down stops at the last approved game: requests stay below
    const lastApproved = computed(() => store.getters['party/approvedQueue'].length - 1)

    const { toUser } = usePartyUser()
    const myId = computed(() => String(store.state.party.myId))
    const myVote = item => (item.request.likes.includes(myId.value) ? 1 : item.request.dislikes.includes(myId.value) ? -1 : 0)
    // same button again takes the vote back
    const vote = (item, value) =>
      send(wsTypeEnum.PARTY_QUEUE_REQUEST_VOTE, { id: item.request.id, value: myVote(item) === value ? 0 : value })
    const approve = item => send(wsTypeEnum.PARTY_QUEUE_APPROVE, { id: item.request.id })

    // same limits as the server (20 games, 3 pending requests a player): warn before the picker opens
    const openAdd = () => {
      const warn = key => Notify({ message: i18n.t(key), type: 'warning', duration: 2000 })

      if (queue.value.length >= 20) return warn('party.add.full')

      if (!isHost.value && store.getters['party/myRequestCount'] >= 3) return warn('party.errors.request_limit')

      emit('add-game')
    }

    const hasPhoto = room => Boolean(room.coverPhoto && room.coverPhoto.url)
    const initialsOf = room => getInitials(room.title)
    // daily / unlimited sets have no cover: show their mode icon instead of initials
    const modeIcon = room => ({ daily: 'tabler:calendar-event', unlimited: 'tabler:infinity' }[room.roomId])
    // daily / unlimited sets travel as qa quizzes; label them by their mode id
    const typeOf = room => (['daily', 'unlimited'].includes(room.roomId) ? room.roomId : room.quizType)

    return {
      queue,
      isHost,
      locked,
      lastApproved,
      move,
      remove,
      play,
      toUser,
      myVote,
      vote,
      approve,
      openAdd,
      hasPhoto,
      initialsOf,
      typeOf,
      modeIcon
    }
  }
})
</script>

<style lang="scss" src="./PartyQueue.component.scss" scoped></style>
