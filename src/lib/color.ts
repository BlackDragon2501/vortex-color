// Utilidades de color: conversiones HEX/RGB/HSL, extraccion de paletas por
// k-means sobre el canvas, armonias cromaticas y contraste WCAG.
// Todo se calcula localmente en el navegador.

export interface Rgb {
  r: number
  g: number
  b: number
}

export interface Hsl {
  h: number
  s: number
  l: number
}

export function hexToRgb(hex: string): Rgb {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return { r: 0, g: 0, b: 0 }
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const l = (max + min) / 2
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const hn = ((h % 360) + 360) % 360 / 360
  const sn = s / 100
  const ln = l / 100
  if (sn === 0) {
    const v = Math.round(ln * 255)
    return { r: v, g: v, b: v }
  }
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn
  const p = 2 * ln - q
  const f = (t: number) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }
  return {
    r: Math.round(f(hn + 1 / 3) * 255),
    g: Math.round(f(hn) * 255),
    b: Math.round(f(hn - 1 / 3) * 255),
  }
}

export function hslToHex(hsl: Hsl): string {
  return rgbToHex(hslToRgb(hsl))
}

export function shiftHue(hex: string, deg: number): string {
  const hsl = rgbToHsl(hexToRgb(hex))
  return hslToHex({ ...hsl, h: (hsl.h + deg + 360) % 360 })
}

export function adjustL(hex: string, delta: number): string {
  const hsl = rgbToHsl(hexToRgb(hex))
  return hslToHex({ ...hsl, l: Math.max(0, Math.min(100, hsl.l + delta)) })
}

export interface HarmonySet {
  name: string
  colors: string[]
}

export function harmonies(hex: string): HarmonySet[] {
  return [
    { name: 'Complementario', colors: [hex, shiftHue(hex, 180)] },
    { name: 'Analogos', colors: [shiftHue(hex, -30), hex, shiftHue(hex, 30)] },
    { name: 'Triada', colors: [hex, shiftHue(hex, 120), shiftHue(hex, 240)] },
    { name: 'Tetradica', colors: [hex, shiftHue(hex, 90), shiftHue(hex, 180), shiftHue(hex, 270)] },
    {
      name: 'Tonos',
      colors: [adjustL(hex, -32), adjustL(hex, -16), hex, adjustL(hex, 14), adjustL(hex, 28)],
    },
  ]
}

// ---------------------------------------------------------------- contraste

function srgbChannel(v: number): number {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function luminance({ r, g, b }: Rgb): number {
  return 0.2126 * srgbChannel(r) + 0.7152 * srgbChannel(g) + 0.0722 * srgbChannel(b)
}

/** ratio de contraste WCAG 2.1 entre dos colores (1 a 21) */
export function contrastRatio(hexA: string, hexB: string): number {
  const la = luminance(hexToRgb(hexA))
  const lb = luminance(hexToRgb(hexB))
  const hi = Math.max(la, lb)
  const lo = Math.min(la, lb)
  return (hi + 0.05) / (lo + 0.05)
}

export interface ContrastLevel {
  ratio: number
  aaNormal: boolean
  aaaNormal: boolean
  aaLarge: boolean
  aaaLarge: boolean
}

export function contrastLevel(hexA: string, hexB: string): ContrastLevel {
  const ratio = contrastRatio(hexA, hexB)
  return {
    ratio,
    aaNormal: ratio >= 4.5,
    aaaNormal: ratio >= 7,
    aaLarge: ratio >= 3,
    aaaLarge: ratio >= 4.5,
  }
}

// ---------------------------------------------------------------- paleta

/**
 * Extrae una paleta de k colores de una imagen (ImageData) con k-means
 * ligero: muestreo uniforme de pixeles + 10 iteraciones. Colores resultantes
 * ordenados por peso del cluster (dominantes primero).
 */
export function extractPalette(img: ImageData, k: number): string[] {
  const d = img.data
  const samples: Rgb[] = []
  const stride = Math.max(1, Math.floor((d.length / 4) / 12000)) // ~12k muestras max
  for (let i = 0; i < d.length / 4; i += stride) {
    if (d[i * 4 + 3] < 128) continue
    samples.push({ r: d[i * 4], g: d[i * 4 + 1], b: d[i * 4 + 2] })
  }
  if (!samples.length) return []

  // semillas: k colores repartidos por la lista de muestras
  let centers: Rgb[] = []
  for (let i = 0; i < k; i++) {
    centers.push(samples[Math.floor((i * samples.length) / k)])
  }
  const assign = new Int32Array(samples.length)
  for (let it = 0; it < 10; it++) {
    // asignacion al centro mas cercano
    for (let s = 0; s < samples.length; s++) {
      let best = 0
      let bestD = Infinity
      for (let c = 0; c < centers.length; c++) {
        const dr = samples[s].r - centers[c].r
        const dg = samples[s].g - centers[c].g
        const db = samples[s].b - centers[c].b
        const dist = dr * dr + dg * dg + db * db
        if (dist < bestD) {
          bestD = dist
          best = c
        }
      }
      assign[s] = best
    }
    // recalcular centros
    const sums = centers.map(() => ({ r: 0, g: 0, b: 0, n: 0 }))
    for (let s = 0; s < samples.length; s++) {
      const a = assign[s]
      sums[a].r += samples[s].r
      sums[a].g += samples[s].g
      sums[a].b += samples[s].b
      sums[a].n++
    }
    centers = centers.map((c, i) => (sums[i].n > 0 ? { r: sums[i].r / sums[i].n, g: sums[i].g / sums[i].n, b: sums[i].b / sums[i].n } : c))
  }
  // ordena clusters por tamano (dominantes primero) y devuelve hex
  const counts = centers.map(() => 0)
  for (let s = 0; s < samples.length; s++) counts[assign[s]]++
  return centers
    .map((c, i) => ({ hex: rgbToHex(c), n: counts[i] }))
    .sort((a, b) => b.n - a.n)
    .map((x) => x.hex)
}

export function formatRgb({ r, g, b }: Rgb): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
}

export function formatHsl(hsl: Hsl): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
}
