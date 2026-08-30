/**
 * Single source of truth for the static content layer (GEO / AI visibility).
 * CommonJS on purpose: consumed by both scripts/content-pages/generate.js (Node)
 * and nuxt-config/head.js (Nuxt build).
 * Spec: docs/superpowers/specs/2026-08-05-ai-visibility-design.md
 */

const BASE_URL = 'https://www.parolla.app'

const SAME_AS = [
  'https://apps.apple.com/app/parolla-kelime-oyunu/id6448075358',
  'https://play.google.com/store/apps/details?id=app.parolla',
  'https://x.com/parollaapp',
  'https://www.linkedin.com/showcase/parolla-kelime-oyunu',
  'https://github.com/selimdoyranli/parolla',
  'https://selimdoyranli.com'
]

const GAME_INFO = {
  name: 'parolla',
  descriptions: {
    tr: "parolla; günlük A'dan Z'ye kelime oyunu, Türkçe Wordle benzeri KelimeBlok, müzik tahmin oyunu, oyuncuların oluşturduğu quizler ve turnuva modu sunan ücretsiz Türkçe kelime ve bilgi oyunu platformudur.",
    en: 'parolla is a free Turkish word and trivia game platform featuring a daily A-to-Z word quiz, a Wordle-style word puzzle, a music guessing game, player-created quizzes and a tournament mode.'
  }
}

// Public, non-parameterized app routes included in sitemap.xml (SPA shells).
// `en: null` means the route has no working EN counterpart at all: pages/DailyMode
// and pages/UnlimitedMode redirect anyone on the en locale back to the home page,
// so /en/daily and /en/unlimited are dead for every visitor, signed in or not.
// Auth-gated routes are a different case and stay listed — /quiz-olustur works
// fine for a signed-in player, which is who goes there.
const APP_ROUTES = [
  { tr: '/', en: '/en' },
  { tr: '/gunluk', en: null },
  { tr: '/gunluk/liderlik', en: '/en/daily/leaderboard' },
  { tr: '/limitsiz', en: null },
  { tr: '/yaratici', en: '/en/creator' },
  { tr: '/quizler', en: '/en/quizzes' },
  { tr: '/quiz-olustur', en: '/en/create-quiz' },
  { tr: '/tur', en: '/en/tour' },
  { tr: '/tur/liderlik', en: '/en/tour/leaderboard' },
  { tr: '/ciz', en: '/en/draw' },
  { tr: '/kelimeblok', en: '/en/wordblock' },
  { tr: '/kelimeblok/liderlik', en: '/en/wordblock/leaderboard' },
  { tr: '/muzik', en: '/en/music' },
  { tr: '/muzik/sarki-tahmin-et', en: '/en/music/guess-the-song' },
  { tr: '/sayfa/gizlilik-politikasi', en: '/en/page/privacy-policy' },
  { tr: '/sayfa/cerez-politikasi', en: '/en/page/cookie-policy' },
  { tr: '/sayfa/kvkk-aydinlatma-metni', en: '/en/page/kvkk-clarification-text' },
  { tr: '/sayfa/kullanim-kosullari', en: '/en/page/terms-of-use' }
]

// Static content pages: markdown source ↔ output URL per locale
// jsonld: 'hub' | 'howto' | 'faq' | 'about' (see generate.js buildJsonld)
const CONTENT_PAGES = [
  {
    key: 'how-to-play',
    jsonld: 'hub',
    tr: { src: 'content/site/tr/nasil-oynanir.md', url: '/nasil-oynanir' },
    en: { src: 'content/site/en/how-to-play.md', url: '/en/how-to-play' }
  },
  {
    key: 'daily',
    jsonld: 'howto',
    tr: { src: 'content/site/tr/nasil-oynanir-gunluk.md', url: '/nasil-oynanir/gunluk' },
    en: { src: 'content/site/en/how-to-play-daily.md', url: '/en/how-to-play/daily' }
  },
  {
    key: 'unlimited',
    jsonld: 'howto',
    tr: { src: 'content/site/tr/nasil-oynanir-limitsiz.md', url: '/nasil-oynanir/limitsiz' },
    en: { src: 'content/site/en/how-to-play-unlimited.md', url: '/en/how-to-play/unlimited' }
  },
  {
    key: 'creator',
    jsonld: 'howto',
    tr: { src: 'content/site/tr/nasil-oynanir-yaratici.md', url: '/nasil-oynanir/yaratici' },
    en: { src: 'content/site/en/how-to-play-creator.md', url: '/en/how-to-play/creator' }
  },
  {
    key: 'tour',
    jsonld: 'howto',
    tr: { src: 'content/site/tr/nasil-oynanir-tur.md', url: '/nasil-oynanir/tur' },
    en: { src: 'content/site/en/how-to-play-tour.md', url: '/en/how-to-play/tour' }
  },
  {
    key: 'wordblock',
    jsonld: 'howto',
    tr: { src: 'content/site/tr/nasil-oynanir-kelimeblok.md', url: '/nasil-oynanir/kelimeblok' },
    en: { src: 'content/site/en/how-to-play-wordblock.md', url: '/en/how-to-play/wordblock' }
  },
  {
    key: 'music',
    jsonld: 'howto',
    tr: { src: 'content/site/tr/nasil-oynanir-muzik.md', url: '/nasil-oynanir/muzik' },
    en: { src: 'content/site/en/how-to-play-music.md', url: '/en/how-to-play/music' }
  },
  {
    key: 'draw',
    jsonld: 'howto',
    tr: { src: 'content/site/tr/nasil-oynanir-ciz.md', url: '/nasil-oynanir/ciz' },
    en: { src: 'content/site/en/how-to-play-draw.md', url: '/en/how-to-play/draw' }
  },
  {
    key: 'faq',
    jsonld: 'faq',
    tr: { src: 'content/site/tr/sss.md', url: '/sss' },
    en: { src: 'content/site/en/faq.md', url: '/en/faq' }
  },
  {
    key: 'about',
    jsonld: 'about',
    tr: { src: 'content/site/tr/hakkinda.md', url: '/hakkinda' },
    en: { src: 'content/site/en/about.md', url: '/en/about' }
  }
]

module.exports = {
  BASE_URL,
  SAME_AS,
  GAME_INFO,
  APP_ROUTES,
  CONTENT_PAGES
}
