import { PaginateModel, PaginateResult } from 'mongoose'
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Plex, createPin, checkPin, PlexApp } from '@sensorr/plex'
import { ConfigService } from '../config/config.service'
import { Guest as GuestDocument } from './guest.schema'
import app from './../../../../../package.json'

@Injectable()
export class GuestsService {
  private readonly logger = new Logger(GuestsService.name)

  constructor(
    @InjectModel(GuestDocument.name) private readonly guestModel: PaginateModel<GuestDocument>,
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

  async register() {
    const pin = await createPin(this.plexApp())
    this.logger.log(`Register "${JSON.stringify({ id: pin.id, code: pin.code })}"`)
    return { id: pin.id, code: pin.code, expiresAt: pin.expiresAt, done: false }
  }

  // One-shot PIN status check, polled by the client (replaces the previous SSE stream whose
  // server-side polling died whenever the client connection dropped — e.g. a backgrounded mobile tab).
  async checkRegistration(id): Promise<{ done: boolean, expired?: boolean }> {
    const result = await checkPin(id, this.plexApp())

    if (result.status === 'invalid') {
      this.logger.log(`CheckRegistration "${id}", status="invalid"`)
      return { done: false, expired: true }
    }

    if (result.status !== 'authorized') {
      return { done: false }
    }

    this.logger.log(`CheckRegistration "${id}", status="authorized", registered`)
    const { email, thumb: avatar, title, username } = await Plex(
      { url: 'https://plex.tv:443', token: result.token, fallbackPort: 443 },
      this.plexApp(),
    ).query(`/api/v2/user`)
    await this.upsertGuest({ email, avatar, name: title || username, plex_id: id, plex_token: result.token })
    return { done: true }
  }

  async upsertGuest(guest): Promise<any> {
    this.logger.log(`UpsertGuest "${guest.email}"`)
    return this.guestModel.findOneAndUpdate({ email: guest.email }, guest, { new: true, upsert: true }).lean()
  }

  async deleteGuest(guest): Promise<any> {
    this.logger.log(`DeleteGuest "${guest.email}"`)
    this.eventEmitter.emit('guest.delete', { email: guest.email })
    return this.guestModel.deleteOne({ email: guest.email })
  }

  async getGuests(): Promise<PaginateResult<GuestDocument>> {
    this.logger.log(`GetGuests`)
    return this.guestModel.paginate({}, { pagination: false, lean: true, leanWithId: true, customLabels: { totalDocs: 'total_results', docs: 'results' } })
  }
}
