import path from 'path'
import { fileURLToPath } from 'url'
import { randomBytes } from 'node:crypto'
import { Model } from 'mongoose'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { createTransport } from 'nodemailer'
import { ConfigService } from '../config/config.service'
import { Guest as GuestDocument } from '../guests/guest.schema'
import { Movie } from '../movies/movie.schema'
import { Show } from '../shows/show.schema'
import { Episode } from '../shows/episode.schema'
import { Mail, mails, senderOf } from './templates'
import { arrivalsOf } from './arrivals'

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
    return !this.missing().length && this.config.get(`mail.send.${kind}`)
  }

  url() {
    return this.config.get('mail.url').replace(/\/+$/, '')
  }

  sender() {
    return senderOf(this.config.get('mail.from'))
  }

  async unsubscribeOf(email: string, kind: string) {
    const guest = await this.guestModel.findOne({ email }, { mail_token: 1 }).lean()
    const token = guest?.mail_token || (await this.guestModel.findOneAndUpdate({ email }, { mail_token: randomBytes(18).toString('base64url') }, { new: true }).lean()).mail_token
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

  async send(to: string, mail: Mail, headers: Record<string, string> = {}) {
    const missing = this.missing()

    if (missing.length) {
      throw new BadRequestException(`Mail is not set up, fill the ${missing.join(', ')} on the Mail settings page`)
    }

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
      this.logger.error(`Send "${mail.subject}" to "${to}" failed: ${error.message}`)
      throw new BadRequestException(`The SMTP server refused the mail: ${error.message}`)
    } finally {
      transport.close()
    }

    this.logger.log(`Send "${mail.subject}" to "${to}"`)
  }

  async mailRequests() {
    if (!this.enabled('requests')) {
      return { mailed: 0, friends: 0 }
    }

    const guests = await this.guestModel.find({ mail_unsubscribed: { $ne: 'requests' } }).lean()
    let mailed = 0

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
      }
    }

    return { mailed, friends: guests.length }
  }
}
