import path from 'path'
import { fileURLToPath } from 'url'
import { randomBytes } from 'node:crypto'
import { Model } from 'mongoose'
import { BadGatewayException, BadRequestException, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { createTransport } from 'nodemailer'
import { ConfigService } from '../config/config.service'
import { Guest as GuestDocument } from '../guests/guest.schema'
import { Movie } from '../movies/movie.schema'
import { Show } from '../shows/show.schema'
import { Episode } from '../shows/episode.schema'
import { Mail, mails, senderOf } from './templates'
import { arrivalsOf } from './arrivals'
import { Invitation } from './invitation.schema'

export const UNSUBSCRIBABLE = ['reconnect', 'requests']

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// `nx build api` copies `src/assets` into the bundle's folder, in dev and in the image
const PICTOS = path.resolve(`${__dirname}/../../../../../dist/apps/api/assets/mail`)

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)

  constructor(
    @InjectModel(GuestDocument.name) private readonly guestModel: Model<GuestDocument>,
    @InjectModel(Movie.name) private readonly movieModel: Model<Movie>,
    @InjectModel(Show.name) private readonly showModel: Model<Show>,
    @InjectModel(Episode.name) private readonly episodeModel: Model<Episode>,
    @InjectModel(Invitation.name) private readonly invitationModel: Model<Invitation>,
    private configService: ConfigService,
  ) {}

  private get config() {
    return this.configService.config
  }

  missing(): string[] {
    return [
      !this.config.get('mail.host') && 'SMTP host',
      !this.config.get('mail.from') && 'sender',
      !this.config.get('mail.url') && 'address of Sensorr',
    ].filter(Boolean)
  }

  enabled(kind: 'welcome' | 'reconnect' | 'requests' | 'wrapped') {
    const missing = this.missing()
    const reason = missing.length ? `the ${missing.join(', ')} of the Mail settings are missing` : !this.config.get(`mail.send.${kind}`) ? 'it is off in the Mail settings' : null
    reason && this.logger.log(`Mail "${kind}" not sent, ${reason}`)
    return !reason
  }

  url() {
    return this.config.get('mail.url').replace(/\/+$/, '')
  }

  sender() {
    return senderOf(this.config.get('mail.from'))
  }

  async unsubscribeOf(email: string, kind: string) {
    // Written only when absent: two mails sent at once to a new guest carry the same link
    await this.guestModel.updateOne({ email, mail_token: { $exists: false } }, { mail_token: randomBytes(18).toString('base64url') })
    const token = (await this.guestModel.findOne({ email }, { mail_token: 1 }).lean()).mail_token
    const href = `${this.url()}/api/mail/unsubscribe/${token}?kind=${kind}`
    return { href, headers: { 'List-Unsubscribe': `<${href}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } }
  }

  async tokenExists(token: string) {
    return typeof token === 'string' && token ? this.guestModel.exists({ mail_token: token }) : null
  }

  async unsubscribe(token: string, kind: string) {
    if (!UNSUBSCRIBABLE.includes(kind) || typeof token !== 'string' || !token) {
      return null
    }

    const guest = await this.guestModel.findOneAndUpdate({ mail_token: token }, { $addToSet: { mail_unsubscribed: kind } }, { new: true }).lean()
    guest && this.logger.log(`Unsubscribe "${guest.email}" from "${kind}"`)
    return guest
  }

  private ready() {
    const missing = this.missing()

    if (missing.length) {
      throw new BadRequestException(`Mail is not set up, fill the ${missing.join(', ')} on the Mail settings page`)
    }
  }

  async send(to: string, mail: Mail, headers: Record<string, string> = {}) {
    this.ready()

    const transport = createTransport({
      host: this.config.get('mail.host'),
      port: this.config.get('mail.port'),
      secure: this.config.get('mail.secure'),
      ...(this.config.get('mail.user') ? { auth: { user: this.config.get('mail.user'), pass: this.config.get('mail.password') } } : {}),
    })

    try {
      await transport.sendMail({
        from: this.config.get('mail.from'),
        to,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        headers,
        attachments: mail.picto ? [{ filename: `${mail.picto}.png`, path: path.join(PICTOS, `${mail.picto}.png`), cid: mail.picto }] : [],
      })
    } catch (error) {
      throw new BadGatewayException(`The SMTP server refused the mail: ${error.message}`)
    } finally {
      transport.close()
    }

    this.logger.log(`Send "${mail.subject}" to "${to}"`)
  }

  // One by one, an address the SMTP server refuses does not stop the others
  async invite(invitees: { email: string, name?: string }[]) {
    this.ready()
    const results = []

    for (const { email, name } of invitees) {
      try {
        await this.send(email, mails.invitation({ url: this.url(), sender: this.sender(), name }))
      } catch (error) {
        this.logger.warn(`Invitation "${email}" not sent: ${error.message}`)
        results.push({ email, error: error.message })
        continue
      }

      const invited_at = Date.now()
      // The mail is gone: a failed write only loses the date, it must not read as not sent
      await this.invitationModel.updateOne({ email: email.toLowerCase() }, { invited_at }, { upsert: true })
        .catch((error) => this.logger.warn(`Invitation "${email}" sent, its date not kept: ${error.message}`))
      results.push({ email, invited_at })
    }

    return results
  }

  async invitations(emails: string[]) {
    const invitations = await this.invitationModel.find({ email: { $in: emails.map((email) => email.toLowerCase()) } }).lean()
    return Object.fromEntries(invitations.map(({ email, invited_at }) => [email, invited_at]))
  }

  async mailRequests() {
    if (!this.enabled('requests')) {
      return { mailed: 0, failed: [], friends: 0 }
    }

    const guests = await this.guestModel.find({ mail_unsubscribed: { $ne: 'requests' } }).lean()
    let mailed = 0
    const failed = []

    for (const guest of guests) {
      const since = guest.requests_mailed_at || 0
      const now = Date.now()
      const movies = await this.movieModel.find({ requested_by: guest.email, archived_at: { $gt: since } }, { title: 1, release_date: 1, poster_path: 1, plex_url: 1, archived_at: 1 }).lean()
      const shows = await this.showModel.find({ requested_by: guest.email }, { name: 1, poster_path: 1 }).lean()
      const episodes = shows.length ? await this.episodeModel.find({ show_id: { $in: shows.map(({ _id }) => _id) }, files_at: { $gt: since } }, { show_id: 1, season_number: 1, files_at: 1 }).lean() : []
      const arrivals = arrivalsOf({ movies: movies as any, shows: shows as any, episodes: episodes as any })

      if (!arrivals.length) {
        continue
      }

      try {
        const { href, headers } = await this.unsubscribeOf(guest.email, 'requests')
        await this.send(guest.email, mails.requests({ sender: this.sender(), name: guest.name, arrivals, unsubscribe: href }), headers)
        await this.guestModel.updateOne({ email: guest.email }, { requests_mailed_at: now })
        mailed++
      } catch (error) {
        this.logger.warn(`Requests of "${guest.email}" not sent: ${error.message}`)
        failed.push(guest.email)
      }
    }

    return { mailed, failed, friends: guests.length }
  }
}
