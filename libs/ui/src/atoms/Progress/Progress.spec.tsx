import { render } from '@testing-library/react'
import { Progress } from './Progress'

describe('Progress', () => {
  it('renders a native progress without segments, or with a single one', () => {
    expect(render(<Progress value={4} max={10} />).container.querySelector('progress')).toBeTruthy()
    expect(render(<Progress value={4} max={10} segments={[{ value: 4, max: 10 }, { value: 0, max: 0 }]} />).container.querySelector('progress')).toBeTruthy()
  })

  it('fills each segment with its own value, capped at its max, and leaves out the empty ones', () => {
    const { container } = render(<Progress value={13} max={16} segments={[{ value: 12, max: 10 }, { value: 1, max: 4 }, { value: 0, max: 0 }, { value: 0, max: 2 }]} />)
    const bar = container.querySelector('[role="progressbar"]')
    const fills = Array.from(bar.children).map(segment => (segment.firstChild as HTMLElement).style.transform)

    expect(bar.getAttribute('aria-valuenow')).toBe('13')
    expect(bar.getAttribute('aria-valuemax')).toBe('16')
    expect(fills).toEqual(['scaleX(1)', 'scaleX(0.25)', 'scaleX(0)'])
  })

  it('drops the hairlines once a part falls under a 24th of the bar', () => {
    const parts = (count) => Array(count).fill(10).map(max => ({ value: max, max }))

    expect(render(<Progress value={240} max={240} segments={parts(24)} />).container.querySelector('[data-dense]')).toBeNull()
    expect(render(<Progress value={250} max={250} segments={parts(25)} />).container.querySelector('[data-dense]')).toBeTruthy()
  })

  it('renders nothing when nothing aired', () => {
    expect(render(<Progress value={0} max={0} segments={[]} />).container.firstChild).toBeNull()
  })
})
