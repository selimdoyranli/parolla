export const APP_NAME = 'parolla'
export const APP_DOMAIN = 'parolla.app'
export const APP_URL = 'https://www.parolla.app'
export const PUBLISHER_NAME = 'Selim Doyranlı'
export const PUBLISHER_DOMAIN = 'selimdoyranli.com'
export const PUBLISHER_URL = 'https://selimdoyranli.com'
export const ANSWER_CHAR_LENGTH = 64
export const GAME_TIME_LIMIT = 60 * 5 * 1000 // 5min
export const UNSUPPORTED_HEIGHT = 520
export const USERNAME_REGEX = /^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/
export const ROOM_TAG_REGEX = /[^\p{L}\p{N}]/gu
export const WORDBLOCK_AVAILABLE_LENGTHS = [5, 6, 7]
export const WORDBLOCK_MAX_ATTEMPTS = 6
// Wordblock is letter-exact, so every locale needs its own alphabet: the on-screen keyboard
// only offers these keys, and case conversion is locale-specific too (Turkish 'i' uppercases
// to 'İ', not 'I', which would break every English word containing an i).
export const WORDBLOCK_LOCALES = {
  tr: {
    letters: 'abcçdefgğhıijklmnoöprsştuüvyz',
    keyboard: [
      ['e', 'r', 't', 'y', 'u', 'ı', 'o', 'p', 'ğ', 'ü'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ş', 'i'],
      ['z', 'c', 'v', 'b', 'n', 'm', 'ö', 'ç']
    ]
  },
  en: {
    letters: 'abcdefghijklmnopqrstuvwxyz',
    keyboard: [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      ['z', 'x', 'c', 'v', 'b', 'n', 'm']
    ]
  }
}
export const WORDBLOCK_FALLBACK_LOCALE = 'tr'
// Upper bound the score API accepts for a game's elapsed time (24 hours). A board left
// open overnight would otherwise be rejected on submit.
export const WORDBLOCK_MAX_ELAPSED_MS = 86400000
// Rows shown on a leaderboard page
export const WORDBLOCK_LEADERBOARD_PAGE_SIZE = 100
