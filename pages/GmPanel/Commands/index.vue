<template lang="pug">
.page.gm-panel-page
  GmPanel(:description="$t('gmPanel.commands.description')")
    span.gm-panel__itemsTitle {{ $t('gmPanel.commands.help') }}
    CellGroup.gm-panel__group(inset)
      .gm-commands__help
        code.gm-commands__code {{ usage }}
        p {{ $t('gmPanel.commands.sendgoldHelp') }}
        small {{ $t('gmPanel.commands.example') }}:
          |
          |
          code.gm-commands__code {{ $t('gmPanel.commands.placeholder') }}

    CellGroup.gm-panel__group(inset)
      Field.gm-commands__field(
        v-model="command"
        :placeholder="$t('gmPanel.commands.placeholder')"
        autocomplete="off"
        autocapitalize="off"
        @keydown.enter.prevent="submit"
        @keydown.up.prevent="recall"
      )
    .gm-commands__submit
      Button(
        color="var(--color-brand-02)"
        round
        block
        native-type="button"
        :loading="isRunning"
        :disabled="!command.trim()"
        @click="submit"
      )
        | {{ $t('gmPanel.commands.run') }}

    .gm-commands__result(v-if="result" role="status" :class="`gm-commands__result--${result.ok ? 'ok' : 'error'}`")
      template(v-if="result.ok && result.result")
        i18n(path="gmPanel.commands.sent" tag="span")
          template(#username) {{ result.result.username }}
          template(#amount): GoldAmount(size="sm" :amount="result.result.amount")
          template(#balance): GoldAmount(size="sm" :amount="result.result.balance")
      span(v-else) {{ result.message }}

    span.gm-panel__itemsTitle {{ $t('gmPanel.commands.logs') }}
    Empty(v-if="!logs.length && !isLoading" image="search" :description="$t('gmPanel.commands.noLogs')")
    CellGroup.gm-panel__group(v-for="log in logs" :key="log.id" inset)
      .gm-commands__log
        .gm-commands__logHead
          small.gm-commands__time {{ formatTime(log.createdAt) }} · {{ log.gmUsername }}
          Tag(:color="log.status === 'ok' ? 'var(--color-success-01)' : 'var(--color-danger-01)'" round)
            | {{ $t(`gmPanel.commands.${log.status === 'ok' ? 'ok' : 'error'}`) }}
        code.gm-commands__code {{ log.command }}
        small.gm-commands__time.gm-commands__sent(v-if="log.status === 'ok' && log.result && log.result.username")
          span {{ log.result.username }} +
          GoldAmount(size="sm" :amount="log.result.amount")
          span →
          GoldAmount(size="sm" :amount="log.result.balance")
        small.gm-commands__time(v-else) {{ errorText(log) }}

    Loading(v-if="isLoading" color="var(--color-brand-02)")
    .gm-commands__submit(v-if="hasMore && !isLoading")
      Button(plain round block native-type="button" @click="fetchLogs(page + 1)") {{ $t('gmPanel.commands.more') }}
</template>

<script>
import { defineComponent, useContext, useStore, ref } from '@nuxtjs/composition-api'
import { Loading, Empty, Button, Tag, CellGroup, Field } from 'vant'
import { showToast } from '@/helpers/toast'

export default defineComponent({
  name: 'GmPanelCommandsPage',
  components: { Loading, Empty, Button, Tag, CellGroup, Field },
  layout: 'Default/Default.layout',
  middleware: ['gm-control'],
  setup() {
    const { i18n } = useContext()
    const store = useStore()

    const command = ref('')
    const result = ref(null)
    const isRunning = ref(false)
    const logs = ref([])
    const page = ref(1)
    const hasMore = ref(false)
    const isLoading = ref(false)
    const history = []
    let historyIndex = 0

    const fetchLogs = async (target = 1) => {
      isLoading.value = true
      const { data, error } = await store.dispatch('gm/fetchCommandLogs', { page: target })

      if (error) {
        isLoading.value = false
        showToast.fail(i18n.t('error.anErrorOccurred'))

        return
      }

      logs.value = target === 1 ? data?.items || [] : [...logs.value, ...(data?.items || [])]
      page.value = target
      hasMore.value = Boolean(data?.hasMore)
      isLoading.value = false
    }

    const submit = async () => {
      const text = command.value.trim()

      if (!text || isRunning.value) return

      isRunning.value = true
      const { data, error } = await store.dispatch('gm/runCommand', { command: text })

      isRunning.value = false
      history.push(text)
      historyIndex = history.length

      if (error) {
        result.value = { ok: false, message: error.message || i18n.t('error.anErrorOccurred') }
        showToast.fail(result.value.message)
      } else {
        result.value = data

        if (data.ok) command.value = ''
      }

      await fetchLogs(1)
    }

    // Up arrow walks back through this session's commands
    const recall = () => {
      if (!history.length) return
      historyIndex = Math.max(0, historyIndex - 1)
      command.value = history[historyIndex]
    }

    const formatTime = iso => new Date(iso).toLocaleString(i18n.locale, { dateStyle: 'short', timeStyle: 'short' })

    // logs store only the error code; unknown codes fall back to the raw code
    const errorText = log => {
      const code = (log.result && log.result.code) || ''
      const key = `gmPanel.commands.errors.${code}`

      return code && i18n.te(key) ? i18n.t(key) : code
    }

    const usage = `/sendgold <${i18n.t('gmPanel.commands.userArg')}> <${i18n.t('gmPanel.commands.amountArg')}> [${i18n.t(
      'gmPanel.commands.noteArg'
    )}]`

    fetchLogs(1)

    return {
      usage,
      command,
      result,
      isRunning,
      logs,
      page,
      hasMore,
      isLoading,
      submit,
      recall,
      fetchLogs,
      formatTime,
      errorText
    }
  },
  head() {
    return { title: this.$t('gmPanel.title') }
  }
})
</script>

<style lang="scss">
.gm-commands {
  &__help {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 16px;
    color: var(--color-text-02);
    font-size: 13px;

    p {
      margin: 0;
    }
  }

  &__code {
    color: var(--color-text-01);
    font-size: 13px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    word-break: break-all;
  }

  &__field input {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  &__submit {
    padding: 0 16px;
  }

  &__result {
    margin: 0 16px;
    padding: 10px 12px;
    font-size: 14px;
    border-radius: calc(var(--border-radius-01) / 2);

    &--ok {
      color: var(--color-success-01);
      background-color: color-mix(in sRGB, var(--color-success-01) 12%, transparent);
    }

    &--error {
      color: var(--color-danger-01);
      background-color: color-mix(in sRGB, var(--color-danger-01) 12%, transparent);
    }
  }

  &__log {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 16px;
  }

  &__logHead {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
  }

  &__time {
    color: var(--color-text-03);
  }

  &__sent {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
  }
}
</style>
