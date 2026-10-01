import path from 'path'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { createTransport } from 'nodemailer'
import { ConfigService } from '../config/config.service'
import { Mail, senderOf } from './templates'

// `nx build api` copies `src/assets` next to `main.js`, which is the script node runs, in dev and in the image
const PICTOS = path.resolve(path.dirname(process.argv[1]), 'assets', 'mail')

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)

  constructor(private configService: ConfigService) {}

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
