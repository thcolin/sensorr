import { Injectable, Logger } from '@nestjs/common'
import { createPin, checkPin, PlexApp } from '@sensorr/plex'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { ConfigService } from '../config/config.service'
import app from './../../../../../package.json'

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
}
