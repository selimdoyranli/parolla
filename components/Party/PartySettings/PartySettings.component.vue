<template lang="pug">
section.party-card.party-settings
  header.party-card__head
    .party-card__head-icon
      AppIcon(name="tabler:settings" :width="18" :height="18")
    .party-card__head-text
      span.party-card__eyebrow {{ $t('party.lobby.settings.eyebrow') }}
      h3.party-card__title {{ $t('party.lobby.settings.title') }}

  p.party-settings__locked(v-if="inGame") {{ $t('party.lobby.settings.inGame') }}

  .party-settings__group
    //- public room list (/parti → "Parti odalarını gör")
    .party-settings__row
      AppIcon.party-settings__icon(name="tabler:world" :width="18" :height="18")
      .party-settings__text
        strong {{ $t('party.lobby.settings.listed') }}
        small {{ $t('party.lobby.settings.listedSub') }}
      VanSwitch(
        :value="settings.listed"
        size="20px"
        active-color="var(--color-brand-02)"
        :disabled="inGame"
        @input="patch({ listed: $event })"
      )
    .party-settings__row
      AppIcon.party-settings__icon(name="tabler:lock" :width="18" :height="18")
      .party-settings__text
        strong {{ $t('party.lobby.settings.lock') }}
        small {{ $t('party.lobby.settings.lockSub') }}
      VanSwitch(
        :value="settings.locked"
        size="20px"
        active-color="var(--color-brand-02)"
        :disabled="inGame"
        @input="patch({ locked: $event })"
      )
    .party-settings__row
      AppIcon.party-settings__icon(name="tabler:presentation" :width="18" :height="18")
      .party-settings__text
        strong {{ $t('party.lobby.settings.presentation') }}
        small {{ $t('party.lobby.settings.presentationSub') }}
        //- listed rooms are for strangers; the server keeps presentation off for them too
        small.party-settings__note(v-if="settings.listed")
          AppIcon(name="tabler:info-circle" :width="12" :height="12")
          | {{ $t('party.lobby.settings.presentationListed') }}
      VanSwitch(
        :value="settings.presentation && !settings.listed"
        size="20px"
        active-color="var(--color-brand-02)"
        :disabled="inGame || settings.listed"
        @input="patch({ presentation: $event })"
      )
    .party-settings__row.party-settings__row--stack
      AppIcon.party-settings__icon(name="tabler:clock" :width="18" :height="18")
      .party-settings__text
        strong {{ $t('party.lobby.settings.duration') }}
        small {{ $t('party.lobby.settings.durationSub') }}
        .party-chips
          button.party-chip(
            v-for="sec in durations"
            :key="sec"
            type="button"
            :class="{ 'party-chip--active': settings.roundDurationSec === sec }"
            :disabled="inGame"
            @click="patch({ roundDurationSec: sec })"
          ) {{ $t('party.lobby.settings.seconds', { n: sec }) }}
    .party-settings__row.party-settings__row--stack
      AppIcon.party-settings__icon(name="tabler:key" :width="18" :height="18")
      .party-settings__text
        strong {{ $t('party.gate.password') }}
        small {{ $t('party.lobby.settings.passwordSub') }}
        form.party-settings__password(v-if="isPasswordFormOpen" @submit.prevent="savePassword")
          input.party-settings__password-input(
            v-model="password"
            type="text"
            :placeholder="$t('party.lobby.settings.passwordPlaceholder')"
            maxlength="32"
            autocomplete="off"
          )
          Button(color="var(--color-brand-02)" size="small" round native-type="submit" :disabled="!password.trim()")
            | {{ $t('party.lobby.settings.save') }}
      VanSwitch(:value="passwordOn" size="20px" active-color="var(--color-brand-02)" :disabled="inGame" @input="togglePassword")

  Collapse.party-settings__advanced(v-model="openPanels" :border="false")
    CollapseItem(name="advanced" icon="setting-o" :title="$t('party.lobby.settings.advanced')")
      .party-settings__row
        AppIcon.party-settings__icon(name="tabler:bolt" :width="18" :height="18")
        .party-settings__text
          strong {{ $t('party.lobby.settings.auto') }}
          small {{ $t('party.lobby.settings.autoSub') }}
        //- the only setting the server still takes during a game
        VanSwitch(:value="settings.autoAdvance" size="20px" active-color="var(--color-brand-02)" @input="patch({ autoAdvance: $event })")
      .party-settings__row
        AppIcon.party-settings__icon(name="tabler:message-circle" :width="18" :height="18")
        .party-settings__text
          strong {{ $t('party.lobby.settings.chat') }}
          small {{ $t('party.lobby.settings.chatSub') }}
        VanSwitch(
          :value="settings.chat"
          size="20px"
          active-color="var(--color-brand-02)"
          :disabled="inGame"
          @input="patch({ chat: $event })"
        )
      .party-settings__row.party-settings__row--stack
        AppIcon.party-settings__icon(name="tabler:trophy" :width="18" :height="18")
        .party-settings__text
          strong {{ $t('party.lobby.settings.leaderboard') }}
          small {{ $t('party.lobby.settings.leaderboardSub') }}
          .party-chips
            button.party-chip(
              v-for="mode in boardModes"
              :key="mode"
              type="button"
              :class="{ 'party-chip--active': settings.leaderboard === mode }"
              :disabled="inGame"
              @click="patch({ leaderboard: mode })"
            ) {{ $t(`party.lobby.settings.board.${mode}`) }}

  .party-settings__pills
    span.party-pill
      AppIcon(name="tabler:users" :width="12" :height="12")
      | {{ $t('party.lobby.settings.capacity', { n: capacity }) }}
    span.party-pill(v-if="settings.hasPassword")
      AppIcon(name="tabler:key" :width="12" :height="12")
      | {{ $t('party.lobby.settings.protected') }}
</template>

<script>
import { defineComponent, ref, computed, inject, useStore } from '@nuxtjs/composition-api'
import { Switch, Button, Collapse, CollapseItem } from 'vant'
import { wsTypeEnum } from '@/enums/wsType.enum'

const DURATIONS = [30, 45, 60, 90, 120] // same list as parolla-ws roomManager (30 s minimum)
const BOARD_MODES = ['always', 'end', 'never']

export default defineComponent({
  components: { VanSwitch: Switch, Button, Collapse, CollapseItem },
  setup() {
    const store = useStore()
    const send = inject('partySend')
    const settings = computed(() => store.getters['party/settings'])
    const capacity = computed(() => store.state.party.room.capacity || 10)
    const inGame = computed(() => store.state.party.room.state !== 'lobby')
    const openPanels = ref([])
    const password = ref('')
    const isPasswordFormOpen = ref(false)
    // the form counts as "on" while typing, so the switch doesn't snap back
    const passwordOn = computed(() => settings.value.hasPassword || isPasswordFormOpen.value)

    const patch = p => send(wsTypeEnum.PARTY_SETTINGS, { patch: p })

    const togglePassword = on => {
      if (on) {
        isPasswordFormOpen.value = true

        return
      }

      isPasswordFormOpen.value = false
      password.value = ''

      if (settings.value.hasPassword) patch({ password: null })
    }

    const savePassword = () => {
      const value = password.value.trim()

      if (!value) return

      patch({ password: value })
      isPasswordFormOpen.value = false
      password.value = ''
    }

    return {
      durations: DURATIONS,
      boardModes: BOARD_MODES,
      settings,
      capacity,
      inGame,
      openPanels,
      password,
      isPasswordFormOpen,
      passwordOn,
      patch,
      togglePassword,
      savePassword
    }
  }
})
</script>

<style lang="scss" src="./PartySettings.component.scss" scoped></style>
