import { render } from '@testing-library/react'
import { State } from './State'

describe('State', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <State
        options={[
          {
            emoji: '⌛',
            label: 'Loading',
            value: 'loading',
            hide: true,
          },
          {
            emoji: '🔕',
            label: 'Ignored',
            value: 'ignored',
          },
        ]}
        value='ignored'
        onChange={() => {}}
      />,
    )
    expect(baseElement).toBeTruthy()
  })

  // Selected elsewhere, the first option would fire no change when chosen
  it('should keep a hidden value selected', () => {
    const { getByRole } = render(
      <State
        options={[
          { emoji: '🔕', label: 'Ignored', value: 'ignored' },
          { emoji: '📺', label: 'Partly followed', value: 'partial', hide: true },
        ]}
        value='partial'
        onChange={() => {}}
      />,
    )
    expect((getByRole('combobox') as HTMLSelectElement).value).toBe('partial')
  })
})
