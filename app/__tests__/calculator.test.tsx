import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Calculator from '../calculator'

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn(() =>
    Promise.resolve({ toDataURL: () => 'data:image/png;base64,mock' })
  ),
}))

function setup() {
  const user = userEvent.setup()
  const utils = render(<Calculator />)
  return { user, ...utils }
}

/** Returns the display element so we can scope assertions to it. */
function getDisplay(): HTMLElement {
  return document.querySelector('.calc-display') as HTMLElement
}

/**
 * The clear button has class "util-key"; the letter C button has "letter-key".
 * Both have accessible name 'C' — the clear button is first in DOM order.
 */
function getClearButton(): HTMLElement {
  return screen.getAllByRole('button', { name: 'C' })[0]
}

// ─── Initial render ────────────────────────────────────────────────────────

describe('initial render', () => {
  it('shows placeholder zero in display', () => {
    setup()
    expect(within(getDisplay()).getByText('0')).toBeInTheDocument()
  })

  it('SEND button is disabled when display is empty', () => {
    setup()
    expect(screen.getByRole('button', { name: 'SEND' })).toBeDisabled()
  })

  it('equals button is enabled', () => {
    setup()
    expect(screen.getByRole('button', { name: '=' })).toBeEnabled()
  })

  it('renders all 26 letter buttons', () => {
    setup()
    const letters = 'ABDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    for (const letter of letters) {
      expect(
        screen.getByRole('button', { name: letter })
      ).toBeInTheDocument()
    }
    // C appears twice: clear button + letter C
    expect(
      screen.getAllByRole('button', { name: 'C' })
    ).toHaveLength(2)
  })
})

// ─── Appending characters ──────────────────────────────────────────────────

describe('appending characters', () => {
  it('clicking a letter appends it to the display', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'H' }))
    await user.click(screen.getByRole('button', { name: 'I' }))
    expect(within(getDisplay()).getByText('HI')).toBeInTheDocument()
  })

  it('clicking operator + appends the + character', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'A' }))
    await user.click(screen.getByRole('button', { name: '+' }))
    expect(within(getDisplay()).getByText('A+')).toBeInTheDocument()
  })

  it('clicking operator − appends the unicode minus (U+2212)', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'A' }))
    await user.click(screen.getByRole('button', { name: '−' }))
    expect(within(getDisplay()).getByText('A\u2212')).toBeInTheDocument()
  })

  it('clicking operator × appends the unicode times (U+00D7)', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'A' }))
    await user.click(screen.getByRole('button', { name: '×' }))
    expect(within(getDisplay()).getByText('A\u00D7')).toBeInTheDocument()
  })

  it('clicking SPACE appends a space', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'A' }))
    await user.click(screen.getByRole('button', { name: 'SPACE' }))
    await user.click(screen.getByRole('button', { name: 'B' }))
    expect(within(getDisplay()).getByText('A B')).toBeInTheDocument()
  })

  it('clicking 💕 appends the heart emoji', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '💕' }))
    // Display will show '💕'; the button also has '💕', so scope to display
    expect(within(getDisplay()).getByText('💕')).toBeInTheDocument()
  })

  it('clicking Z appends Z', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Z' }))
    expect(within(getDisplay()).getByText('Z')).toBeInTheDocument()
  })

  it('multiple characters build up the full expression', async () => {
    const { user } = setup()
    for (const btn of ['M', 'E', '+', 'Y', 'O', 'U']) {
      await user.click(screen.getByRole('button', { name: btn }))
    }
    expect(within(getDisplay()).getByText('ME+YOU')).toBeInTheDocument()
  })

  it('SEND button becomes enabled once non-whitespace input exists', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'A' }))
    expect(screen.getByRole('button', { name: 'SEND' })).toBeEnabled()
  })
})

// ─── Clear button ──────────────────────────────────────────────────────────

describe('C (clear) button', () => {
  it('resets display back to placeholder zero', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'H' }))
    await user.click(getClearButton())
    expect(within(getDisplay()).getByText('0')).toBeInTheDocument()
  })

  it('disables SEND button again after clearing', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'A' }))
    await user.click(getClearButton())
    expect(screen.getByRole('button', { name: 'SEND' })).toBeDisabled()
  })

  it('re-enables input buttons after clearing a finalized state', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'A' }))
    await user.click(screen.getByRole('button', { name: '=' }))
    await user.click(getClearButton())
    expect(screen.getByRole('button', { name: 'A' })).toBeEnabled()
  })
})

// ─── Equals / finalization ─────────────────────────────────────────────────

describe('equals button — happy path', () => {
  it('pressing = with valid input disables all letter buttons', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'H' }))
    await user.click(screen.getByRole('button', { name: '=' }))
    expect(screen.getByRole('button', { name: 'A' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Z' })).toBeDisabled()
  })

  it('pressing = with valid input disables operator buttons', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'H' }))
    await user.click(screen.getByRole('button', { name: '=' }))
    expect(screen.getByRole('button', { name: '+' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '−' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '×' })).toBeDisabled()
  })

  it('pressing = with valid input disables SPACE and 💕 buttons', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'A' }))
    await user.click(screen.getByRole('button', { name: '=' }))
    expect(screen.getByRole('button', { name: 'SPACE' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '💕' })).toBeDisabled()
  })

  it('pressing = itself becomes disabled after finalizing', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'A' }))
    await user.click(screen.getByRole('button', { name: '=' }))
    expect(screen.getByRole('button', { name: '=' })).toBeDisabled()
  })

  it('display content is preserved after pressing =', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'H' }))
    await user.click(screen.getByRole('button', { name: 'I' }))
    await user.click(screen.getByRole('button', { name: '=' }))
    expect(within(getDisplay()).getByText('HI')).toBeInTheDocument()
  })
})

describe('equals button — edge cases', () => {
  it('pressing = with empty input does not finalize', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '=' }))
    expect(screen.getByRole('button', { name: 'A' })).toBeEnabled()
  })

  it('pressing = when input is only spaces does not finalize', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'SPACE' }))
    await user.click(screen.getByRole('button', { name: '=' }))
    expect(screen.getByRole('button', { name: 'A' })).toBeEnabled()
  })

  it('pressing = twice does not error or change state', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'A' }))
    await user.click(screen.getByRole('button', { name: '=' }))
    // = is now disabled; a second click is a no-op
    await user.click(screen.getByRole('button', { name: '=' }))
    expect(within(getDisplay()).getByText('A')).toBeInTheDocument()
  })
})

// ─── Post-finalization input guard ─────────────────────────────────────────

describe('input is blocked after finalization', () => {
  it('clicking a letter after = does not change the display', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'A' }))
    await user.click(screen.getByRole('button', { name: '=' }))
    expect(within(getDisplay()).getByText('A')).toBeInTheDocument()
    expect(within(getDisplay()).queryByText('AB')).not.toBeInTheDocument()
  })
})

// ─── SEND button disabled states ──────────────────────────────────────────

describe('SEND button disabled state', () => {
  it('is disabled on initial render', () => {
    setup()
    expect(screen.getByRole('button', { name: 'SEND' })).toBeDisabled()
  })

  it('is disabled when input is whitespace only', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'SPACE' }))
    expect(screen.getByRole('button', { name: 'SEND' })).toBeDisabled()
  })

  it('is enabled after entering a letter', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'A' }))
    expect(screen.getByRole('button', { name: 'SEND' })).toBeEnabled()
  })

  it('is enabled after pressing = with valid input', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'A' }))
    await user.click(screen.getByRole('button', { name: '=' }))
    expect(screen.getByRole('button', { name: 'SEND' })).toBeEnabled()
  })
})

// ─── SEND triggers download ────────────────────────────────────────────────

describe('SEND button — download behaviour', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('calls html2canvas and triggers a download link click', async () => {
    const html2canvas = (await import('html2canvas')).default as ReturnType<typeof vi.fn>
    html2canvas.mockResolvedValue({ toDataURL: () => 'data:image/png;base64,mock' })

    const clickSpy = vi.fn()
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag)
      if (tag === 'a') {
        vi.spyOn(el as HTMLAnchorElement, 'click').mockImplementation(clickSpy)
      }
      return el
    })

    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'A' }))
    await user.click(screen.getByRole('button', { name: 'SEND' }))

    expect(html2canvas).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()
  })

  it('sets download filename to notemath.png', async () => {
    const html2canvas = (await import('html2canvas')).default as ReturnType<typeof vi.fn>
    html2canvas.mockResolvedValue({ toDataURL: () => 'data:image/png;base64,mock' })

    const links: HTMLAnchorElement[] = []
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag)
      if (tag === 'a') {
        links.push(el as HTMLAnchorElement)
        vi.spyOn(el as HTMLAnchorElement, 'click').mockImplementation(vi.fn())
      }
      return el
    })

    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'A' }))
    await user.click(screen.getByRole('button', { name: 'SEND' }))

    expect(links[0]?.download).toBe('notemath.png')
  })
})
