'use client'

import { useState, useRef } from 'react'
import html2canvas from 'html2canvas'

const LETTER_ROWS: string[][] = [
  ['Q', 'W', 'E', 'R', 'T'],
  ['Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G'],
  ['H', 'J', 'K', 'L', 'X'],
  ['C', 'V', 'B', 'N', 'M'],
]

export default function Calculator() {
  const [input, setInput] = useState('')
  const [finalized, setFinalized] = useState(false)
  const calcRef = useRef<HTMLDivElement>(null)

  function append(char: string) {
    if (finalized) return
    setInput(prev => prev + char)
  }

  function handleEquals() {
    if (!input.trim() || finalized) return
    setFinalized(true)
  }

  function handleClear() {
    setInput('')
    setFinalized(false)
  }

  async function handleSend() {
    if (!calcRef.current) return

    const wrapRect = calcRef.current.getBoundingClientRect()
    const SCALE    = 2

    // Snapshot an element's canvas-draw data from the live DOM.
    // centerX/Y are relative to the calc-wrap top-left.
    function snap(el: HTMLElement) {
      const r  = el.getBoundingClientRect()
      const cs = window.getComputedStyle(el)
      return {
        text:          el.textContent ?? '',
        centerX:       r.left - wrapRect.left + r.width  / 2,
        centerY:       r.top  - wrapRect.top  + r.height / 2,
        fontSize:      parseFloat(cs.fontSize),
        fontFamily:    cs.fontFamily,
        fontWeight:    cs.fontWeight,
        letterSpacing: cs.letterSpacing,  // browser resolves em→px for us
        color:         cs.color,
      }
    }

    // ── 1. Capture every element we will draw manually ────────────────────

    // Button labels (center of the button = where the glyph midpoint should land)
    const keyData = Array.from(
      calcRef.current.querySelectorAll<HTMLElement>('.key')
    ).map(btn => {
      const span = btn.querySelector<HTMLElement>(':scope > span')
      const r    = btn.getBoundingClientRect()
      const cs   = window.getComputedStyle(btn)
      return {
        ...snap(btn),
        text:    span?.textContent ?? '',
        opacity: parseFloat(cs.opacity),
        // Override centerX/Y with the BUTTON centre (not snap(btn) which uses btn's own text centroid)
        centerX: r.left - wrapRect.left + r.width  / 2,
        centerY: r.top  - wrapRect.top  + r.height / 2,
      }
    })

    // Title-bar icon: white 17×17 border box
    const tbIconEl = calcRef.current.querySelector<HTMLElement>('.tb-icon')
    const tbIconR  = tbIconEl?.getBoundingClientRect()
    const iconData = tbIconR ? {
      x: tbIconR.left - wrapRect.left,
      y: tbIconR.top  - wrapRect.top,
      w: tbIconR.width,
      h: tbIconR.height,
    } : null

    // Title-bar "NoteMath" text
    const tbTitleEl = calcRef.current.querySelector<HTMLElement>('.tb-title')
    const titleData = tbTitleEl ? snap(tbTitleEl) : null

    // Display text (the input span, right-aligned inside the display box)
    const displaySpan = calcRef.current.querySelector<HTMLElement>('.calc-display > span')
    const displayData = displaySpan ? snap(displaySpan) : null

    // ── 2. Render calculator chrome; suppress everything we paint manually ──
    // html2canvas does not support flex `align-items:center`, so title and
    // display text land at the wrong vertical position.  We hide them here
    // and repaint them with exact live-DOM coordinates.
    const h2cCanvas = await html2canvas(calcRef.current, {
      scale: SCALE,
      useCORS: true,
      logging: false,
      onclone: (_doc, clonedEl) => {
        const hide = (sel: string) => {
          clonedEl.querySelectorAll<HTMLElement>(sel).forEach(el => {
            el.style.visibility = 'hidden'
          })
        }
        hide('.key > span')        // button labels
        hide('.tb-icon')           // title-bar checkbox icon
        hide('.tb-title')          // "NoteMath" text
        hide('.calc-display span') // display text
      },
    })

    // ── 3. Composite onto a fresh canvas (clean identity transform) ────────
    // html2canvas leaves scale(2,2)+translate active on its own context;
    // a new canvas gives us a predictable coordinate system.
    await document.fonts.ready
    const canvas = document.createElement('canvas')
    canvas.width  = h2cCanvas.width
    canvas.height = h2cCanvas.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(h2cCanvas, 0, 0)

    // Helper: set letter-spacing (Canvas 2D Level 2, available in modern browsers)
    function applyLS(ls: string) {
      const px = parseFloat(ls)
      if ('letterSpacing' in ctx && !isNaN(px)) {
        (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
          `${px * SCALE}px`
      }
    }

    // ── 4. Draw button labels ─────────────────────────────────────────────
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    for (const k of keyData) {
      if (!k.text) continue
      ctx.save()
      ctx.font        = `${k.fontWeight} ${k.fontSize * SCALE}px ${k.fontFamily}`
      ctx.fillStyle   = k.color
      ctx.globalAlpha = k.opacity
      applyLS(k.letterSpacing)
      ctx.fillText(k.text, k.centerX * SCALE, k.centerY * SCALE)
      ctx.restore()
    }

    // ── 5. Draw title-bar icon (white border rectangle) ───────────────────
    if (iconData) {
      const bw = 2.5  // matches .tb-icon border-width
      ctx.save()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth   = bw * SCALE
      // strokeRect centres the line on the path; offset inward by bw/2 to keep
      // the stroke inside the element bounds (matching CSS box-sizing:border-box)
      ctx.strokeRect(
        (iconData.x + bw / 2) * SCALE,
        (iconData.y + bw / 2) * SCALE,
        (iconData.w - bw)     * SCALE,
        (iconData.h - bw)     * SCALE,
      )
      ctx.restore()
    }

    // ── 6. Draw "NoteMath" title text (with its pink glow) ────────────────
    if (titleData) {
      ctx.save()
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.font         = `${titleData.fontWeight} ${titleData.fontSize * SCALE}px ${titleData.fontFamily}`
      ctx.fillStyle    = titleData.color
      applyLS(titleData.letterSpacing)
      // Outer glow (wider, dimmer) — matches CSS text-shadow layer 2
      ctx.shadowColor = 'rgba(255, 26, 114, 0.3)'
      ctx.shadowBlur  = 14 * SCALE
      ctx.fillText(titleData.text, titleData.centerX * SCALE, titleData.centerY * SCALE)
      // Inner glow + fill (tighter, brighter) — matches CSS text-shadow layer 1
      ctx.shadowColor = 'rgba(255, 26, 114, 0.7)'
      ctx.shadowBlur  = 6 * SCALE
      ctx.fillText(titleData.text, titleData.centerX * SCALE, titleData.centerY * SCALE)
      ctx.restore()
    }

    // ── 7. Draw display text ──────────────────────────────────────────────
    if (displayData?.text) {
      ctx.save()
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.font         = `${displayData.fontWeight} ${displayData.fontSize * SCALE}px ${displayData.fontFamily}`
      ctx.fillStyle    = displayData.color
      applyLS(displayData.letterSpacing)
      ctx.fillText(displayData.text, displayData.centerX * SCALE, displayData.centerY * SCALE)
      ctx.restore()
    }

    const link = document.createElement('a')
    link.download = 'notemath.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div style={{ width: '100%', maxWidth: '420px' }}>

      {/* ── Calculator window ──────────────────────────── */}
      <div className="calc-wrap" ref={calcRef}>

        {/* Title bar */}
        <div className="calc-titlebar">
          <span className="tb-icon" aria-hidden="true" />
          <span className="tb-title">NoteMath</span>
        </div>

        <div className="calc-body">

          {/* Display */}
          <div className="calc-display">
            {input
              ? <span>{input}</span>
              : <span className="display-zero">0</span>
            }
          </div>

          {/* Row 1 — C = + − × */}
          <div className="key-row">
            <button className="key util-key" onClick={handleClear}><span>C</span></button>
            <button className="key op-key" onClick={handleEquals} disabled={finalized}><span>=</span></button>
            <button className="key op-key" onClick={() => append('+')} disabled={finalized}><span>+</span></button>
            <button className="key op-key" onClick={() => append('−')} disabled={finalized}><span>−</span></button>
            <button className="key op-key" onClick={() => append('×')} disabled={finalized}><span>×</span></button>
          </div>

          {/* Rows 2–6 — 5 letters each, A–Y */}
          {LETTER_ROWS.map(row => (
            <div key={row[0]} className="key-row">
              {row.map(l => (
                <button key={l} className="key letter-key" onClick={() => append(l)} disabled={finalized}>
                  <span>{l}</span>
                </button>
              ))}
            </div>
          ))}

          {/* Row 7 — SPACE spans cols 1–3, Z=col 4, 💕=col 5 */}
          <div className="key-row bottom-row">
            <button className="key space-key" onClick={() => append(' ')} disabled={finalized}>
              <span>SPACE</span>
            </button>
            <button className="key letter-key" onClick={() => append('Z')} disabled={finalized}>
              <span>Z</span>
            </button>
            <button className="key letter-key" onClick={() => append('💕')} disabled={finalized}>
              <span>💕</span>
            </button>
          </div>

        </div>
      </div>

      {/* ── SEND BUTTON — outside the calculator body ── */}
      <button
        className="share-btn"
        onClick={handleSend}
        disabled={!input.trim()}
      >
        SEND
      </button>

    </div>
  )
}
