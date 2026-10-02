import fetch from 'node-fetch'
import { TAGS, channelOf, versionOn } from './update'

jest.mock('node-fetch', () => ({ __esModule: true, default: jest.fn() }))

describe('channelOf', () => {
  it.each([
    ['dev', 'dev'],
    ['sha-5e2c577', 'dev'],
    ['beta', 'beta'],
    ['1.0.0-beta.1', 'beta'],
    ['latest', 'stable'],
    ['1.0', 'stable'],
    ['1.0.0', 'stable'],
  ])('reads the channel of the "%s" tag as %s', (tag, channel) => {
    expect(channelOf(tag)).toBe(channel)
  })

  it('has no channel outside of Docker, without a tag', () => {
    expect(channelOf(undefined)).toBeNull()
  })

  it('moves each channel to the tag the CI publishes it under', () => {
    expect(TAGS).toEqual({ beta: 'beta', stable: 'latest', dev: 'dev' })
  })
})

describe('versionOn', () => {
  const registry = {
    '/token': { token: 'anonymous' },
    '/v2/thcolin/sensorr-api/manifests/dev': {
      manifests: [{ digest: 'attestation', platform: { os: 'unknown' } }, { digest: 'image', platform: { os: 'linux' } }],
    },
    '/v2/thcolin/sensorr-api/manifests/image': { config: { digest: 'config' } },
    '/v2/thcolin/sensorr-api/blobs/config': {
      config: { Labels: { 'org.opencontainers.image.version': 'dev', 'org.opencontainers.image.revision': '00459262b2ee61622d0a10ae14a411759bf9d186' } },
    },
  }

  beforeEach(() => {
    jest.mocked(fetch).mockImplementation((async (url: string) => {
      const body = registry[new URL(url).pathname]
      return { ok: !!body, status: body ? 200 : 404, json: async () => body }
    }) as any)
  })

  it('reads the version and the revision labels of the image a tag points to', async () => {
    await expect(versionOn('dev')).resolves.toEqual({ version: 'dev', revision: '00459262b2ee61622d0a10ae14a411759bf9d186' })
  })

  it('has neither for a tag GHCR does not hold', async () => {
    await expect(versionOn('latest')).resolves.toEqual({ version: null, revision: null })
  })
})
