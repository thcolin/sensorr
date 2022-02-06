import { render } from '@testing-library/react'
import { Picture } from './Picture'
import { fixtures } from '@sensorr/tmdb'

describe('Picture', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Picture entity={fixtures.movie} />)
    expect(baseElement).toBeTruthy()
  })
})
