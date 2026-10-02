import { render } from '@testing-library/react'
import { PersonState } from './State'

describe('State', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<PersonState value='ignored' onChange={() => {}} />)
    expect(baseElement).toBeTruthy()
  })
})
