import { Body, Controller, Param, Get, Post, Delete } from '@nestjs/common'
import { Public } from '../auth/auth.decorators'
import { GuestsService } from './guests.service'
import { GuestDTO } from './guest.dto'

@Controller('guests')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Public()
  @Get('/register')
  async register(): Promise<{ done: boolean, code: string, id: string, expiresAt: number }> {
    return this.guestsService.register()
  }

  @Public()
  @Get(':id/status')
  status(@Param('id') id): Promise<{ done: boolean, expired?: boolean }> {
    return this.guestsService.checkRegistration(id)
  }

  @Post()
  async upsertGuest(@Body() guest: GuestDTO) {
    return this.guestsService.upsertGuest(guest)
  }

  @Get()
  async getGuests(): Promise<{}> {
    return this.guestsService.getGuests()
  }

  @Delete()
  async deleteGuest(@Body() guest: GuestDTO) {
    return this.guestsService.deleteGuest(guest)
  }
}
