import { render } from '@testing-library/react'
import { MovieState } from './State'

describe('MovieState', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<MovieState value='ignored' onChange={() => {}} />)
    expect(baseElement).toBeTruthy()
  })
})
