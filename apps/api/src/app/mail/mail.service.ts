import path from 'path'
import { randomBytes } from 'node:crypto'
import { Model } from 'mongoose'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { createTransport } from 'nodemailer'
import { ConfigService } from '../config/config.service'
import { Guest as GuestDocument } from '../guests/guest.schema'
import { Mail, senderOf } from './templates'

// The mails a friend can stop from their own link, the ones that come back on their own
export const UNSUBSCRIBABLE = ['reconnect', 'requests']

// `nx build api` copies `src/assets` next to `main.js`, which is the script node runs, in dev and in the image
const PICTOS = path.resolve(path.dirname(process.argv[1]), 'assets', 'mail')

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)

  constructor(
    @InjectModel(GuestDocument.name) private readonly guestModel: Model<GuestDocument>,
    private configService: ConfigService,
  ) {}

  private get config() {
    return this.configService.config
  }

  // What a mail needs before it can leave: a server to send through, a sender, and an address for its links
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

  // A mail that comes back on its own carries its unsubscribe link, in the footer and in the headers mail clients read
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
}
