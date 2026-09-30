import React from 'react'
import { cleanup, render, waitFor } from '@testing-library/react'
import { useDragScroll } from './useDragScroll'

let clicks = 0
let reduced = false

// A row lays out wrappers, as List does around each poster: their padding is the row's background
const Row = () => {
  const drag = useDragScroll<HTMLDivElement>()

  return (
    <div ref={drag} data-testid='row'>
      <div data-testid='cell'>
        <button onClick={() => clicks++}>poster</button>
      </div>
    </div>
  )
}

const Rows = () => {
  const outer = useDragScroll<HTMLDivElement>()
  const inner = useDragScroll<HTMLDivElement>()

  return (
    <div ref={outer} data-testid='outer'>
      <div ref={inner} data-testid='row'>
        <div data-testid='cell'>
          <button onClick={() => clicks++}>poster</button>
        </div>
      </div>
    </div>
  )
}

// jsdom has no layout and no PointerEvent: the rows get a width, the events their pointer type
const size = (row) => {
  let left = 0
  Object.defineProperty(row, 'scrollLeft', { get: () => left, set: (value) => { left = Math.max(0, Math.min(value, 1500)) } })
  Object.defineProperty(row, 'scrollWidth', { value: 2000 })
  Object.defineProperty(row, 'clientWidth', { value: 500 })
  Object.defineProperty(row, 'clientHeight', { value: 300 })
  return row
}

const mount = () => {
  const { getByTestId } = render(<Row />)
  return { row: size(getByTestId('row')), cell: getByTestId('cell'), poster: getByTestId('cell').querySelector('button') }
}

const pointer = (type, target, clientX, pointerType = 'mouse') => {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX, button: 0, buttons: type === 'pointerup' ? 0 : 1 })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  target.dispatchEvent(event)
}

const click = (target) => target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

describe('useDragScroll', () => {
  beforeEach(() => {
    clicks = 0
    reduced = false
    window.matchMedia = (query) => ({ matches: reduced && query.includes('reduce'), media: query }) as MediaQueryList
  })

  afterEach(cleanup)

  it('scrolls the row a mouse drags by its background, and swallows the click its release makes', () => {
    const { row, cell, poster } = mount()

    pointer('pointerdown', cell, 600)
    pointer('pointermove', window, 580)
    pointer('pointermove', window, 380)
    expect(row.scrollLeft).toBe(200)

    pointer('pointerup', window, 380)
    click(poster)
    expect(clicks).toBe(0)
  })

  it('leaves an item to its click, however far the mouse moves', () => {
    const { row, poster } = mount()

    pointer('pointerdown', poster, 600)
    pointer('pointermove', window, 580)
    pointer('pointermove', window, 380)
    pointer('pointerup', window, 380)
    click(poster)

    expect(row.scrollLeft).toBe(0)
    expect(clicks).toBe(1)
  })

  it('leaves a touch to the native scroll', () => {
    const { row, cell } = mount()

    pointer('pointerdown', cell, 600, 'touch')
    pointer('pointermove', window, 300, 'touch')
    pointer('pointerup', window, 300, 'touch')

    expect(row.scrollLeft).toBe(0)
  })

  it('moves only the innermost of two rows', () => {
    const { getByTestId } = render(<Rows />)
    const outer = size(getByTestId('outer'))
    const row = size(getByTestId('row'))

    pointer('pointerdown', getByTestId('cell'), 600)
    pointer('pointermove', window, 580)
    pointer('pointermove', window, 380)

    expect(row.scrollLeft).toBe(200)
    expect(outer.scrollLeft).toBe(0)
  })

  it('pulls the children past an edge, and springs them back on release', async () => {
    const { row, cell } = mount()

    pointer('pointerdown', cell, 600)
    pointer('pointermove', window, 620)
    pointer('pointermove', window, 820)
    expect(row.scrollLeft).toBe(0)
    expect(parseFloat(cell.style.translate)).toBeGreaterThan(0)
    expect(parseFloat(cell.style.translate)).toBeLessThan(200)

    pointer('pointerup', window, 820)
    await waitFor(() => expect(cell.style.translate).toBe(''), { timeout: 2000 })
  })

  it('keeps a reduced motion within the bounds', () => {
    reduced = true
    const { row, cell } = mount()

    pointer('pointerdown', cell, 600)
    pointer('pointermove', window, 620)
    pointer('pointermove', window, 820)

    expect(row.scrollLeft).toBe(0)
    expect(cell.style.translate || '').toBe('')
  })
})
