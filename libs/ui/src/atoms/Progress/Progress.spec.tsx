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

  it('sizes the gap between the pills from their count', () => {
    const parts = Array(18).fill(10).map(max => ({ value: max, max }))

    expect((render(<Progress value={180} max={180} segments={parts} />).container.querySelector('[role="progressbar"]') as HTMLElement).style.getPropertyValue('--parts')).toBe('18')
  })

  it('renders nothing when nothing aired', () => {
    expect(render(<Progress value={0} max={0} segments={[]} />).container.firstChild).toBeNull()
  })
})
