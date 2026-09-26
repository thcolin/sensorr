import { Body, Controller, Get, Post, Param, Query, ParseIntPipe, Res } from '@nestjs/common'
import { Response } from 'express'
import { WrappedPlay, WrappedTitle } from '@sensorr/sensorr'
import { Public } from '../auth/auth.decorators'
import { WrappedService } from './wrapped.service'

@Controller('wrapped')
export class WrappedController {
  constructor(private readonly wrappedService: WrappedService) {}

  @Public()
  @Get('share/:token')
  async share(@Param('token') token: string, @Query('year') year?: string) {
    return this.wrappedService.share(token, year ? Number(year) || undefined : undefined)
  }

  // `key` goes in the query: a movie guid carries slashes
  @Public()
  @Get('share/:token/images/:kind')
  async image(@Param('token') token: string, @Param('kind') kind: string, @Query('key') key: string, @Query('width', ParseIntPipe) width: number, @Res() res: Response) {
    const { type, buffer } = await this.wrappedService.image(token, key, kind, width)
    res.set({ 'Content-Type': type, 'Cache-Control': 'private, max-age=604800', 'X-Content-Type-Options': 'nosniff' }).send(buffer)
  }

  @Post('viewers')
  async upsertViewers(@Body() viewers: { user_id: number, email: string, username: string, friendly_name: string }[]) {
    return this.wrappedService.upsertViewers(viewers)
  }

  @Post('plays')
  async upsertPlays(@Body() plays: WrappedPlay[]) {
    return this.wrappedService.upsertPlays(plays)
  }

  @Post('plays/prune')
  async prunePlays(@Body('seen') seen: string) {
    return this.wrappedService.prunePlays(seen)
  }

  @Get('plays/range')
  async playsRange() {
    return this.wrappedService.playsRange()
  }

  @Get('titles')
  async titleKeys() {
    return this.wrappedService.titleKeys()
  }

  @Post('titles')
  async upsertTitles(@Body() titles: WrappedTitle[]) {
    return this.wrappedService.upsertTitles(titles)
  }

  @Post('freeze')
  async freeze(@Body('year', ParseIntPipe) year: number) {
    return this.wrappedService.freeze(year)
  }

  @Get('guests')
  async guests() {
    return this.wrappedService.guests()
  }

  @Post('tokens')
  async renewToken(@Body('email') email: string) {
    return this.wrappedService.renewToken(email)
  }
}
