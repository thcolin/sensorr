import fetch from 'node-fetch'
import { pingToken } from './pin'

jest.mock('node-fetch', () => ({ __esModule: true, default: jest.fn() }))

const app = { name: 'Sensorr', version: '1.0.0', plex: 'client' }
const answer = (status: number) => (fetch as unknown as jest.Mock).mockResolvedValueOnce({ status, ok: status >= 200 && status < 300 })

describe('pingToken', () => {
  it('keeps a token plex.tv answers', async () => {
    answer(200)
    expect(await pingToken('token', app)).toBe(true)
  })

  it('reads a 401 as a dead token', async () => {
    answer(401)
    expect(await pingToken('token', app)).toBe(false)
  })

  it('throws on any other answer, which says nothing about the token', async () => {
    answer(503)
    await expect(pingToken('token', app)).rejects.toThrow('plex.tv answered 503 on /ping')
  })

  it('throws when plex.tv cannot be reached', async () => {
    (fetch as unknown as jest.Mock).mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND plex.tv'))
    await expect(pingToken('token', app)).rejects.toThrow('ENOTFOUND')
  })
})
