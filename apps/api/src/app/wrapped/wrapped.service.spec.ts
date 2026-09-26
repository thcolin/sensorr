import fetch from 'node-fetch'
import { NotFoundException, BadRequestException, BadGatewayException } from '@nestjs/common'
import { WrappedService } from './wrapped.service'

jest.mock('node-fetch', () => ({ __esModule: true, default: jest.fn() }))
// The schemas and the config service only name injection tokens here; loading them pulls modules the API's jest setup cannot compile
jest.mock('../config/config.service', () => ({ ConfigService: class ConfigService {} }))
jest.mock('../guests/guest.schema', () => ({ Guest: class Guest {} }))
jest.mock('./wrapped.schema', () => ({ Play: class Play {}, Viewer: class Viewer {}, Title: class Title {}, Edition: class Edition {} }))

const lean = (value: unknown) => ({ lean: async () => value })

const serviceOf = ({ watched = true, contentType = 'image/jpeg' } = {}) => {
  const playModel = { exists: jest.fn(async () => watched ? { _id: 1 } : null) }
  const guestModel = { findOne: jest.fn(({ wrapped_token }) => lean(wrapped_token === 'token' ? { email: 'guest@example.com', name: 'Guest' } : null)) }
  const viewerModel = { findOne: jest.fn(() => lean({ _id: 7, email: 'guest@example.com' })) }
  const titleModel = { findById: jest.fn(() => lean({ thumb: '/library/metadata/1/thumb/2', art: '/library/metadata/1/art/2' })) }
  const configService = { config: { get: (key: string) => ({ 'tautulli.url': 'http://tautulli.local', 'tautulli.key': 'secret' })[key] } }
  ;(fetch as unknown as jest.Mock).mockResolvedValue({ ok: true, status: 200, headers: { get: () => contentType }, arrayBuffer: async () => new TextEncoder().encode('jpeg').buffer })

  const service = new WrappedService(playModel as any, viewerModel as any, titleModel as any, {} as any, guestModel as any, configService as any)
  return { service, playModel }
}

describe('WrappedService.image', () => {
  it('relays the artwork of a title the guest watched in the shown edition', async () => {
    const { service, playModel } = serviceOf()
    await expect(service.image('token', 'plex://movie/heat', 'thumb', 640)).resolves.toEqual({ type: 'image/jpeg', buffer: Buffer.from('jpeg') })
    expect(playModel.exists).toHaveBeenCalledWith(expect.objectContaining({ user_id: 7, title: 'plex://movie/heat' }))
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

  it('answers 502 when Tautulli does not send an image, without telling why', async () => {
    const error = await serviceOf({ contentType: 'text/html' }).service.image('token', 'plex://movie/heat', 'thumb', 640).catch((error) => error)
    expect(error).toBeInstanceOf(BadGatewayException)
    expect(JSON.stringify(error.getResponse())).not.toMatch(/tautulli|secret/i)
  })
})
