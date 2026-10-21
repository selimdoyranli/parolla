const EARTH_RADIUS_KM = 6371

const toRadians = degrees => (degrees * Math.PI) / 180

/** Great-circle distance in km between two { lat, lng } points. */
export const distanceKm = (from, to) => {
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)))
}

/**
 * GeoGuessr-style exponential falloff: full points on the spot, ~37% at `scaleKm`.
 * `scaleKm` should grow with the play area so a Turkey round isn't scored like a world round.
 */
export const locationScore = ({ distance, scaleKm, maxScore }) => {
  if (distance <= 0.05) return maxScore

  return Math.round(maxScore * Math.exp(-distance / scaleKm))
}

/** Random point inside one of the boxes, picked by weight. Box: { south, west, north, east, weight } */
export const randomPointInBoxes = boxes => {
  const totalWeight = boxes.reduce((sum, box) => sum + (box.weight || 1), 0)
  let roll = Math.random() * totalWeight
  const box = boxes.find(candidate => (roll -= candidate.weight || 1) <= 0) || boxes[boxes.length - 1]

  return {
    lat: box.south + Math.random() * (box.north - box.south),
    lng: box.west + Math.random() * (box.east - box.west)
  }
}

export const formatDistance = (km, locale) => {
  if (km < 1) return `${Math.round(km * 1000)} m`

  return `${Math.round(km).toLocaleString(locale)} km`
}
