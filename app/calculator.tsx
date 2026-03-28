'use client'

import { useState } from 'react'

const LETTER_ROWS: string[][] = [
  ['A', 'B', 'C', 'D', 'E'],
  ['F', 'G', 'H', 'I', 'J'],
  ['K', 'L', 'M', 'N', 'O'],
  ['P', 'Q', 'R', 'S', 'T'],
  ['U', 'V', 'W', 'X', 'Y'],
]

export default function Calculator() {
  const [input, setInput] = useState('')
  const [finalized, setFinalized] = useState(false)

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

  function handleSend() {
    window.location.href = `sms:?body=${encodeURIComponent(input)}`
  }

  return (
    <div style={{ width: '100%', maxWidth: '420px' }}>

      {/* ── Calculator window ──────────────────────────── */}
      <div className="calc-wrap">

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
            <button className="key util-key" onClick={handleClear}>C</button>
            <button className="key equals-key" onClick={handleEquals} disabled={finalized}>=</button>
            <button className="key op-key" onClick={() => append('+')} disabled={finalized}>+</button>
            <button className="key op-key" onClick={() => append('−')} disabled={finalized}>−</button>
            <button className="key op-key" onClick={() => append('×')} disabled={finalized}>×</button>
          </div>

          {/* Rows 2–6 — 5 letters each, A–Y */}
          {LETTER_ROWS.map(row => (
            <div key={row[0]} className="key-row">
              {row.map(l => (
                <button key={l} className="key letter-key" onClick={() => append(l)} disabled={finalized}>
                  {l}
                </button>
              ))}
            </div>
          ))}

          {/* Row 7 — SPACE(×3) Z 💕 → fills 5 flex units */}
          <div className="key-row">
            <button className="key space-key" onClick={() => append(' ')} disabled={finalized}>
              SPACE
            </button>
            <button className="key letter-key" onClick={() => append('Z')} disabled={finalized}>
              Z
            </button>
            <button className="key letter-key" onClick={() => append('💕')} disabled={finalized}>
              💕
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
