import fetch from 'node-fetch'
import { MailService } from './mail.service'

jest.mock('node-fetch', () => ({ __esModule: true, default: jest.fn() }))
// The schemas and the config service only name injection tokens here; loading them pulls modules the API's jest setup cannot compile
jest.mock('../config/config.service', () => ({ ConfigService: class ConfigService {} }))
jest.mock('../guests/guest.schema', () => ({ Guest: class Guest {} }))
jest.mock('../movies/movie.schema', () => ({ Movie: class Movie {} }))
jest.mock('../shows/show.schema', () => ({ Show: class Show {} }))
jest.mock('../shows/episode.schema', () => ({ Episode: class Episode {} }))
jest.mock('./invitation.schema', () => ({ Invitation: class Invitation {} }))

const serviceOf = (config: Record<string, string>) => {
  const configService = { config: { get: (key: string) => ({ 'mail.from': 'Thomas <sensorr@example.com>', ...config })[key] } }
  return new MailService({} as any, {} as any, {} as any, {} as any, {} as any, configService as any)
}

describe('MailService.service', () => {
  beforeEach(() => (fetch as unknown as jest.Mock).mockReset())

  it('names the Plex server Tautulli gives, and asks Tautulli once', async () => {
    ;(fetch as unknown as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ response: { data: 'Living Room' } }) })
    const service = serviceOf({ 'tautulli.url': 'http://tautulli.local', 'tautulli.key': 'secret' })

    await expect(service.service()).resolves.toBe("Living Room's Sensorr")
    await expect(service.service()).resolves.toBe("Living Room's Sensorr")
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('falls back on the sender without Tautulli', async () => {
    await expect(serviceOf({}).service()).resolves.toBe("Thomas's Sensorr")
    expect(fetch).not.toHaveBeenCalled()
  })

  it('falls back on the sender when Tautulli fails, and does not ask again right away', async () => {
    ;(fetch as unknown as jest.Mock).mockRejectedValue(Object.assign(new Error('http://tautulli.local/api/v2?apikey=secret'), { name: 'FetchError', code: 'ECONNREFUSED' }))
    const service = serviceOf({ 'tautulli.url': 'http://tautulli.local', 'tautulli.key': 'secret' })
    const warn = jest.spyOn((service as any).logger, 'warn').mockImplementation(() => undefined)

    await expect(service.service()).resolves.toBe("Thomas's Sensorr")
    await expect(service.service()).resolves.toBe("Thomas's Sensorr")
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls.flat().join(' ')).not.toContain('secret')
  })
})
