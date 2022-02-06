import { render } from '@testing-library/react'
import { fixtures } from '@sensorr/tmdb'
import { Focus } from './Focus'

describe('Focus', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Focus entity={fixtures.movie} property='vote_average' />)
    expect(baseElement).toBeTruthy()
  })
})
