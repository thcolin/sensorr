import { render } from '@testing-library/react'
import { fixtures } from '@sensorr/tmdb'
import { Focus } from './Focus'

jest.mock('@dicebear/core', () => ({}))
jest.mock('@dicebear/collection', () => ({}))

describe('Focus', () => {
  it('should render successfully', () => {
    window.matchMedia = (query) => ({ matches: false, media: query }) as MediaQueryList
    const { baseElement } = render(<Focus entity={fixtures.movie} property='vote_average' />)
    expect(baseElement).toBeTruthy()
  })
})
