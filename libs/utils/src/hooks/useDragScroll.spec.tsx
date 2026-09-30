import React from 'react'
import { cleanup, render } from '@testing-library/react'
import { useDragScroll } from './useDragScroll'

let clicks = 0

const Row = () => {
  const drag = useDragScroll<HTMLDivElement>()

  return (
    <div ref={drag} data-testid='row'>
      <button onClick={() => clicks++}>poster</button>
    </div>
  )
}

// jsdom has no layout and no PointerEvent: the row gets a width, the events their pointer type
const mount = () => {
  const row = render(<Row />).getByTestId('row')
  let left = 0
  Object.defineProperty(row, 'scrollLeft', { get: () => left, set: (value) => { left = Math.max(0, Math.min(value, 1500)) } })
  Object.defineProperty(row, 'scrollWidth', { value: 2000 })
  Object.defineProperty(row, 'clientWidth', { value: 500 })
  return row
}

const pointer = (type, target, clientX, pointerType = 'mouse') => {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX, button: 0 })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  target.dispatchEvent(event)
}

const click = (target) => target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

describe('useDragScroll', () => {
  beforeEach(() => {
    clicks = 0
    window.matchMedia = (query) => ({ matches: true, media: query }) as MediaQueryList
  })

  afterEach(cleanup)

  it('scrolls the row a mouse drags, and swallows the click its release makes', () => {
    const row = mount()
    const poster = row.querySelector('button')

    pointer('pointerdown', poster, 600)
    pointer('pointermove', window, 580)
    pointer('pointermove', window, 380)
    pointer('pointerup', window, 380)
    click(poster)

    expect(row.scrollLeft).toBe(200)
    expect(clicks).toBe(0)
  })

  it('lets a press that does not move click', () => {
    const row = mount()
    const poster = row.querySelector('button')

    pointer('pointerdown', poster, 600)
    pointer('pointermove', window, 595)
    pointer('pointerup', window, 595)
    click(poster)

    expect(row.scrollLeft).toBe(0)
    expect(clicks).toBe(1)
  })

  it('leaves a touch to the native scroll', () => {
    const row = mount()
    const poster = row.querySelector('button')

    pointer('pointerdown', poster, 600, 'touch')
    pointer('pointermove', window, 300, 'touch')
    pointer('pointerup', window, 300, 'touch')
    click(poster)

    expect(row.scrollLeft).toBe(0)
    expect(clicks).toBe(1)
  })
})
