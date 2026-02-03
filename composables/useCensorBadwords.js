import { useContext } from '@nuxtjs/composition-api'
import { badWords as badWordsTr } from '@/locales/badwords/badwords-tr'
import { badWords as badWordsEn } from '@/locales/badwords/badwords-en'

export default () => {
  const { i18n } = useContext()

  const badWords = i18n.locale === i18n.defaultLocale ? badWordsTr : badWordsEn

  const censorBadwords = text => {
    if (typeof text !== 'string') return ''

    let censoredText = text

    badWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      const stars = '*'.repeat(word.length)
      censoredText = censoredText.replace(regex, stars)
    })

    return censoredText
  }

  return {
    censorBadwords
  }
}
