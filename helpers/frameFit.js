// Lays out a 9-slice profile frame sprite (static/cosmetics/**/profile_frame--*.9.svg, slices in frames.json) in a card.
// Chrome draws SVG border-image tiles with anti-aliased edges, so any tile edge off the pixel grid shows a hairline seam.
// The art is drawn at a fixed half scale (all slices are even, so every corner and tile is whole px), the box holds a
// whole number of edge tiles and sits on whole px: it is up to one tile smaller than the card, centred.
const SCALE = 0.5

export function fitFrame(s, width, height) {
  const [t, r, b, l, tu, tv] = [s.t, s.r, s.b, s.l, s.u, s.v].map(n => n * SCALE)
  const w = l + r + Math.max(1, Math.floor((width - l - r) / tu)) * tu
  const h = t + b + Math.max(1, Math.floor((height - t - b) / tv)) * tv

  return { w, h, x: Math.floor((width - w) / 2), y: Math.floor((height - h) / 2), t, r, b, l }
}
