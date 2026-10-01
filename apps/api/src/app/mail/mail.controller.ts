import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import { MailService } from './mail.service'
import { mails } from './templates'

// One address, nothing a header could be built from
const ADDRESS = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/

const addressOf = (to: string) => {
  if (typeof to !== 'string' || !ADDRESS.test(to.trim())) {
    throw new BadRequestException(`"${to}" is not an email address`)
  }

  return to.trim()
}

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('test')
  async test(@Body('to') to: string) {
    await this.mailService.send(addressOf(to), mails.test({ url: this.mailService.url() }))
    return { success: true }
  }

  @Post('invitation')
  async invitation(@Body('to') to: string) {
    await this.mailService.send(addressOf(to), mails.invitation({ url: this.mailService.url(), sender: this.mailService.sender() }))
    return { success: true }
  }
}
