import fetch from 'node-fetch'
import { NotFoundException, BadRequestException, BadGatewayException } from '@nestjs/common'
import { WrappedService } from './wrapped.service'

jest.mock('node-fetch', () => ({ __esModule: true, default: jest.fn() }))
// The schemas and the config service only name injection tokens here; loading them pulls modules the API's jest setup cannot compile
jest.mock('../config/config.service', () => ({ ConfigService: class ConfigService {} }))
jest.mock('../guests/guest.schema', () => ({ Guest: class Guest {} }))
jest.mock('../mail/mail.service', () => ({ MailService: class MailService {} }))
jest.mock('@sensorr/config', () => ({ WRAPPED_THEMES: ['affiche', 'labo'] }))
jest.mock('./wrapped.schema', () => ({ Play: class Play {}, Viewer: class Viewer {}, Title: class Title {}, Edition: class Edition {} }))

const lean = (value: unknown) => ({ lean: async () => value })

const now = Date.now() / 1000

const serviceOf = ({ watched = true, contentType = 'image/jpeg', editions = [] as { year: number, enabled?: boolean }[], frozen = [] as number[] } = {}) => {
  const playModel = { find: jest.fn(() => lean(watched ? [{ started: now }] : [])) }
  const editionModel = { find: jest.fn(() => lean(frozen.map((year) => ({ year })))) }
  const guestModel = {
    findOne: jest.fn(({ wrapped_token }) => lean(wrapped_token === 'token' ? { email: 'guest@example.com', name: 'Guest' } : null)),
    findOneAndUpdate: jest.fn(({ email }, update) => lean(email === 'guest@example.com' ? { email, ...update } : null)),
  }
  const viewerModel = { findOne: jest.fn(() => lean({ _id: 7, email: 'guest@example.com' })) }
  const titleModel = { findById: jest.fn(() => lean({ thumb: '/library/metadata/1/thumb/2', art: '/library/metadata/1/art/2' })) }
  const configService = { config: { get: (key: string) => ({ 'tautulli.url': 'http://tautulli.local', 'tautulli.key': 'secret', 'wrapped.editions': editions })[key] } }
  ;(fetch as unknown as jest.Mock).mockResolvedValue({ ok: true, status: 200, headers: { get: () => contentType }, arrayBuffer: async () => new TextEncoder().encode('jpeg').buffer })

  const service = new WrappedService(playModel as any, viewerModel as any, titleModel as any, editionModel as any, guestModel as any, configService as any, {} as any)
  return { service, playModel, editionModel, guestModel }
}

describe('WrappedService.image', () => {
  it('relays the artwork of a title the guest watched in a year they can open', async () => {
    const { service, playModel } = serviceOf()
    await expect(service.image('token', 'plex://movie/heat', 'thumb', 640)).resolves.toEqual({ type: 'image/jpeg', buffer: Buffer.from('jpeg') })
    expect(playModel.find).toHaveBeenCalledWith({ user_id: 7, title: 'plex://movie/heat' }, { started: 1 })
  })

  it('refuses a title watched only in a year turned off', async () => {
    const year = new Date().getFullYear()
    const { service } = serviceOf({ editions: [year, year + 1].map((year) => ({ year, enabled: false })) })
    await expect(service.image('token', 'plex://movie/heat', 'thumb', 640)).rejects.toBeInstanceOf(NotFoundException)
  })

  it('refuses a title the guest did not watch, and an unknown token', async () => {
    await expect(serviceOf({ watched: false }).service.image('token', 'plex://movie/other', 'thumb', 640)).rejects.toBeInstanceOf(NotFoundException)
    await expect(serviceOf().service.image('nope', 'plex://movie/heat', 'thumb', 640)).rejects.toBeInstanceOf(NotFoundException)
  })

  it('refuses a free width, an unknown kind, and a key that is not a string', async () => {
    const { service } = serviceOf()
    await expect(service.image('token', 'plex://movie/heat', 'thumb', 500)).rejects.toBeInstanceOf(BadRequestException)
    await expect(service.image('token', 'plex://movie/heat', 'banner', 640)).rejects.toBeInstanceOf(BadRequestException)
    await expect(service.image('token', { $ne: 'x' } as any, 'thumb', 640)).rejects.toBeInstanceOf(BadRequestException)
  })

  it('never logs the Tautulli URL, which carries the API key', async () => {
    const { service } = serviceOf()
    const warn = jest.spyOn((service as any).logger, 'warn').mockImplementation(() => undefined)
    ;(fetch as unknown as jest.Mock).mockRejectedValue(Object.assign(new Error('request to http://tautulli.local/api/v2?apikey=secret failed'), { name: 'FetchError', code: 'ECONNREFUSED' }))
    await expect(service.image('token', 'plex://movie/heat', 'thumb', 640)).rejects.toBeInstanceOf(BadGatewayException)
    expect(JSON.stringify(warn.mock.calls)).not.toMatch(/secret|apikey/)
  })

  it('answers 502 when Tautulli does not send an image, without telling why', async () => {
    const error = await serviceOf({ contentType: 'image/svg+xml' }).service.image('token', 'plex://movie/heat', 'thumb', 640).catch((error) => error)
    expect(error).toBeInstanceOf(BadGatewayException)
    expect(JSON.stringify(error.getResponse())).not.toMatch(/tautulli|secret/i)
  })
})

describe('WrappedService.openedEdition', () => {
  const shown = 2026
  beforeEach(() => jest.spyOn(WrappedService.prototype, 'shownEdition').mockReturnValue(shown))
  afterEach(() => jest.restoreAllMocks())

  it('opens the year a link asks for, when the friend can open it', async () => {
    const { service } = serviceOf({ frozen: [2023, 2024] })
    await expect((service as any).openedEdition('guest@example.com', 2023)).resolves.toBe(2023)
  })

  it('falls back to the year shown now for a year turned off, or one the friend has nothing in', async () => {
    const { service } = serviceOf({ frozen: [2023, 2024], editions: [{ year: 2023, enabled: false }] })
    await expect((service as any).openedEdition('guest@example.com', 2023)).resolves.toBe(shown)
    await expect((service as any).openedEdition('guest@example.com', 1990)).resolves.toBe(shown)
  })

  it('falls back to the last year still open when the one shown now is turned off', async () => {
    const { service } = serviceOf({ frozen: [2023, 2024], editions: [{ year: shown, enabled: false }] })
    await expect((service as any).openedEdition('guest@example.com', 1990)).resolves.toBe(2024)
  })
})

describe('WrappedService.freeze', () => {
  it('leaves a year turned off unfrozen', async () => {
    const { service, editionModel, playModel } = serviceOf({ editions: [{ year: 2024, enabled: false }] })
    await expect(service.freeze(2024)).resolves.toEqual({ year: 2024, frozen: 0 })
    expect(editionModel.find).not.toHaveBeenCalled()
    expect(playModel.find).not.toHaveBeenCalled()
  })
})
