<template lang="pug">
.gm-panel
  // Active tab from the route name: vant's route mode didn't match localized paths
  // Brand-coloured line tabs, same as the profile score tabs (vant's default is red)
  Tabs.gm-panel__tabs(
    color="var(--color-brand-02)"
    line-width="32px"
    line-height="3px"
    title-active-color="var(--color-text-01)"
    title-inactive-color="var(--color-text-03)"
    :active="activeTab"
  )
    Tab(name="GmPanel-Wordblock" replace :to="localePath({ name: 'GmPanel-Wordblock' })" :title="$t('gmPanel.wordblock.title')")
    Tab(name="GmPanel-Daily" replace :to="localePath({ name: 'GmPanel-Daily' })" :title="$t('gmPanel.daily.title')")
    Tab(name="GmPanel-Ai" replace :to="localePath({ name: 'GmPanel-Ai' })" :title="$t('gmPanel.ai.title')")
    Tab(name="GmPanel-Commands" replace :to="localePath({ name: 'GmPanel-Commands' })" :title="$t('gmPanel.commands.title')")

  Tabs.gm-panel__tabs(
    v-if="activeTab === 'GmPanel-Ai'"
    color="var(--color-brand-02)"
    line-width="32px"
    line-height="3px"
    background="transparent"
    title-active-color="var(--color-text-01)"
    title-inactive-color="var(--color-text-03)"
    :active="getRouteBaseName()"
  )
    Tab(name="GmPanel-Ai" replace :to="localePath({ name: 'GmPanel-Ai' })" :title="$t('gmPanel.ai.settings.title')")
    Tab(
      name="GmPanel-Ai-TaggedRooms"
      replace
      :to="localePath({ name: 'GmPanel-Ai-TaggedRooms' })"
      :title="$t('gmPanel.ai.taggedRooms.title')"
    )
    Tab(
      name="GmPanel-Ai-ModeratedRooms"
      replace
      :to="localePath({ name: 'GmPanel-Ai-ModeratedRooms' })"
      :title="$t('gmPanel.ai.moderatedRooms.title')"
    )

  NoticeBar.gm-panel__description(
    color="var(--color-info-01)"
    left-icon="info-o"
    wrapable
    background="var(--color-ui-02)"
    :scrollable="false"
  ) {{ description }}

  GmAiQueue(v-if="activeTab === 'GmPanel-Ai'")

  // Date filter + notice text belong to the anomaly pages only
  CellGroup.gm-panel__group(v-if="date" inset)
    Field(
      type="date"
      :value="date"
      :label="$t('gmPanel.date')"
      input-align="right"
      left-icon="calendar-o"
      @input="$emit('update:date', $event)"
    )

  CellGroup.gm-panel__group(v-if="date" inset)
    Cell(:label="notifyText" icon="envelop-o" label-class="gm-panel__notifyText" :title="$t('gmPanel.notifyTitle')")
      template(#right-icon)
        Button(icon="description" plain round size="small" native-type="button" @click="copyNotifyText") {{ $t('gmPanel.copy') }}

  slot
</template>

<script>
import { defineComponent, useContext, computed } from '@nuxtjs/composition-api'
import { Tabs, Tab, NoticeBar, CellGroup, Cell, Field, Button } from 'vant'
import { showToast } from '@/helpers/toast'

// Sent by hand to the player for now; can move to an automated mail later
const NOTIFY_TEXT = `Sayın oyuncu,

Anomali ve hile tespit edildi, skorların silinerek hesabın kapatıldı.

parolla`

export default defineComponent({
  components: {
    Tabs,
    Tab,
    NoticeBar,
    CellGroup,
    Cell,
    Field,
    Button
  },
  props: {
    date: {
      type: String,
      required: false,
      default: null
    },
    description: {
      type: String,
      required: true
    }
  },
  setup() {
    const { i18n, getRouteBaseName } = useContext()

    const activeTab = computed(() => {
      const name = getRouteBaseName()

      return name?.startsWith('GmPanel-Ai') ? 'GmPanel-Ai' : name
    })

    const copyNotifyText = async () => {
      await navigator.clipboard.writeText(NOTIFY_TEXT)
      showToast.default(i18n.t('clipboard.callback.success'))
    }

    return {
      activeTab,
      notifyText: NOTIFY_TEXT,
      copyNotifyText
    }
  },
  // GM pages must never be indexed
  head: {
    meta: [{ hid: 'robots', name: 'robots', content: 'noindex, nofollow' }]
  }
})
</script>

<style lang="scss" src="./GmPanel.component.scss"></style>
