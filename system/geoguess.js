// GeoGuess game rules + play areas. Boxes are rough rectangles over well-covered Street View areas;
// a random point inside one is snapped to the nearest official panorama within `searchRadius` metres.
export const GEOGUESS_TOTAL_ROUNDS = 5
export const GEOGUESS_MAX_ROUND_SCORE = 5000
export const GEOGUESS_PANORAMA_ATTEMPTS = 12

export const GEOGUESS_REGIONS = Object.freeze([
  {
    key: 'world',
    icon: 'noto:globe-showing-europe-africa',
    scaleKm: 2000,
    searchRadius: 50000,
    view: { center: [25, 10], zoom: 1 },
    boxes: [
      { south: 36, west: -10, north: 59, east: 30, weight: 6 }, // Europe
      { south: 30, west: -123, north: 48, east: -75, weight: 5 }, // United States
      { south: 43, west: -123, north: 53, east: -63, weight: 2 }, // Canada (south)
      { south: 15, west: -105, north: 27, east: -88, weight: 1 }, // Mexico
      { south: -30, west: -55, north: -5, east: -36, weight: 2 }, // Brazil
      { south: -45, west: -72, north: -25, east: -58, weight: 1 }, // Argentina + Chile
      { south: -34, west: 18, north: -23, east: 32, weight: 1 }, // South Africa
      { south: 36, west: 26, north: 42, east: 44, weight: 2 }, // Turkey
      { south: 31, west: 130, north: 43, east: 142, weight: 2 }, // Japan
      { south: 34.5, west: 126.5, north: 38, east: 129.5, weight: 1 }, // South Korea
      { south: 6, west: 98, north: 19, east: 104, weight: 1 }, // Thailand + Malaysia
      { south: -8, west: 105, north: -6, east: 114, weight: 1 }, // Java
      { south: -38, west: 140, north: -27, east: 153, weight: 2 }, // Australia (east)
      { south: -46, west: 168, north: -36, east: 178, weight: 1 }, // New Zealand
      { south: 50, west: 30, north: 57, east: 45, weight: 1 } // Russia (west)
    ]
  },
  {
    key: 'europe',
    icon: 'noto:castle',
    scaleKm: 800,
    searchRadius: 30000,
    view: { center: [50, 12], zoom: 3 },
    boxes: [
      { south: 43, west: -9, north: 51, east: 7, weight: 3 }, // France + Iberia north
      { south: 37, west: -9, north: 43, east: 3, weight: 2 }, // Iberia
      { south: 47, west: 6, north: 55, east: 15, weight: 3 }, // Germany + Benelux
      { south: 50, west: -6, north: 58, east: 2, weight: 2 }, // Great Britain
      { south: 38, west: 8, north: 46, east: 18, weight: 2 }, // Italy
      { south: 45, west: 14, north: 54, east: 26, weight: 2 }, // Central Europe
      { south: 55, west: 8, north: 64, east: 25, weight: 2 }, // Nordics
      { south: 37, west: 20, north: 45, east: 29, weight: 1 } // Balkans + Greece
    ]
  },
  {
    key: 'turkey',
    icon: 'twemoji:flag-turkey',
    scaleKm: 300,
    searchRadius: 20000,
    // Turkey's box also covers its neighbours — panoramas from other countries are thrown away
    country: 'TR',
    view: { center: [39, 35], zoom: 5 },
    boxes: [{ south: 36, west: 26, north: 42, east: 44.8, weight: 1 }]
  }
])
