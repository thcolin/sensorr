import { Model, PaginateModel, PaginateResult } from 'mongoose'
import { BadGatewayException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Plex, createPin, checkPin, PlexApp } from '@sensorr/plex'
import { ConfigService } from '../config/config.service'
import { MailService } from '../mail/mail.service'
import { WrappedService } from '../wrapped/wrapped.service'
import { mails } from '../mail/templates'
import { Play, Viewer } from '../wrapped/wrapped.schema'
import { Guest as GuestDocument } from './guest.schema'
import { reminderOf } from './reminders'
import { invitableOf, sharedIdsOf, sharedUsersOf } from './shared'
// The app version lives in the workspace package.json, outside any project
// eslint-disable-next-line @nx/enforce-module-boundaries
import app from './../../../../../package.json'
import { coded } from '../errors'

@Injectable()
export class GuestsService {
  private readonly logger = new Logger(GuestsService.name)

  constructor(
    @InjectModel(GuestDocument.name) private readonly guestModel: PaginateModel<GuestDocument>,
    @InjectModel(Viewer.name) private readonly viewerModel: Model<Viewer>,
    @InjectModel(Play.name) private readonly playModel: Model<Play>,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private mailService: MailService,
    private wrappedService: WrappedService,
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
  async checkRegistration(id, code: string): Promise<{ done: boolean, expired?: boolean, refused?: boolean, wrapped?: { token: string, look: string } | null }> {
    const result = await checkPin(id, this.plexApp())

    // The status is public and Plex numbers its PINs in a row: the code proves the PIN is this visitor's
    if (result.status === 'invalid' || result.code !== code) {
      this.logger.log(`CheckRegistration "${id}", status="${result.status === 'invalid' ? 'invalid' : 'wrong code'}"`)
      return { done: false, expired: true }
    }

    if (result.status !== 'authorized') {
      return { done: false }
    }

    this.logger.log(`CheckRegistration "${id}", status="authorized", registered`)
    const { id: account, email, thumb: avatar, title, username } = await Plex(
      { url: 'https://plex.tv:443', token: result.token, fallbackPort: 443 },
      this.plexApp(),
    ).query(`/api/v2/user`)
    const known = await this.guestModel.exists({ email })

    if (!known && !(await this.allowed(account))) {
      this.logger.log(`CheckRegistration "${id}", account "${account}" refused, the Plex server is not shared with it`)
      return { done: false, refused: true }
    }

    // The token was just issued, it works until the next keep-in-touch says otherwise
    const { updated: guest, reconnected } = await this.writeGuest({ email, avatar, name: title || username, plex_id: id, plex_token: result.token, plex_token_valid: true, plex_token_checked_at: Date.now() })
    // The status is polled, several polls of one PIN may land here: the first to write the date sends the welcome
    const first = !known && (await this.guestModel.updateOne({ email, welcome_mailed_at: { $exists: false } }, { welcome_mailed_at: Date.now() })).modifiedCount === 1
    const wrapped = await this.wrappedService.linkOf(email).catch((error) => {
      this.logger.warn(`Wrapped of "${email}" not linked: ${error.message}`)
      return null
    })

    if (first && this.mailService.enabled('welcome')) {
      this.mailService.service()
        .then((service) => this.mailService.send(email, mails.welcome({ t: this.mailService.t(), url: this.mailService.url(), sender: this.mailService.sender(), service, name: guest.name, wrapped: wrapped?.token })))
        .catch((error) => this.logger.warn(`Welcome "${email}" not sent: ${error.message}`))
    }

    // Only a friend who links again gets it: a token keep-in-touch finds working again sends nothing
    if (reconnected && this.mailService.enabled('reconnect')) {
      this.mailService.service()
        .then((service) => this.mailService.send(email, mails.reconnected({ t: this.mailService.t(), sender: this.mailService.sender(), service, name: guest.name })))
        .catch((error) => this.logger.warn(`Reconnected "${email}" not sent: ${error.message}`))
    }

    return { done: true, wrapped }
  }

  private async plexTv(url: string) {
    const headers = { 'X-Plex-Token': this.configService.config.get('plex.token'), 'X-Plex-Client-Identifier': this.plexApp().plex, 'X-Plex-Product': this.plexApp().name, Accept: 'application/json' }
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) })

    if (!res.ok) {
      throw new Error(`plex.tv answered ${res.status} on ${url}, is the Plex token of Sensorr still valid?`)
    }

    return res.text()
  }

  // The owner of the Plex server and the users it is shared with, read from plex.tv with its token
  private async allowed(account: number) {
    if (this.configService.config.get('guests.public') || !this.configService.config.get('plex.token')) {
      return true
    }

    const [owner, shared] = await Promise.all(['https://plex.tv/api/v2/user', 'https://plex.tv/api/users'].map((url) => this.plexTv(url)))
    return Number(account) === Number(JSON.parse(owner).id) || sharedIdsOf(shared).has(Number(account))
  }

  // Plays come from what the `wrapped` job imports from Tautulli, not from Tautulli itself
  async shared() {
    if (!this.configService.config.get('plex.token')) {
      return { plex: false, tautulli: false, results: [] }
    }

    const xml = await this.plexTv('https://plex.tv/api/users').catch((error) => {
      throw new BadGatewayException(coded('plex.answered', error.message, { reason: error.message }))
    })
    const users = sharedUsersOf(xml).filter(({ email }) => email)
    const guests = (await this.guestModel.find({}, { email: 1 }).lean()).map(({ email }) => email)
    const viewers = await this.viewerModel.find({ email: { $nin: [null, ''] } }, { email: 1 }).lean()
    const ids = viewers.filter(({ email }) => users.some((user) => user.email.toLowerCase() === email.toLowerCase())).map(({ _id }) => _id)
    const activity = await this.playModel.aggregate<{ _id: number, plays: number, seen: number }>([
      { $match: { user_id: { $in: ids } } },
      { $group: { _id: '$user_id', plays: { $sum: 1 }, seen: { $max: '$started' } } },
    ])
    const invited = await this.mailService.invitations(users.map(({ email }) => email))

    return { plex: true, tautulli: viewers.length > 0, results: invitableOf({ users, guests, viewers, activity, invited }) }
  }

  async upsertGuest(guest): Promise<any> {
    return (await this.writeGuest(guest)).updated
  }

  // The previous state is read by the write itself: of two polls of one PIN, only one sees the reconnection
  private async writeGuest(guest) {
    this.logger.log(`UpsertGuest "${guest.email}"`)
    const previous = await this.guestModel.findOneAndUpdate({ email: guest.email }, guest, { returnDocument: 'before', upsert: true }).lean()
    const reconnected = guest.plex_token_valid === true && previous?.plex_token_valid === false

    if (reconnected) {
      await this.guestModel.updateOne({ email: guest.email, plex_token_valid: true }, { reconnect_mails: 0, reconnect_mailed_at: null })
    }

    const updated = await this.guestModel.findOne({ email: guest.email }).lean()

    if (guest.plex_token_valid === false && previous && this.mailService.enabled('reconnect') && !updated.mail_unsubscribed?.includes('reconnect')) {
      await this.remind(updated).catch((error) => this.logger.warn(`Reconnect "${guest.email}" not sent: ${error.message}`))
    }

    return { updated, reconnected }
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
    await this.mailService.send(guest.email, mails.reconnect({ t: this.mailService.t(), url: this.mailService.url(), sender: this.mailService.sender(), service: await this.mailService.service(), name: guest.name, reminder, unsubscribe: href }), headers)
    await this.guestModel.updateOne({ email: guest.email }, { reconnect_mailed_at: Date.now() })
  }

  // Sent from the Friends page: it goes whatever the settings and the unsubscribe link say, and counts as no reminder
  async reconnect(email: string) {
    const guest = typeof email === 'string' ? await this.guestModel.findOne({ email }).lean() : null

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
