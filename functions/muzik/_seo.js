// Music quiz SEO at the edge.
// Entry page: the build already gives the shell its own head (scripts/content-pages/route-heads.js); this adds what the
// build can't know: the current featured artists and playlists, plus how the modes work.
// Play link (/oyna?artistIds=… | ?playlistId=…, what the score share text links to): names the chosen artists/playlist in
// the title and share preview. Its canonical is the entry page, so shared links strengthen that one page instead of thin
// query variants; in-app navigation never reaches a Function, only full loads (share previews, crawlers, refreshes) do.

import { cachedJson, escapeHtml, isHtml, rewrite } from '../quiz/_seo.js'
import { ampFetch, localeToStorefront, localeToLang } from '../api/music/_apple.js'

const BASE_URL = 'https://www.parolla.app'
const DATA_TTL = 21600
// artist/playlist names barely change
const NAMES_TTL = 604800
const MAX_ARTISTS = 3
const ARTIST_ID = /^\d{1,15}$/
const PLAYLIST_ID = /^pl\.[\w-]{1,64}$/

// mode seconds mirror system/music.js MUSIC_DIFFICULTIES and MUSIC_ROUND_TIME_MS
const COPY = {
  tr: {
    quizPath: '/muzik/sarki-tahmin-et/',
    image: '/meta/og-music-tr.jpg',
    // title/description mirror seo.musicMode.guessTheSong(Play) + seo.main.title in locales/tr.js
    suffix: 'parolla - Kelime oyunu',
    title: names => `${names} şarkılarını tahmin et - Müzik Quiz`,
    description: names => `Çalan şarkıyı bil! Müzik quizde ${names} şarkılarını dinle ve çalan şarkıyı tahmin et.`,
    genericTitle: 'Müzik Quiz - Çalan şarkıyı tahmin et',
    genericDescription:
      'Müzik quiz oyna, çalan şarkıyı bil! Sanatçı ya da çalma listesi seç, şarkıyı 5, 3, 1 ya da 0.5 saniye dinle ve çalan şarkıyı tahmin et. Ücretsiz.',
    play: 'Müzik quiz oyna',
    modes:
      'Müzik quizde çalan şarkıyı bil: mod seç ve çalan şarkıyı tahmin et. Kolay modda şarkı 5 saniye, Orta modda 3 saniye, Zor modda 1 saniye, İmkansız modda 0.5 saniye çalar. Her turda tahmin için 30 saniyen var.',
    artists: 'Öne çıkan sanatçılar',
    playlists: 'Öne çıkan çalma listeleri'
  },
  en: {
    quizPath: '/en/music/guess-the-song/',
    image: '/meta/og-music-en.jpg',
    // title/description mirror seo.musicMode.guessTheSong(Play) + seo.main.title in locales/en.js
    suffix: 'parolla - Word game',
    title: names => `Guess ${names} songs - Music Quiz`,
    description: names => `Name the song that is playing! Listen to ${names} songs in the music quiz and guess them.`,
    genericTitle: 'Music Quiz - Guess the song that is playing',
    genericDescription:
      'Play the music quiz and name the song that is playing! Pick an artist or playlist, hear it for 5, 3, 1 or 0.5 seconds and guess the song. Free.',
    play: 'Play the music quiz',
    modes:
      'Name the song that is playing in the music quiz: pick a mode and guess the song. Easy plays the song for 5 seconds, Medium for 3, Hard for 1 and Impossible for 0.5 seconds. You have 30 seconds to guess each round.',
    artists: 'Featured artists',
    playlists: 'Featured playlists'
  }
}

const listSection = (heading, names) =>
  names.length ? `<h2>${heading}</h2><ul>${names.map(name => `<li>${escapeHtml(name)}</li>`).join('')}</ul>` : ''

export const musicQuizPage = locale => async context => {
  const shell = await context.next()
  const copy = COPY[locale]

  if (!isHtml(shell)) {
    return shell
  }

  const origin = new URL(context.request.url).origin
  // one failing list shouldn't drop the other
  const [artists, playlists] = await Promise.all(
    ['featured-artists', 'featured-playlists'].map(endpoint =>
      cachedJson(context, `${origin}/api/music/${endpoint}?locale=${locale}`, DATA_TTL)
        .then(json => json?.data || [])
        .catch(err => {
          console.error('[music-seo]', endpoint, String((err && err.message) || err))

          return []
        })
    )
  )

  const body = [
    `<p>${copy.modes}</p>`,
    listSection(copy.artists, artists.map(artist => artist.artistName).filter(Boolean)),
    listSection(copy.playlists, playlists.map(playlist => playlist.name).filter(Boolean))
  ].join('')

  // route-heads.js puts a hidden <main> inside #__nuxt; the extra text goes at its end
  return new HTMLRewriter()
    .on('div#__nuxt > main', {
      element(el) {
        el.append(body, { html: true })
      }
    })
    .transform(shell)
}

// Cached per id set for NAMES_TTL; null when the ids are invalid or Apple can't be asked cheaply (no cached token)
const lookupNames = async (context, { artistIds, playlistId }, locale) => {
  const storefront = localeToStorefront(locale)
  const lang = localeToLang(locale)
  let path = null

  if (PLAYLIST_ID.test(playlistId || '')) {
    path = `/playlists/${playlistId}?fields[playlists]=name&omit[resource]=autos&l=${lang}`
  } else {
    const ids = (artistIds || '')
      .split(',')
      .filter(id => ARTIST_ID.test(id))
      .slice(0, MAX_ARTISTS)

    if (ids.length) path = `/artists?ids=${ids.join(',')}&fields[artists]=name&l=${lang}`
  }

  if (!path) return null

  const cache = caches.default
  const key = new Request(`${new URL(context.request.url).origin}/__seo-music?sf=${storefront}&p=${encodeURIComponent(path)}`)
  const hit = await cache.match(key)

  if (hit) return hit.json()

  const json = await ampFetch(context.env, path, storefront, { noScrape: true })
  const names = (json?.data || []).map(item => item?.attributes?.name).filter(Boolean)

  if (!names.length) return null

  context.waitUntil(cache.put(key, new Response(JSON.stringify(names), { headers: { 'Cache-Control': `public, max-age=${NAMES_TTL}` } })))

  return names
}

export const musicPlayPage = locale => async context => {
  const shell = await context.next()
  const copy = COPY[locale]

  if (!isHtml(shell)) {
    return shell
  }

  const params = new URL(context.request.url).searchParams
  let names = null

  try {
    names = await lookupNames(context, { artistIds: params.get('artistIds'), playlistId: params.get('playlistId') }, locale)
  } catch (err) {
    console.error('[music-seo] names:', String((err && err.message) || err))
  }

  const label = names && names.join(', ')
  const heading = label ? copy.title(label) : copy.genericTitle
  const description = label ? copy.description(label) : copy.genericDescription
  const canonical = BASE_URL + copy.quizPath

  return rewrite(shell, {
    title: `${heading} - ${copy.suffix}`,
    description,
    canonical,
    url: context.request.url,
    image: BASE_URL + copy.image,
    jsonLd: [],
    body: `<h1>${escapeHtml(heading)}</h1><p>${escapeHtml(description)}</p><a href="${copy.quizPath}">${copy.play}</a>`
  })
}
