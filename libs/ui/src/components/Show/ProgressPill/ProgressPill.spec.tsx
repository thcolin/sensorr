import { render } from '@testing-library/react'
import { ProgressPill } from './ProgressPill'

// The tints are theme-ui styles jsdom does not resolve: read the state and the neutral side the pill hands down
jest.mock('../../../atoms/TransitionPill/TransitionPill', () => ({
  TransitionPill: ({ state, neutral, title }) => <span title={title}>{`${neutral.from ? 'quiet' : state}|${state}`}</span>,
}))

// "owned|aired", the tint of each side
const pill = (props: Parameters<typeof ProgressPill>[0]) => render(<ProgressPill {...props} />).container.textContent

describe('ProgressPill', () => {
  it('tints the aired side by the diffusion, and the owned side with it once every aired episode is owned', () => {
    expect(pill({ owned: 33, aired: 33 })).toBe('held|held')
    expect(pill({ owned: 42, aired: 42, airing: true })).toBe('airing|airing')
    expect(pill({ owned: 40, aired: 42, airing: true })).toBe('quiet|airing')
    expect(pill({ owned: 32, aired: 33 })).toBe('quiet|quiet')
  })

  it('appends the detail to the counts', () => {
    const { container } = render(<ProgressPill owned={42} aired={42} airing={true} detail='next episode on 29/09' />)
    expect((container.firstChild as HTMLElement).title).toBe('42 of 42 aired episodes owned · next episode on 29/09')
  })
})
