const FALLBACK_PRIMARY = '64b5f6'

export function buildBannerStyle(diceBearConfig) {
  const cfg = diceBearConfig || {}
  const colors = Array.isArray(cfg.backgroundColor) && cfg.backgroundColor.length ? cfg.backgroundColor : [FALLBACK_PRIMARY]

  const a = normalizeHex(colors[0]) || '#' + FALLBACK_PRIMARY
  const b = colors[1] ? normalizeHex(colors[1]) : shiftHue(a, 40)
  const angle = computeAngle(cfg.seed || colors[0])

  return { background: `linear-gradient(${angle}deg, ${a} 0%, ${b} 100%)` }
}

function normalizeHex(value) {
  if (!value || typeof value !== 'string') return null
  const stripped = value.replace(/^#/, '')

  if (!/^[0-9a-fA-F]{3,8}$/.test(stripped)) return null

  return '#' + stripped
}

function computeAngle(seed) {
  const s = String(seed || '')
  let h = 0

  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0

  return ((h % 360) + 360) % 360
}

function shiftHue(hex, deg) {
  const { r, g, b } = hexToRgb(hex)
  const { h, s, l } = rgbToHsl(r, g, b)
  const nh = (h + deg / 360 + 1) % 1
  const { r: nr, g: ng, b: nb } = hslToRgb(nh, s, l)

  return rgbToHex(nr, ng, nb)
}

function hexToRgb(hex) {
  const s = hex.replace(/^#/, '')
  const v =
    s.length === 3
      ? s
          .split('')
          .map(c => c + c)
          .join('')
      : s.slice(0, 6)

  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16)
  }
}

function rgbToHex(r, g, b) {
  const c = n =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0')

  return '#' + c(r) + c(g) + c(b)
}

function rgbToHsl(r, g, b) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn),
    min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0,
    s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
        break
      case gn:
        h = ((bn - rn) / d + 2) / 6
        break
      case bn:
        h = ((rn - gn) / d + 4) / 6
        break
    }
  }

  return { h, s, l }
}

function hslToRgb(h, s, l) {
  if (s === 0) return { r: l * 255, g: l * 255, b: l * 255 }
  const hue2rgb = (p, q, t) => {
    let nt = t

    if (nt < 0) nt += 1

    if (nt > 1) nt -= 1

    if (nt < 1 / 6) return p + (q - p) * 6 * nt

    if (nt < 1 / 2) return q

    if (nt < 2 / 3) return p + (q - p) * (2 / 3 - nt) * 6

    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q

  return {
    r: hue2rgb(p, q, h + 1 / 3) * 255,
    g: hue2rgb(p, q, h) * 255,
    b: hue2rgb(p, q, h - 1 / 3) * 255
  }
}
