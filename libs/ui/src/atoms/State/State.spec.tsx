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
})
