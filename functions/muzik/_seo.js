// Crawler-facing content for the music quiz entry page only (never the play links, so each game costs no Function call).
// The build already gives this shell its own title/description/canonical/hreflang (scripts/content-pages/route-heads.js);
// this adds what the build can't know: the current featured artists and playlists, plus how the modes work.

import { cachedJson, escapeHtml, isHtml } from '../quiz/_seo.js'

const DATA_TTL = 21600

// mode seconds mirror system/music.js MUSIC_DIFFICULTIES and MUSIC_ROUND_TIME_MS
const COPY = {
  tr: {
    modes:
      'Müzik quizde çalan şarkıyı bil: mod seç ve çalan şarkıyı tahmin et. Kolay modda şarkı 5 saniye, Orta modda 3 saniye, Zor modda 1 saniye, İmkansız modda 0.5 saniye çalar. Her turda tahmin için 30 saniyen var.',
    artists: 'Öne çıkan sanatçılar',
    playlists: 'Öne çıkan çalma listeleri'
  },
  en: {
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
