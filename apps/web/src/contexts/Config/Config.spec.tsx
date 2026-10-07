import { act, render } from '@testing-library/react'
import { Provider, useConfigContext } from './Config'

const mockAPI = {
  query: { config: { getConfig: () => ({ uri: 'config', params: {}, init: {} }) } },
  fetch: jest.fn(),
}

const mockAuth = { authenticated: true, setAuthenticated: jest.fn() }

jest.mock('../../store/api', () => ({ useAPI: () => mockAPI }))
jest.mock('../../store/tmdb', () => ({ useTMDB: () => ({ init: async () => {} }) }))
jest.mock('../../store/sensorr', () => ({ useSensorr: () => ({}) }))
jest.mock('../Auth/Auth', () => ({ useAuthContext: () => mockAuth }))
jest.mock('@sensorr/config', () => ({ load: jest.fn(), get: jest.fn() }))
jest.mock('@sensorr/i18n', () => ({ changeLanguage: jest.fn(), languageOf: () => 'en' }))

const flush = () => act(() => new Promise(resolve => setTimeout(resolve, 0)))

// The answer of `api.fetch` when the API, or the proxy in front of it, refuses the request
const refused = (status) => Object.assign(new Error(`[API] ${status}: /api/config`), { status })

const Consumer = () => {
  const { config, error, retry } = useConfigContext()
  return <button onClick={retry}>{error ? error.message : config ? 'loaded' : 'loading'}</button>
}

describe('Config', () => {
  beforeEach(() => {
    mockAPI.fetch.mockReset()
    mockAuth.setAuthenticated.mockReset()
  })

  it('logs out when the API refuses the token', async () => {
    mockAPI.fetch.mockRejectedValue(refused(401))
    render(<Provider><Consumer /></Provider>)
    await flush()

    expect(mockAuth.setAuthenticated).toHaveBeenCalledWith(false)
  })

  it('keeps the session on a gateway timeout, and loads again on retry', async () => {
    mockAPI.fetch.mockRejectedValueOnce(refused(504)).mockResolvedValueOnce({})
    const { container } = render(<Provider><Consumer /></Provider>)
    await flush()

    expect(mockAuth.setAuthenticated).not.toHaveBeenCalled()
    expect(container.textContent).toBe('[API] 504: /api/config')

    await act(async () => container.querySelector('button').click())
    await flush()

    expect(container.textContent).toBe('loaded')
  })
})
