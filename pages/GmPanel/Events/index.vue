<template lang="pug">
.page.gm-panel-page
  GmPanel(:description="$t('gmPanel.events.description')")
    span.gm-panel__itemsTitle {{ $t(form.id ? 'gmPanel.events.edit' : 'gmPanel.events.add') }}
    CellGroup.gm-panel__group(inset)
      Field(:label="$t('gmPanel.events.series')" input-align="right")
        template(#input)
          select.gm-events__select(v-model="form.series" :aria-label="$t('gmPanel.events.series')")
            option(value disabled) {{ $t('gmPanel.events.seriesPick') }}
            option(v-for="s in series" :key="s.series" :value="s.series") {{ s.seriesName }}
      Field.gm-events__date(
        v-model="form.startDay"
        type="date"
        :label="$t('gmPanel.events.startDay')"
        input-align="right"
        left-icon="calendar-o"
      )
      Field(:label="$t('gmPanel.events.days')" input-align="right")
        template(#input)
          Stepper(v-model="form.days" integer :min="1" :max="60")
      Cell(:value="endPreview" :title="$t('gmPanel.events.end')")
      Field(
        v-model="form.note"
        :label="$t('gmPanel.events.note')"
        :placeholder="$t('gmPanel.events.notePlaceholder')"
        maxlength="200"
        input-align="right"
      )
    .gm-events__actions
      Button(
        color="var(--color-brand-02)"
        round
        block
        native-type="button"
        :loading="isSaving"
        :disabled="!form.series || !form.startDay"
        @click="save"
      ) {{ $t('gmPanel.events.save') }}
      Button(v-if="form.id" plain round block native-type="button" @click="reset") {{ $t('gmPanel.events.cancel') }}

    span.gm-panel__itemsTitle {{ $t('gmPanel.events.list') }}
    Empty(v-if="!items.length && !isLoading" image="search" :description="$t('gmPanel.events.empty')")
    CellGroup.gm-panel__group(v-for="e in items" :key="e.id" inset)
      .gm-events__item
        .gm-events__head
          b {{ e.seriesName }}
          Tag(:color="STATUS_COLOR[e.status]" round) {{ $t(`gmPanel.events.status.${e.status}`) }}
        small.gm-events__time {{ $t('gmPanel.events.start') }}: {{ formatTime(e.startsAt) }}
        small.gm-events__time {{ $t('gmPanel.events.end') }}: {{ formatTime(e.endsAt, true) }}
        small.gm-events__note(v-if="e.note") {{ e.note }}
        .gm-events__buttons
          Button(size="small" plain round native-type="button" @click="edit(e)") {{ $t('gmPanel.events.editAction') }}
          Button(type="danger" size="small" plain round native-type="button" @click="remove(e)") {{ $t('gmPanel.events.delete') }}

    Loading(v-if="isLoading" color="var(--color-brand-02)")
</template>

<script>
import { defineComponent, useContext, useStore, ref, reactive, computed } from '@nuxtjs/composition-api'
import { Loading, Empty, Button, Tag, CellGroup, Cell, Field, Stepper, Dialog } from 'vant'
import { showToast } from '@/helpers/toast'

const TZ = 'Europe/Istanbul'
const STATUS_COLOR = { active: 'var(--color-success-01)', planned: 'var(--color-info-01)', ended: 'var(--color-text-03)' }
// YYYY-MM-DD of an instant in Istanbul
const istanbulDay = d => new Date(d).toLocaleDateString('en-CA', { timeZone: TZ })

export default defineComponent({
  name: 'GmPanelEventsPage',
  components: { Loading, Empty, Button, Tag, CellGroup, Cell, Field, Stepper },
  layout: 'Default/Default.layout',
  middleware: ['gm-control'],
  setup() {
    const { i18n } = useContext()
    const store = useStore()

    const items = ref([])
    const series = ref([])
    const isLoading = ref(false)
    const isSaving = ref(false)
    const blank = () => ({ id: null, series: '', startDay: istanbulDay(Date.now()), days: 1, note: '' })
    const form = reactive(blank())

    const reset = () => Object.assign(form, blank())

    // end is exclusive: a 1-day event on the 29th ends 29th 23:59
    const formatTime = (iso, isEnd = false) =>
      new Date(new Date(iso).getTime() - (isEnd ? 1 : 0)).toLocaleString(i18n.locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: TZ
      })

    const endPreview = computed(() => {
      if (!form.startDay) return '-'

      const last = new Date(`${form.startDay}T00:00:00Z`)

      last.setUTCDate(last.getUTCDate() + Number(form.days || 1) - 1)

      return `${last.toLocaleDateString(i18n.locale, { dateStyle: 'medium', timeZone: 'UTC' })} 23:59`
    })

    const fail = error => {
      const code = error && error.details && error.details.code
      const key = `gmPanel.events.errors.${code}`

      showToast.fail(code && i18n.te(key) ? i18n.t(key) : i18n.t('error.anErrorOccurred'))
    }

    const fetchList = async () => {
      isLoading.value = true
      const { data, error } = await store.dispatch('gm/fetchFreeEvents')

      isLoading.value = false

      if (error) return fail(error)

      items.value = data.items || []
      series.value = data.series || []
    }

    const save = async () => {
      if (isSaving.value) return

      isSaving.value = true
      const { error } = await store.dispatch('gm/saveFreeEvent', {
        id: form.id,
        data: { series: form.series, startDay: form.startDay, days: Number(form.days), note: form.note }
      })

      isSaving.value = false

      if (error) return fail(error)

      showToast.success(i18n.t('gmPanel.events.saved'))
      reset()
      await fetchList()
    }

    const edit = e => {
      Object.assign(form, {
        id: e.id,
        series: e.series,
        startDay: istanbulDay(e.startsAt),
        days: Math.max(1, Math.round((new Date(e.endsAt) - new Date(e.startsAt)) / 864e5)),
        note: e.note || ''
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const remove = e =>
      Dialog.confirm({
        title: i18n.t('gmPanel.events.delete'),
        message: i18n.t('gmPanel.events.deleteConfirm', { name: e.seriesName }),
        cancelButtonText: i18n.t('gmPanel.events.cancel'),
        confirmButtonText: i18n.t('gmPanel.events.delete')
      })
        .then(async () => {
          const { error } = await store.dispatch('gm/deleteFreeEvent', e.id)

          if (error) return fail(error)

          showToast.success(i18n.t('gmPanel.events.deleted'))

          if (form.id === e.id) reset()
          await fetchList()
        })
        .catch(() => {})

    fetchList()

    return { STATUS_COLOR, items, series, isLoading, isSaving, form, reset, endPreview, formatTime, save, edit, remove }
  },
  head() {
    return { title: this.$t('gmPanel.title') }
  }
})
</script>

<style lang="scss">
.gm-events {
  &__select {
    width: 100%;
    color: var(--color-text-01);
    text-align: right;
    background: transparent;
    border: 0;
  }

  // native date picker icon follows the theme
  .dark-mode &__date input {
    color-scheme: dark;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 16px;
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 16px;
    color: var(--color-text-01);
  }

  &__head {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
  }

  &__time {
    color: var(--color-text-03);
  }

  &__note {
    color: var(--color-text-02);
  }

  &__buttons {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }
}
</style>
