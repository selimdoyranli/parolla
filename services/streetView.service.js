/**
 * Google Street View coverage lookup + keyless panorama embed.
 *
 * shortcut: uses the endpoint Google's own Maps JS client calls (no API key, CORS-allowed for any origin) —
 * it's undocumented, so if it ever breaks, swap findPanorama for google.maps.StreetViewService with a billed key.
 */
const SEARCH_URL = 'https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/SingleImageSearch'

// Image type 2 = official Google car/trekker coverage (skips user photospheres, which are mostly indoors)
const OFFICIAL_COVERAGE = 2

const buildSearchBody = ({ lat, lng, radius }) => [
  ['apiv3', null, null, null, 'US', null, null, null, null, null, [[false]]],
  [[null, null, lat, lng], radius],
  [
    [null, null, null, null, null, null, null, null, null, null, [null, null]],
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    [2],
    null,
    [[[OFFICIAL_COVERAGE, true, 2]]]
  ],
  [[2, 6]]
]

/**
 * Nearest official panorama within `radius` metres of the point.
 * @returns {Promise<{ panoId: string, lat: number, lng: number, heading: number, country: string|null } | null>}
 */
export const findPanorama = async ({ lat, lng, radius = 50000 }) => {
  try {
    const response = await fetch(SEARCH_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json+protobuf', 'x-user-agent': 'grpc-web-javascript/0.1' },
      body: JSON.stringify(buildSearchBody({ lat, lng, radius }))
    })
    const body = await response.json()
    const [type, panoId] = body?.[1]?.[1] || []
    const location = body?.[1]?.[5]?.[0]?.[1]

    if (type !== OFFICIAL_COVERAGE || !panoId || !location?.[0]) return null

    return {
      panoId,
      lat: location[0][2],
      lng: location[0][3],
      heading: location[2]?.[0] || 0,
      country: location[4] || null
    }
  } catch (error) {
    return null
  }
}

export const buildPanoramaEmbedUrl = ({ panoId, heading = 0 }) =>
  `https://www.google.com/maps?layer=c&panoid=${encodeURIComponent(panoId)}&cbp=12,${Math.round(heading)},0,0,0&output=svembed`
