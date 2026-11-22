'use client'

// Vortex Color - Paletas, armonias, conversiones y contraste WCAG.
// 100% local: la imagen se analiza en el navegador con canvas + k-means.

import { useCallback, useRef, useState } from 'react'
import {
  Palette,
  Upload,
  Copy,
  Check,
  Pipette,
  Contrast,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import {
  contrastLevel,
  extractPalette,
  formatHsl,
  formatRgb,
  harmonies,
  hexToRgb,
  rgbToHsl,
} from '@/lib/color'

const SUPPORT_EMAIL = 'vortexmusic.soporte.app@gmail.com'

function VortexLogo({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="10" fill="#161616" />
      <circle cx="18" cy="18" r="8" fill="#fbbf24" />
      <circle cx="30" cy="18" r="8" fill="#8b5cf6" fillOpacity="0.85" />
      <circle cx="18" cy="30" r="8" fill="#34d399" fillOpacity="0.85" />
      <circle cx="30" cy="30" r="8" fill="#f87171" fillOpacity="0.85" />
    </svg>
  )
}

function Footer() {
  return (
    <footer className="w-full border-t border-[#2b2b31] bg-[#17171a] px-4 py-3 mt-auto">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-1 text-center">
        <div className="flex items-center gap-2">
          <VortexLogo className="w-5 h-5" />
          <span className="text-xs text-[#9b9ba4]">Vortex Company · Suite Vórtex · Gratis, sin anuncios, 100% local</span>
        </div>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[11px] text-[#fbbf24] hover:underline">
          Soporte: {SUPPORT_EMAIL}
        </a>
        <span className="text-[10px] text-[#6b6b74]">© 2026 Vortex Company</span>
      </div>
    </footer>
  )
}

const btn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#2b2b31] bg-[#1e1e22] px-3 py-1.5 text-xs font-medium text-[#ececf1] hover:border-[#f59e0b]/60 hover:bg-[#2b2b31] transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
const input =
  'w-full rounded-lg border border-[#2b2b31] bg-[#1e1e22] px-3 py-2 text-xs text-[#ececf1] placeholder:text-[#6b6b74] outline-none focus:border-[#8b5cf6]'

function Swatch({ hex, onCopy }: { hex: string; onCopy: (hex: string) => void }) {
  const [copied, setCopied] = useState(false)
  const hsl = rgbToHsl(hexToRgb(hex))
  return (
    <button
      className="group relative flex h-20 flex-col justify-end rounded-lg border border-[#2b2b31] overflow-hidden"
      style={{ backgroundColor: hex }}
      onClick={() => {
        onCopy(hex)
        setCopied(true)
        setTimeout(() => setCopied(false), 1400)
      }}
      title={`Copiar ${hex}`}
    >
      <span className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {copied ? <Check className="w-4 h-4 text-white drop-shadow" /> : <Copy className="w-4 h-4 text-white drop-shadow" />}
      </span>
      <span
        className="px-1.5 py-1 text-[10px] font-semibold tracking-wide"
        style={{ color: hsl.l > 55 ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.9)' }}
      >
        {hex.toUpperCase()}
      </span>
    </button>
  )
}

export default function ColorApp() {
  const [tab, setTab] = useState<'palette' | 'manual'>('palette')
  // paleta de imagen
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [k, setK] = useState(6)
  const [palette, setPalette] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [copiedAll, setCopiedAll] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  // color manual
  const [color, setColor] = useState('#8b5cf6')
  // contraste
  const [fg, setFg] = useState('#ececf1')
  const [bg, setBg] = useState('#0f0f10')
  const [copiedFg, setCopiedFg] = useState(false)
  const [copiedBg, setCopiedBg] = useState(false)

  const copyText = useCallback(async (text: string, done: () => void) => {
    try {
      await navigator.clipboard.writeText(text)
      done()
    } catch {
      // portapapeles no disponible
    }
  }, [])

  const loadImage = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return
      setBusy(true)
      setPalette([])
      const url = URL.createObjectURL(file)
      setImgUrl(url)
      const img = new Image()
      img.onload = () => {
        imgRef.current = img
        const scale = Math.min(1, 420 / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.max(1, Math.round(img.width * scale))
        c.height = Math.max(1, Math.round(img.height * scale))
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
        const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height)
        // ligera pausa para que la UI pinte el estado "analizando"
        setTimeout(() => {
          setPalette(extractPalette(data, k))
          setBusy(false)
        }, 30)
      }
      img.onerror = () => setBusy(false)
      img.src = url
    },
    [k]
  )

  const reExtract = useCallback(() => {
    const img = imgRef.current
    if (!img) return
    setBusy(true)
    const scale = Math.min(1, 420 / Math.max(img.width, img.height))
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(img.width * scale))
    c.height = Math.max(1, Math.round(img.height * scale))
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
    const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height)
    setTimeout(() => {
      setPalette(extractPalette(data, k))
      setBusy(false)
    }, 30)
  }, [k])

  const rgb = hexToRgb(color)
  const hsl = rgbToHsl(rgb)
  const cl = contrastLevel(fg, bg)
  const harmoniesList = harmonies(color)

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0f0f10] text-[#ececf1]">
      <header className="border-b border-[#2b2b31] bg-[#17171a]">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <VortexLogo className="w-8 h-8" />
          <div className="flex-1">
            <h1 className="text-base font-bold tracking-tight">Vórtex Color</h1>
            <p className="text-[11px] text-[#9b9ba4]">Tus colores, sin límites</p>
          </div>
          <span className="rounded-full border border-[#2b2b31] bg-[#1e1e22] px-2.5 py-1 text-[10px] text-[#9b9ba4]">
            100% local
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 space-y-5">
        <div className="flex gap-1.5">
          <button
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === 'palette' ? 'border-[#f59e0b] bg-[#f59e0b]/15 text-[#fbbf24]' : 'border-[#2b2b31] bg-[#1e1e22] text-[#9b9ba4] hover:border-[#f59e0b]/50'
            }`}
            onClick={() => setTab('palette')}
          >
            <Palette className="w-3.5 h-3.5" aria-hidden /> Paleta de imagen
          </button>
          <button
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === 'manual' ? 'border-[#f59e0b] bg-[#f59e0b]/15 text-[#fbbf24]' : 'border-[#2b2b31] bg-[#1e1e22] text-[#9b9ba4] hover:border-[#f59e0b]/50'
            }`}
            onClick={() => setTab('manual')}
          >
            <Pipette className="w-3.5 h-3.5" aria-hidden /> Color y armonías
          </button>
        </div>

        {tab === 'palette' && (
          <section className="rounded-xl border border-[#2b2b31] bg-[#17171a] p-4 space-y-4">
            <div
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#2b2b31] px-4 py-8 text-center cursor-pointer hover:border-[#f59e0b]/50 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const f = e.dataTransfer.files?.[0]
                if (f) loadImage(f)
              }}
            >
              <Upload className="w-8 h-8 text-[#6b6b74]" aria-hidden />
              <p className="text-xs text-[#9b9ba4]">Sube o arrastra una imagen para extraer su paleta</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) loadImage(f)
                }}
              />
            </div>
            {imgUrl && (
              <div className="flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgUrl} alt="Imagen analizada" className="max-h-56 rounded-lg border border-[#2b2b31] object-contain" />
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-[#9b9ba4]">
                    Colores
                    <input type="range" min={3} max={12} value={k} onChange={(e) => setK(Number(e.target.value))} className="accent-[#f59e0b] w-28" />
                    <span className="tabular-nums w-6 text-[#ececf1]">{k}</span>
                  </label>
                  <button className={btn} onClick={reExtract} disabled={busy}>
                    <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} aria-hidden /> Recalcular
                  </button>
                  <button className={btn} onClick={() => { setImgUrl(null); setPalette([]); imgRef.current = null }}>
                    <Trash2 className="w-3.5 h-3.5" aria-hidden /> Quitar
                  </button>
                </div>
              </div>
            )}
            {busy && <p className="text-center text-xs text-[#9b9ba4]">Analizando colores...</p>}
            {palette.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-[#9b9ba4] uppercase tracking-wider">Paleta dominante</h3>
                  <button
                    className={btn}
                    onClick={() =>
                      copyText(palette.join(', '), () => {
                        setCopiedAll(true)
                        setTimeout(() => setCopiedAll(false), 1600)
                      })
                    }
                  >
                    {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden /> : <Copy className="w-3.5 h-3.5" aria-hidden />}
                    {copiedAll ? 'Copiada' : 'Copiar paleta'}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {palette.map((hex) => (
                    <Swatch key={hex} hex={hex} onCopy={(h) => copyText(h, () => {})} />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {tab === 'manual' && (
          <section className="rounded-xl border border-[#2b2b31] bg-[#17171a] p-4 space-y-4">
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-12 w-16 cursor-pointer rounded-lg border border-[#2b2b31] bg-transparent" aria-label="Color base" />
              <div className="grid flex-1 gap-1.5 text-[11px] text-[#9b9ba4] sm:grid-cols-3">
                <button className={btn + ' justify-between'} onClick={() => copyText(color.toUpperCase(), () => {})}>
                  HEX <span className="text-[#ececf1]">{color.toUpperCase()}</span>
                </button>
                <button className={btn + ' justify-between'} onClick={() => copyText(formatRgb(rgb), () => {})}>
                  RGB <span className="text-[#ececf1]">{formatRgb(rgb)}</span>
                </button>
                <button className={btn + ' justify-between'} onClick={() => copyText(formatHsl(hsl), () => {})}>
                  HSL <span className="text-[#ececf1]">{formatHsl(hsl)}</span>
                </button>
              </div>
            </div>
            <div className="h-14 rounded-lg border border-[#2b2b31]" style={{ backgroundColor: color }} />
            <div className="space-y-3">
              {harmoniesList.map((set) => (
                <div key={set.name} className="space-y-1.5">
                  <h3 className="text-xs font-semibold text-[#9b9ba4] uppercase tracking-wider">{set.name}</h3>
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${set.colors.length}, minmax(0,1fr))` }}>
                    {set.colors.map((hex, i) => (
                      <Swatch key={set.name + i} hex={hex} onCopy={(h) => copyText(h, () => {})} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* contraste WCAG */}
        <section className="rounded-xl border border-[#2b2b31] bg-[#17171a] p-4 space-y-3">
          <h2 className="text-xs font-semibold text-[#9b9ba4] uppercase tracking-wider flex items-center gap-1.5">
            <Contrast className="w-3.5 h-3.5" aria-hidden /> Contraste WCAG
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-[#2b2b31] bg-[#1e1e22] px-3 py-2">
              <label htmlFor="wcag-fg" className="text-xs text-[#9b9ba4]">Texto</label>
              <span className="flex items-center gap-2">
                <button className="text-[10px] tabular-nums text-[#ececf1] hover:text-[#fbbf24]" onClick={() => copyText(fg.toUpperCase(), () => { setCopiedFg(true); setTimeout(() => setCopiedFg(false), 1200) })}>
                  {copiedFg ? <Check className="w-3 h-3 text-emerald-400" /> : fg.toUpperCase()}
                </button>
                <input id="wcag-fg" type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-7 w-10 cursor-pointer rounded border border-[#2b2b31] bg-transparent" />
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#2b2b31] bg-[#1e1e22] px-3 py-2">
              <label htmlFor="wcag-bg" className="text-xs text-[#9b9ba4]">Fondo</label>
              <span className="flex items-center gap-2">
                <button className="text-[10px] tabular-nums text-[#ececf1] hover:text-[#fbbf24]" onClick={() => copyText(bg.toUpperCase(), () => { setCopiedBg(true); setTimeout(() => setCopiedBg(false), 1200) })}>
                  {copiedBg ? <Check className="w-3 h-3 text-emerald-400" /> : bg.toUpperCase()}
                </button>
                <input id="wcag-bg" type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-7 w-10 cursor-pointer rounded border border-[#2b2b31] bg-transparent" />
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-[#2b2b31] p-3" style={{ backgroundColor: bg, color: fg }}>
            <p className="text-base font-semibold">Asi se lee tu combinacion</p>
            <p className="text-xs opacity-80">Texto pequeno de ejemplo para comprobar la legibilidad real.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-[#2b2b31] bg-[#1e1e22] px-2.5 py-1 tabular-nums">
              Ratio: <b className="text-[#fbbf24]">{cl.ratio.toFixed(2)}:1</b>
            </span>
            <span className={`rounded-full px-2.5 py-1 border ${cl.aaNormal ? 'border-emerald-500/50 text-emerald-400' : 'border-red-500/50 text-red-400'}`}>
              AA texto normal {cl.aaNormal ? 'OK' : 'NO'}
            </span>
            <span className={`rounded-full px-2.5 py-1 border ${cl.aaaNormal ? 'border-emerald-500/50 text-emerald-400' : 'border-red-500/50 text-red-400'}`}>
              AAA normal {cl.aaaNormal ? 'OK' : 'NO'}
            </span>
            <span className={`rounded-full px-2.5 py-1 border ${cl.aaLarge ? 'border-emerald-500/50 text-emerald-400' : 'border-red-500/50 text-red-400'}`}>
              AA texto grande {cl.aaLarge ? 'OK' : 'NO'}
            </span>
            <span className={`rounded-full px-2.5 py-1 border ${cl.aaaLarge ? 'border-emerald-500/50 text-emerald-400' : 'border-red-500/50 text-red-400'}`}>
              AAA grande {cl.aaaLarge ? 'OK' : 'NO'}
            </span>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
