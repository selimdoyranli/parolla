export const APP_NAME = 'parolla'
export const APP_DOMAIN = 'parolla.app'
export const APP_URL = 'https://www.parolla.app'
export const PUBLISHER_NAME = 'Selim Doyranlı'
export const PUBLISHER_DOMAIN = 'selimdoyranli.com'
export const PUBLISHER_URL = 'https://selimdoyranli.com'
export const ANSWER_CHAR_LENGTH = 64
// mirrors room-comment content maxLength in parolla-strapi
export const COMMENT_CHAR_LENGTH = 512
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
// Quick filter chips above the quiz list; tagsFilter is the ?tags= value each one sets
export const ROOM_FEATURED_TAGS = [
  {
    title: 'Tümü',
    tagsFilter: null,
    icon: 'fluent-emoji-flat:diamond-with-a-dot'
  },
  {
    title: 'Genel Kültür',
    tagsFilter: 'GenelKültür',
    icon: 'fluent-emoji-flat:books'
  },
  {
    title: 'Müzik',
    tagsFilter: 'müzik',
    icon: 'fluent-emoji-flat:musical-note'
  },
  {
    title: 'Dizi-Film',
    tagsFilter: 'dizi,film',
    icon: 'fluent-emoji-flat:television'
  },
  {
    title: 'Oyun',
    tagsFilter: 'oyun,VideoOyunları,VideoOyunu',
    icon: 'fluent-emoji-flat:video-game'
  },
  {
    title: 'Dil Öğren',
    tagsFilter: 'ingilizce,ispanyolca,fransızca,almanca,italyanca,portekizce,japonca,çince',
    icon: 'fluent-emoji-flat:japanese-prohibited-button'
  },
  {
    title: 'Futbol',
    tagsFilter: 'futbol',
    icon: 'fluent-emoji-flat:soccer-ball'
  },
  {
    title: 'Basketbol',
    tagsFilter: 'basketbol',
    icon: 'fluent-emoji-flat:basketball'
  },
  {
    title: 'Tarih',
    tagsFilter: 'atatürk,osmanlı,islam,askeri,savaş,medeniyetler',
    icon: 'fluent-emoji-flat:calendar'
  },
  {
    title: 'Bilim',
    tagsFilter: 'bilim',
    icon: 'fluent-emoji-flat:microscope'
  },
  {
    title: 'Coğrafya',
    tagsFilter: 'coğrafya',
    icon: 'fluent-emoji-flat:globe-showing-europe-africa'
  },
  {
    title: 'Otomobil',
    tagsFilter: 'otomobil,araba,arabalar',
    icon: 'twemoji:sport-utility-vehicle'
  },
  {
    title: 'Bayrak Bilmece',
    tagsFilter: 'bayrak,bayraklar,ülkebayrakları,bayrakbilmece',
    icon: 'flag:tr-4x3'
  }
]
