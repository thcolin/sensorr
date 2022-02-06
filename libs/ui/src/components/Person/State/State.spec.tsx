import { render } from '@testing-library/react'
import { State } from './State'

describe('State', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<State value='ignored' onChange={() => {}} />)
    expect(baseElement).toBeTruthy()
  })
})
