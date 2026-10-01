import { PaginateModel, PaginateResult } from 'mongoose'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Plex, createPin, checkPin, PlexApp } from '@sensorr/plex'
import { ConfigService } from '../config/config.service'
import { MailService } from '../mail/mail.service'
import { mails } from '../mail/templates'
import { Guest as GuestDocument } from './guest.schema'
import { reminderOf } from './reminders'
import app from './../../../../../package.json'

@Injectable()
export class GuestsService {
  private readonly logger = new Logger(GuestsService.name)

  constructor(
    @InjectModel(GuestDocument.name) private readonly guestModel: PaginateModel<GuestDocument>,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private mailService: MailService,
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
    const known = await this.guestModel.exists({ email })
    // The token was just issued, it works until the next keep-in-touch says otherwise
    const guest = await this.upsertGuest({ email, avatar, name: title || username, plex_id: id, plex_token: result.token, plex_token_valid: true, plex_token_checked_at: Date.now() })

    if (!known && this.mailService.enabled('welcome')) {
      this.mailService.send(email, mails.welcome({ url: this.mailService.url(), sender: this.mailService.sender(), name: guest.name, wrapped: guest.wrapped_token }))
        .catch((error) => this.logger.warn(`Welcome "${email}" not sent: ${error.message}`))
    }

    return { done: true }
  }

  async upsertGuest(guest): Promise<any> {
    this.logger.log(`UpsertGuest "${guest.email}"`)
    const previous = await this.guestModel.findOne({ email: guest.email }).lean()
    const reconnected = guest.plex_token_valid === true && previous?.plex_token_valid === false
    const updated = await this.guestModel.findOneAndUpdate({ email: guest.email }, { ...guest, ...(reconnected ? { reconnect_mails: 0 } : {}) }, { new: true, upsert: true }).lean()

    if (guest.plex_token_valid === false && previous && this.mailService.enabled('reconnect') && !updated.mail_unsubscribed?.includes('reconnect')) {
      await this.remind(updated).catch((error) => this.logger.warn(`Reconnect "${guest.email}" not sent: ${error.message}`))
    }

    return updated
  }

  // Keep-in-touch calls this on every pass of a dead token
  private async remind(guest) {
    const reminder = reminderOf(guest)

    if (reminder === null) {
      return
    }

    await this.mailReconnect(guest, reminder)
    await this.guestModel.updateOne({ email: guest.email }, { reconnect_mails: reminder + 1 })
  }

  async mailReconnect(guest, reminder = 0) {
    const { href, headers } = await this.mailService.unsubscribeOf(guest.email, 'reconnect')
    await this.mailService.send(guest.email, mails.reconnect({ url: this.mailService.url(), sender: this.mailService.sender(), name: guest.name, reminder, unsubscribe: href }), headers)
    await this.guestModel.updateOne({ email: guest.email }, { reconnect_mailed_at: Date.now() })
  }

  // Sent from the Friends page: it goes whatever the settings and the unsubscribe link say, and counts as no reminder
  async reconnect(email: string) {
    const guest = await this.guestModel.findOne({ email }).lean()

    if (!guest) {
      throw new NotFoundException()
    }

    await this.mailReconnect(guest)
    return this.guestModel.findOne({ email }, { reconnect_mailed_at: 1, reconnect_mails: 1 }).lean()
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
