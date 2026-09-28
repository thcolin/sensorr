import { Injectable, Logger } from '@nestjs/common'
import { createPin, checkPin, PlexApp, PlexArtworkCandidate, PlexArtworkKind, PlexArtworks, artworksOf, candidatesOf } from '@sensorr/plex'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { ConfigService } from '../config/config.service'
import { ImageRequest, transcodeOf } from './image'
import { ArtworkChoices, PLEX_ARTWORKS, writeOf } from './artworks'
import app from './../../../../../package.json'

const IMAGES = ['image/jpeg', 'image/png', 'image/webp']

@Injectable()
export class PlexService {
  private readonly logger = new Logger(PlexService.name)
  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  private plexApp(): PlexApp {
    return {
      name: app.name,
      version: app.version,
      plex: this.configService.config.get('plex.client_identifier') || app.plex,
    }
  }

  async register(url) {
    this.logger.log(`Register, url="${url}"`)
    new URL(url) // validate the provided Plex server URL
    const pin = await createPin(this.plexApp())
    this.configService.config.set('plex.url', url)
    this.configService.config.set('plex.pin', { id: pin.id, code: pin.code })
    await this.configService.write()
    return { id: pin.id, code: pin.code, expiresAt: pin.expiresAt }
  }

  async reset() {
    this.logger.log(`Reset`)
    this.configService.config.set('plex.url', '')
    this.configService.config.set('plex.pin.id', '')
    this.configService.config.set('plex.pin.code', '')
    this.configService.config.set('plex.token', '')
    await this.configService.write()
    this.eventEmitter.emit('plex.reset')
  }

  // One-shot PIN status check, polled by the client (replaces the previous SSE stream whose
  // server-side polling died whenever the client connection dropped — e.g. a backgrounded mobile tab).
  async checkStatus(id): Promise<{ done: boolean, token?: string, expired?: boolean, error?: string }> {
    if (!this.configService.config.get('plex.url')) {
      return { done: false, error: 'No Plex URL defined, first register Plex server' }
    }

    if (this.configService.config.get('plex.token')) {
      return { done: true, token: this.configService.config.get('plex.token') }
    }

    const result = await checkPin(id, this.plexApp())

    if (result.status === 'invalid') {
      this.logger.log(`CheckStatus "${id}", status="invalid"`)
      return { done: false, expired: true }
    }

    if (result.status !== 'authorized') {
      return { done: false }
    }

    this.logger.log(`CheckStatus "${id}", status="authorized", registered`)
    this.configService.config.set('plex.token', result.token)
    await this.configService.write()
    return { done: true, token: result.token }
  }

  private registered() {
    return !!(this.configService.config.get('plex.url') && this.configService.config.get('plex.token'))
  }

  private async plex(path: string, { method = 'GET', accept = 'application/json', timeout = 10000 } = {}) {
    const res = await fetch(`${this.configService.config.get('plex.url').replace(/\/$/, '')}${path}`, {
      method,
      headers: { 'X-Plex-Token': this.configService.config.get('plex.token'), Accept: accept },
      signal: AbortSignal.timeout(timeout),
      // A redirect would carry the token to another host
      redirect: 'error',
    })

    if (!res.ok) {
      throw new Error(`Plex answered ${res.status}`)
    }

    return res
  }

  async image(request: ImageRequest): Promise<{ type: string, buffer: Buffer } | null> {
    if (!this.registered()) {
      return null
    }

    // A grid asks for dozens at once: an unreachable Plex must hand them to TMDB quickly
    const res = await this.plex(transcodeOf(request), { accept: 'image/*', timeout: 3000 })
    const type = res.headers.get('content-type')?.split(';')[0]

    if (!IMAGES.includes(type)) {
      throw new Error(`Plex answered ${type}`)
    }

    return { type, buffer: Buffer.from(await res.arrayBuffer()) }
  }

  async candidates(ratingKey: string): Promise<Record<PlexArtworkKind, PlexArtworkCandidate[]>> {
    this.logger.log(`Candidates "${ratingKey}"`)
    const kinds = Object.keys(PLEX_ARTWORKS) as PlexArtworkKind[]
    const lists = await Promise.allSettled(kinds.map(async (kind) => {
      const { MediaContainer } = await (await this.plex(`/library/metadata/${ratingKey}/${PLEX_ARTWORKS[kind].list}`)).json()
      return candidatesOf(MediaContainer?.Metadata)
    }))

    if (lists.every(({ status }) => status === 'rejected')) {
      throw (lists[0] as PromiseRejectedResult).reason
    }

    // A kind this Plex does not list, the logos of an older server, leaves the others to pick
    return kinds.reduce((acc, kind, index) => ({ ...acc, [kind]: lists[index].status === 'fulfilled' ? (lists[index] as PromiseFulfilledResult<PlexArtworkCandidate[]>).value : [] }), {} as Record<PlexArtworkKind, PlexArtworkCandidate[]>)
  }

  // One kind after the other: a kind Plex refuses leaves the others written
  async write(ratingKey: string, choices: ArtworkChoices): Promise<{ artworks: PlexArtworks | null, failed: Partial<Record<PlexArtworkKind, string>> }> {
    const failed = {}

    for (const [kind, choice] of Object.entries(choices)) {
      const { method, path } = writeOf(ratingKey, kind as PlexArtworkKind, choice)
      this.logger.log(`Write "${ratingKey}" ${kind}, ${method}`)

      try {
        // A key picks back a candidate Plex lists for this item, never one it did not
        if ('key' in choice) {
          const { MediaContainer } = await (await this.plex(`/library/metadata/${ratingKey}/${PLEX_ARTWORKS[kind].list}`)).json()

          if (!candidatesOf(MediaContainer?.Metadata).some(({ key }) => key === choice.key)) {
            throw new Error('Not a candidate Plex lists')
          }
        }

        await this.plex(path, { method, timeout: 30000 })
      } catch (err) {
        this.logger.warn(`Write "${ratingKey}" ${kind}, ${err.message}`)
        failed[kind] = err.message
      }
    }

    // Written already: an item Plex does not read back is no reason to say otherwise
    try {
      const { MediaContainer } = await (await this.plex(`/library/metadata/${ratingKey}`)).json()

      if (!MediaContainer?.Metadata?.[0]) {
        throw new Error('Plex listed no item')
      }

      return { artworks: artworksOf(MediaContainer.Metadata[0]), failed }
    } catch (err) {
      this.logger.warn(`Write "${ratingKey}", read back: ${err.message}`)
      return { artworks: null, failed }
    }
  }
}
