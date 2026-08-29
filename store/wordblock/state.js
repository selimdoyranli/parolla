import { WORDBLOCK_AVAILABLE_LENGTHS, WORDBLOCK_LOCALES } from '@/system/constant'

export const defaultGameState = () => ({
  targetWord: '',
  isGameOver: false,
  currentDate: null,
  result: {
    status: null,
    attempts: 0,
    word: '',
    guesses: [],
    elapsedTime: null
  },
  dialog: {
    howToPlay: {
      isOpen: false
    },
    stats: {
      isOpen: false
    }
  }
})

// Games are keyed by locale first, then by character length. Every locale has its own daily
// word, so finishing the Turkish 5-letter game must not mark the English one as played.
// All slots are created up front so Vue 2 can track them without Vue.set.
const defaultGames = () =>
  Object.keys(WORDBLOCK_LOCALES).reduce((locales, locale) => {
    locales[locale] = WORDBLOCK_AVAILABLE_LENGTHS.reduce((lengths, charLength) => {
      lengths[charLength] = defaultGameState()

      return lengths
    }, {})

    return locales
  }, {})

// Leaderboards are per board too, so the intro card's "today's leaders" are kept per
// character length. Slots are pre-created so Vue 2 tracks them without Vue.set.
const defaultTodaysLeaders = () =>
  WORDBLOCK_AVAILABLE_LENGTHS.reduce((lengths, charLength) => {
    lengths[charLength] = { items: [], meta: {} }

    return lengths
  }, {})

export default () => ({
  games: defaultGames(),
  dailyPlayingCount: 0,
  isActiveKeyboard: true,
  leaderboard: {
    items: [],
    meta: {}
  },
  // Where the signed-in player stands, for the row the leaderboard pins above the list
  userRank: null,
  todaysLeaders: defaultTodaysLeaders()
})
