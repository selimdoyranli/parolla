// Self-check for helpers/geo.js — run: node scripts/geo-selfcheck.mjs
import assert from 'node:assert'
import { distanceKm, locationScore, randomPointInBoxes, formatDistance } from '../helpers/geo.js'

const istanbul = { lat: 41.0082, lng: 28.9784 }
const ankara = { lat: 39.9334, lng: 32.8597 }

assert.ok(Math.abs(distanceKm(istanbul, ankara) - 350) < 5, 'Istanbul–Ankara ≈ 350 km')
assert.strictEqual(distanceKm(istanbul, istanbul), 0)
assert.strictEqual(locationScore({ distance: 0, scaleKm: 2000, maxScore: 5000 }), 5000)
assert.strictEqual(locationScore({ distance: 2000, scaleKm: 2000, maxScore: 5000 }), Math.round(5000 / Math.E))
assert.ok(locationScore({ distance: 20000, scaleKm: 2000, maxScore: 5000 }) < 1)

const boxes = [{ south: 10, west: 20, north: 11, east: 21, weight: 1 }]

for (let i = 0; i < 100; i += 1) {
  const point = randomPointInBoxes(boxes)
  assert.ok(point.lat >= 10 && point.lat <= 11 && point.lng >= 20 && point.lng <= 21)
}

assert.strictEqual(formatDistance(0.25, 'tr'), '250 m')
console.log('geo self-check ok')
