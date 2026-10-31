import { answerTypeEnum } from '@/enums/quiz.enum'

/**
 * A party question's correct answer for display: text answers keep their comma alternatives in one string
 * ("Ankara, Angora" → "Ankara / Angora"); trivia options may contain commas themselves, so they stay as they are.
 */
export const formatCorrectAnswer = (raw, answerType) => {
  const text = String(raw || '')

  return answerType === answerTypeEnum.TRIVIA
    ? text
    : text
        .split(',')
        .map(a => a.trim())
        .filter(Boolean)
        .join(' / ')
}
