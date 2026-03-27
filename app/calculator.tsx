'use client'

import { useState } from 'react'

const LETTER_ROWS_WITH_OP: [string[], string][] = [
  [['A', 'B', 'C'], '−'],
  [['D', 'E', 'F'], '+'],
  [['G', 'H', 'I'], '÷'],
]

const LETTER_ROWS_PLAIN: string[][] = [
  ['J', 'K', 'L', 'M'],
  ['N', 'O', 'P', 'Q'],
  ['R', 'S', 'T', 'U'],
  ['V', 'W', 'X', 'Y'],
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
    // Wrapper constrains both the calculator and the share button to the same width
    <div style={{ width: '100%', maxWidth: '440px' }}>

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

          {/* Row 1 — C = / × */}
          <div className="key-row">
            <button className="key util-key" onClick={handleClear}>C</button>
            <button className="key equals-key" onClick={handleEquals} disabled={finalized}>=</button>
            <button className="key util-key" onClick={() => append('/')} disabled={finalized}>/</button>
            <button className="key util-key" onClick={() => append('×')} disabled={finalized}>×</button>
          </div>

          {/* Rows 2–4 — 3 letters + operator */}
          {LETTER_ROWS_WITH_OP.map(([letters, op]) => (
            <div key={letters[0]} className="key-row">
              {letters.map(l => (
                <button key={l} className="key letter-key" onClick={() => append(l)} disabled={finalized}>
                  {l}
                </button>
              ))}
              <button className="key op-key" onClick={() => append(op)} disabled={finalized}>
                {op}
              </button>
            </div>
          ))}

          {/* Rows 5–8 — 4 letters */}
          {LETTER_ROWS_PLAIN.map(row => (
            <div key={row[0]} className="key-row">
              {row.map(l => (
                <button key={l} className="key letter-key" onClick={() => append(l)} disabled={finalized}>
                  {l}
                </button>
              ))}
            </div>
          ))}

          {/* Row 9 — SPACE(wide) Z 💕 */}
          <div className="key-row">
            <button className="key space-key" onClick={() => append(' ')} disabled={finalized}>
              SPACE
            </button>
            <button className="key letter-key" onClick={() => append('Z')} disabled={finalized}>
              Z
            </button>
            <button className="key heart-key" onClick={() => append('💕')} disabled={finalized}>
              💕
            </button>
          </div>

        </div>
      </div>

      {/* ── 3. SHARE BUTTON — outside the calculator body ── */}
      <button
        className="share-btn"
        onClick={handleSend}
        disabled={!input.trim()}
      >
        SEND 💕
      </button>

    </div>
  )
}
