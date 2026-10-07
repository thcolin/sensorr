import { render, screen } from '@testing-library/react'
import { Controls } from './Controls'

const Flag = ({ value, onChange, style, label }) => (
  <input type='checkbox' aria-label={label} checked={!!value} onChange={(e) => onChange(e.target.checked)} style={style} />
)

const fields = {
  flag: { initial: false, serialize: () => ({}), component: Flag, props: { label: 'flag' } },
  other: { initial: false, serialize: () => ({}), component: Flag, props: { label: 'other' } },
}

// A phone: no breakpoint matches, so the first value of each layout applies
const layout = {
  nav: { display: 'grid' as const, gridTemplateAreas: ['"results other"', '"results other flag"'] },
  strip: { display: 'grid' as const, gridTemplateAreas: ['"flag"', ''] },
}

describe('Controls', () => {
  beforeAll(() => {
    window.matchMedia = ((query) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} })) as any
  })

  it('shows the value of a field laid out in the strip, after another field of the bar changes', () => {
    const props = { fields, layout, statistics: {}, loading: false, total: 1, onChange: () => null }
    const { rerender } = render(<Controls {...props} values={{ flag: true, other: false }} />)

    expect((screen.getByLabelText('flag') as HTMLInputElement).checked).toBe(true)

    rerender(<Controls {...props} values={{ flag: true, other: true }} />)

    expect((screen.getByLabelText('other') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByLabelText('flag') as HTMLInputElement).checked).toBe(true)
  })
})
