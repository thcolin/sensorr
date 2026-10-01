import { BadRequestException, Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common'
import { Response } from 'express'
import { Public } from '../auth/auth.decorators'
import { MailService, UNSUBSCRIBABLE } from './mail.service'
import { mails, unsubscribePage } from './templates'

// One address, nothing a header could be built from
const ADDRESS = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/

const addressOf = (to: string) => {
  if (typeof to !== 'string' || !ADDRESS.test(to.trim())) {
    throw new BadRequestException(`"${to}" is not an email address`)
  }

  return to.trim()
}

const html = (res: Response, page: string) => res.set({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }).send(page)

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('test')
  async test(@Body('to') to: string) {
    await this.mailService.send(addressOf(to), mails.test({ url: this.mailService.url() }))
    return { success: true }
  }

  // `to` lists the friends to invite, each with the name the mail greets them with when Plex gave one
  @Post('invitation')
  async invitation(@Body('to') to: { email: string, name?: string }[]) {
    if (!Array.isArray(to) || !to.length) {
      throw new BadRequestException('A list of friends to invite is required')
    }

    return this.mailService.invite(to.map((friend) => ({ email: addressOf(friend?.email), name: typeof friend?.name === 'string' && friend.name.trim() ? friend.name.trim().slice(0, 100) : undefined })))
  }

  @Post('requests')
  async requests() {
    return this.mailService.mailRequests()
  }

  @Public()
  @Get('unsubscribe/:token')
  async confirm(@Param('token') token: string, @Query('kind') kind: string, @Res() res: Response) {
    const found = UNSUBSCRIBABLE.includes(kind) && !!(await this.mailService.tokenExists(token))
    return html(res, unsubscribePage({ kind, done: false, found }))
  }

  // The form of the page, and the one-click unsubscribe of mail clients from the `List-Unsubscribe-Post` header
  @Public()
  @Post('unsubscribe/:token')
  async unsubscribe(@Param('token') token: string, @Query('kind') kind: string, @Res() res: Response) {
    const guest = await this.mailService.unsubscribe(token, kind)
    return html(res, unsubscribePage({ kind, done: !!guest, found: !!guest }))
  }
}
