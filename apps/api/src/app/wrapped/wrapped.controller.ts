import { Body, Controller, Get, Post, Delete, Param, Query, ParseIntPipe } from '@nestjs/common'
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

  @Post('viewers')
  async upsertViewers(@Body() viewers: { user_id: number, email: string, username: string, friendly_name: string }[]) {
    return this.wrappedService.upsertViewers(viewers)
  }

  @Post('plays')
  async upsertPlays(@Body() plays: WrappedPlay[]) {
    return this.wrappedService.upsertPlays(plays)
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

  @Delete('tokens')
  async revokeToken(@Body('email') email: string) {
    return this.wrappedService.revokeToken(email)
  }

  @Get(':user_id')
  async wrapped(@Param('user_id', ParseIntPipe) user_id: number, @Query('year') year?: string) {
    return this.wrappedService.wrapped(user_id, Number(year) || this.wrappedService.currentEdition())
  }
}
