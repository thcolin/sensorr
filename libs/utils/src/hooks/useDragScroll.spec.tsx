import React from 'react'
import { cleanup, render, waitFor } from '@testing-library/react'
import { pageOf, useDragScroll } from './useDragScroll'

let clicks = 0
let reduced = false

// A row lays out wrappers, as List does around each poster: their padding is the row's background
const Row = () => {
  const drag = useDragScroll<HTMLDivElement>(undefined, { byBackground: true })

  return (
    <div ref={drag} data-testid='row'>
      <div data-testid='cell'>
        <button onClick={() => clicks++}>poster</button>
      </div>
    </div>
  )
}

// Pills lay straight in the row, as in CommandTabs: a drag takes over their click
const Pills = () => {
  const drag = useDragScroll<HTMLDivElement>()

  return (
    <div ref={drag} data-testid='row'>
      <button onClick={() => clicks++}>all</button>
    </div>
  )
}

const Rows = () => {
  const outer = useDragScroll<HTMLDivElement>(undefined, { byBackground: true })
  const inner = useDragScroll<HTMLDivElement>(undefined, { byBackground: true })

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

  it('scrolls a row of posters a mouse drags by its background, and swallows the click its release makes', () => {
    const { row, cell, poster } = mount()

    pointer('pointerdown', cell, 600)
    pointer('pointermove', window, 580)
    pointer('pointermove', window, 380)
    expect(row.scrollLeft).toBe(200)

    pointer('pointerup', window, 380)
    click(poster)
    expect(clicks).toBe(0)
  })

  it('leaves a poster to its click, however far the mouse moves', () => {
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

  it('grabs a row of pills by a pill, and swallows the click its release makes', () => {
    const { getByTestId } = render(<Pills />)
    const row = size(getByTestId('row'))
    const pill = row.querySelector('button')

    pointer('pointerdown', pill, 600)
    pointer('pointermove', window, 580)
    pointer('pointermove', window, 380)
    expect(row.scrollLeft).toBe(200)

    pointer('pointerup', window, 380)
    click(pill)
    expect(clicks).toBe(0)
  })

  it('shows grab over the background only', () => {
    const { row, cell, poster } = mount()

    cell.dispatchEvent(new MouseEvent('pointerover', { bubbles: true }))
    expect(row.style.cursor).toBe('grab')

    poster.dispatchEvent(new MouseEvent('pointerover', { bubbles: true }))
    expect(row.style.cursor).toBe('')
  })
})

describe('pageOf', () => {
  // Five items of 300px from 0, and a view of 700px: two and a third show
  const row = (left) => {
    const element = document.createElement('div')
    for (let i = 0; i < 5; i++) {
      const item = document.createElement('div')
      item.getBoundingClientRect = () => ({ left: i * 300 - left, right: (i + 1) * 300 - left }) as DOMRect
      element.appendChild(item)
    }
    element.getBoundingClientRect = () => ({ left: 0 }) as DOMRect
    Object.defineProperty(element, 'scrollLeft', { value: left })
    Object.defineProperty(element, 'scrollWidth', { value: 1500 })
    Object.defineProperty(element, 'clientWidth', { value: 700 })
    return element
  }

  it('brings the first item cut at the right to the left edge', () => {
    expect(pageOf(row(0), 1)).toBe(600)
  })

  it('goes to the end when less than a quarter of the view is left', () => {
    expect(pageOf(row(600), 1)).toBe(800)
  })

  it('brings the item cut at the left to the right edge, from the first item that fits with it', () => {
    expect(pageOf(row(800), -1)).toBe(300)
  })

  it('goes to the start when less than a quarter of the view is left', () => {
    expect(pageOf(row(300), -1)).toBe(0)
  })
})
