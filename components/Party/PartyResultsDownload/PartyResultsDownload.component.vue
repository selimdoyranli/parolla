<template lang="pug">
//- final screen: the game's results as a file (ranking + everyone's answers; choices: the champion order)
section.party-card.party-results-download
  header.party-card__head
    .party-card__head-icon
      AppIcon(name="tabler:download" :width="18" :height="18")
    .party-card__head-text
      span.party-card__eyebrow {{ $t('party.final.download.eyebrow') }}
      h3.party-card__title {{ $t('party.final.download.title') }}
  .party-results-download__actions
    Button(icon="description" round block @click="downloadJson") {{ $t('party.final.download.json') }}
    Button(color="var(--color-brand-02)" icon="orders-o" round block @click="downloadExcel") {{ $t('party.final.download.excel') }}
</template>

<script>
import { defineComponent, useStore, useContext } from '@nuxtjs/composition-api'
import { Button } from 'vant'
import { buildXlsx } from '@/helpers/xlsx'
import { formatCorrectAnswer } from '@/helpers/partyAnswer'
import { choiceTypeEnum } from '@/enums/quiz.enum'

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export default defineComponent({
  components: { Button },
  setup() {
    const store = useStore()
    const { i18n } = useContext()

    const choiceLabel = choice => (choice?.choiceType === choiceTypeEnum.TEXT ? choice.text : choice?.mediaNote || choice?.media?.url) || ''

    // everything the final screen shows, as plain data (the JSON file as is; the Excel sheets are built from it)
    const results = () => {
      const final = store.state.party.final
      const game = store.getters['party/game'] || {}
      const board = final.leaderboard || []
      const review = final.review || []
      const isChoices = Boolean(final.champion)
      const nameOf = id => board.find(r => r.playerId === id)?.name || store.getters['party/players'].find(p => p.id === id)?.name || null

      return {
        app: 'parolla',
        type: 'party-results',
        exportedAt: new Date().toISOString(),
        room: store.state.party.room?.code || null,
        quiz: { roomId: game.roomId || null, title: game.title || '', type: isChoices ? 'choices' : 'qa' },
        // hidden board ("Hiçbir zaman"): only what this player saw, their own score
        leaderboard: board.map((row, i) => ({
          rank: i + 1,
          playerId: row.playerId,
          name: row.name,
          score: row.score,
          correctCount: row.correctCount,
          wrongCount: review.length - row.correctCount,
          isGuest: String(row.playerId).startsWith('guest_')
        })),
        me: final.me || null,
        questions: review.map((q, i) => ({
          no: i + 1,
          letter: q.letter || null,
          question: q.question || q.mediaNote || null,
          correctAnswer: formatCorrectAnswer(q.correctAnswer, q.answerType),
          answers: q.answers.map(a => ({
            playerId: a.playerId,
            name: a.name || nameOf(a.playerId),
            answer: a.answer,
            correct: a.correct,
            points: a.points
          }))
        })),
        ...(isChoices && {
          champion: choiceLabel(final.champion),
          // last one standing first
          ranking: [final.champion, ...[...(final.eliminated || [])].reverse()].map((c, i) => ({ rank: i + 1, choice: choiceLabel(c) }))
        })
      }
    }

    const t = key => i18n.t(`party.final.download.${key}`)

    const sheets = data => {
      if (data.ranking)
        return [{ name: t('sheets.result'), rows: [[t('cols.rank'), t('cols.choice')], ...data.ranking.map(r => [r.rank, r.choice])] }]

      // the player rows: the board's order, else whoever answered (matched by id: guests can share a name)
      const players = data.leaderboard.length
        ? data.leaderboard
        : [...new Map(data.questions.flatMap(q => q.answers.map(a => [a.playerId, a]))).values()]
      const head = q => [`${q.no}${q.letter ? ` (${q.letter})` : ''}`]
      const cell = (q, playerId) => {
        const a = q.answers.find(x => x.playerId === playerId)

        return a ? `${a.answer} ${a.correct ? '✓' : '✗'}` : '-'
      }

      const out = []

      if (data.leaderboard.length) {
        out.push({
          name: t('sheets.ranking'),
          rows: [
            [t('cols.rank'), t('cols.player'), t('cols.score'), t('cols.correct'), t('cols.wrong')],
            ...data.leaderboard.map(r => [r.rank, r.name, r.score, r.correctCount, r.wrongCount])
          ]
        })
      }

      out.push(
        {
          name: t('sheets.answers'),
          rows: [
            [t('cols.player'), ...data.questions.flatMap(head)],
            [t('cols.correctAnswer'), ...data.questions.map(q => q.correctAnswer)],
            ...players.map(p => [p.name, ...data.questions.map(q => cell(q, p.playerId))])
          ]
        },
        {
          name: t('sheets.questions'),
          rows: [
            [t('cols.no'), t('cols.letter'), t('cols.question'), t('cols.correctAnswer')],
            ...data.questions.map(q => [q.no, q.letter, q.question, q.correctAnswer])
          ]
        }
      )

      return out
    }

    // parolla-parti-baskentler-2026-10-31.json
    const fileName = (data, ext) => {
      const slug = (data.quiz.title || 'sonuclar')
        .toLocaleLowerCase('tr')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/ı/g, 'i')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48)

      return `parolla-parti-${slug}-${data.exportedAt.slice(0, 10)}.${ext}`
    }

    const save = (blob, name) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }

    const downloadJson = () => {
      const data = results()

      save(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), fileName(data, 'json'))
    }

    const downloadExcel = () => {
      const data = results()

      save(new Blob([buildXlsx(sheets(data))], { type: XLSX_TYPE }), fileName(data, 'xlsx'))
    }

    return { downloadJson, downloadExcel }
  }
})
</script>

<style lang="scss" src="./PartyResultsDownload.component.scss" scoped></style>
