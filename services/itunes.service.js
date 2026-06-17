import { artistTransformer, songTransformer } from '@/transformers/music.transformer'
import { searchArtists as searchArtistsFromCf } from '@/services/music.service'

const ITUNES_BASE = 'https://itunes.apple.com'

const isMobile = () => /Android|iPhone|iPad|iPod|Mobile|webOS/i.test(navigator.userAgent)

const fetchJson = async url => {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      return {
        data: null,
        error: new Error(`Request failed with status ${response.status}`)
      }
    }

    const json = await response.json()

    return { data: json, error: null }
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown fetch error')

    return { data: null, error }
  }
}

const itunesSearch = params => `${ITUNES_BASE}/search?${params}`

const itunesLookup = params => `${ITUNES_BASE}/lookup?${params}`

// Mobile browsers can't reach itunes.apple.com/search reliably, so on mobile we
// search artists via the Apple Music AMP worker instead. The AMP catalog artist
// id equals the iTunes artistId, so fetchSongs' /lookup keeps working unchanged.
const fetchArtistsFromAmp = async ({ term, locale }) => {
  const { data, error } = await searchArtistsFromCf(term, locale)

  if (error) {
    return { data: [], meta: {}, error: error instanceof Error ? error : new Error(String(error)) }
  }

  const transformedArtists = (data || []).map(artist => ({
    artistId: artist.artistId,
    artistName: artist.artistName,
    artwork: artist.artworkUrl ? { artworkUrl: artist.artworkUrl } : null
  }))

  return { data: transformedArtists, meta: { total: transformedArtists.length }, error: null }
}

export const fetchArtists = async ({ term, limit = 50, locale }) => {
  if (isMobile()) {
    return fetchArtistsFromAmp({ term, locale })
  }

  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 200) : 50
  const encodedTerm = encodeURIComponent(term)

  const [artistResult, albumResult] = await Promise.all([
    fetchJson(itunesSearch(`term=${encodedTerm}&media=music&entity=musicArtist&limit=${safeLimit}`)),
    fetchJson(itunesSearch(`term=${encodedTerm}&entity=album&limit=200`))
  ])

  if (artistResult.error || !artistResult.data?.results) {
    return { data: [], meta: { limit: safeLimit }, error: artistResult.error || new Error('Unable to fetch artists') }
  }

  const artworkByArtistId = new Map()

  if (albumResult.data?.results) {
    const albums = albumResult.data.results.filter(r => r.wrapperType === 'collection')

    for (const album of albums) {
      const id = album.artistId
      const existing = artworkByArtistId.get(id)

      if (!existing || (album.trackCount || 0) > (existing.trackCount || 0)) {
        artworkByArtistId.set(id, {
          artworkUrl: album.artworkUrl100 || null,
          collectionName: album.collectionName || null,
          releaseDate: album.releaseDate || null,
          trackCount: album.trackCount || null
        })
      }
    }
  }

  const transformedArtists = artistResult.data.results.map(artist => ({
    ...artistTransformer(artist),
    artwork: artworkByArtistId.get(artist.artistId) || null
  }))

  return {
    data: transformedArtists,
    meta: { limit: safeLimit },
    error: null
  }
}

const MAX_ALBUM_FALLBACK = 3

const deduplicateTracks = (tracks, limit) => {
  const uniqueTracks = []
  const seen = new Set()
  const trackNamesSeen = new Set()

  for (const track of tracks) {
    if (uniqueTracks.length >= limit) break

    const key =
      typeof track.trackId === 'number' || typeof track.trackId === 'string' ? track.trackId : `${track.trackName}-${track.artistId}`

    if (track.trackName && trackNamesSeen.has(track.trackName)) continue

    if (seen.has(key)) continue

    seen.add(key)

    if (track.trackName) trackNamesSeen.add(track.trackName)
    uniqueTracks.push(track)
  }

  return { uniqueTracks, seen, trackNamesSeen }
}

export const fetchSongs = async ({ artistIds, perArtistLimit = 10 }) => {
  const safePerArtistLimit = Number.isFinite(perArtistLimit) && perArtistLimit > 0 ? Math.min(Math.floor(perArtistLimit), 50) : 10

  const results = await Promise.all(
    artistIds.map(async artistId => {
      const targetArtistIdNum = Number(artistId)

      const { data: directData, error: directError } = await fetchJson(
        itunesLookup(`id=${encodeURIComponent(artistId)}&entity=song&limit=200`)
      )

      if (!directData?.results) {
        return {
          data: [],
          error: directError,
          artist: { artistId: targetArtistIdNum, artistName: null, artworkUrl100: null }
        }
      }

      const artistInfo = directData.results.find(r => r.wrapperType === 'artist')

      const directTracks = directData.results.filter(r => r.wrapperType === 'track').map(song => songTransformer(song))

      let { uniqueTracks, seen, trackNamesSeen } = deduplicateTracks(directTracks, safePerArtistLimit)

      if (uniqueTracks.length < safePerArtistLimit) {
        const { data: albumsData } = await fetchJson(itunesLookup(`id=${encodeURIComponent(artistId)}&entity=album&limit=50`))

        if (albumsData?.results) {
          const albums = albumsData.results
            .filter(r => r.wrapperType === 'collection' && (r.artistId === targetArtistIdNum || String(r.artistId) === String(artistId)))
            .sort((a, b) => (b.trackCount || 0) - (a.trackCount || 0))
            .slice(0, MAX_ALBUM_FALLBACK)

          const albumSongs = await Promise.all(
            albums.map(async album => {
              const { data: songsData } = await fetchJson(itunesLookup(`id=${album.collectionId}&entity=song&limit=200`))

              if (!songsData?.results) return []

              return songsData.results.filter(s => s.wrapperType === 'track').map(s => songTransformer(s))
            })
          )

          for (const track of albumSongs.flat()) {
            if (uniqueTracks.length >= safePerArtistLimit) break

            const key =
              typeof track.trackId === 'number' || typeof track.trackId === 'string'
                ? track.trackId
                : `${track.trackName}-${track.artistId}`

            if (track.trackName && trackNamesSeen.has(track.trackName)) continue

            if (seen.has(key)) continue

            seen.add(key)

            if (track.trackName) trackNamesSeen.add(track.trackName)
            uniqueTracks.push(track)
          }
        }
      }

      return {
        data: uniqueTracks.slice(0, safePerArtistLimit),
        error: directError,
        artist: {
          artistId: targetArtistIdNum,
          artistName: artistInfo?.artistName || directTracks[0]?.artistName || null,
          artworkUrl100: directTracks[0]?.artworkUrl100 || null
        }
      }
    })
  )

  const mergedSongs = results.flatMap(r => r.data || [])
  const firstError = results.find(r => r.error)?.error || null
  const artistsMeta = results.map(r => r.artist).filter(Boolean)

  return {
    data: mergedSongs,
    error: firstError ? firstError.message : null,
    meta: {
      perArtistLimit: safePerArtistLimit,
      artistIds,
      total: mergedSongs.length,
      artists: artistsMeta
    }
  }
}
