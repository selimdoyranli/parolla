<template lang="pug">
.gm-panel
  // Active tab from the route name: vant's route mode didn't match localized paths
  Tabs.gm-panel__tabs(:active="getRouteBaseName()")
    Tab(name="GmPanel-Wordblock" replace :to="localePath({ name: 'GmPanel-Wordblock' })" :title="$t('gmPanel.wordblock.title')")
    Tab(name="GmPanel-Daily" replace :to="localePath({ name: 'GmPanel-Daily' })" :title="$t('gmPanel.daily.title')")

  NoticeBar.gm-panel__description(
    color="var(--color-info-01)"
    left-icon="info-o"
    wrapable
    background="var(--color-ui-02)"
    :scrollable="false"
  ) {{ description }}

  CellGroup.gm-panel__group(inset)
    Field(
      type="date"
      :value="date"
      :label="$t('gmPanel.date')"
      input-align="right"
      left-icon="calendar-o"
      @input="$emit('update:date', $event)"
    )

  CellGroup.gm-panel__group(inset)
    Cell(:label="notifyText" icon="envelop-o" label-class="gm-panel__notifyText" :title="$t('gmPanel.notifyTitle')")
      template(#right-icon)
        Button(icon="description" plain round size="small" native-type="button" @click="copyNotifyText") {{ $t('gmPanel.copy') }}

  slot
</template>

<script>
import { defineComponent, useContext } from '@nuxtjs/composition-api'
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
      required: true
    },
    description: {
      type: String,
      required: true
    }
  },
  setup() {
    const { i18n } = useContext()

    const copyNotifyText = async () => {
      await navigator.clipboard.writeText(NOTIFY_TEXT)
      showToast.default(i18n.t('clipboard.callback.success'))
    }

    return {
      notifyText: NOTIFY_TEXT,
      copyNotifyText
    }
  }
})
</script>

<style lang="scss" src="./GmPanel.component.scss"></style>
