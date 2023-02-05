import { Body, Controller, Param, Get, Post, Sse, Delete } from '@nestjs/common'
import { Observable } from 'rxjs'
import { Public } from '../auth/auth.decorators'
import { GuestsService } from './guests.service'
import { GuestDTO } from './guest.dto'

@Controller('guests')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Public()
  @Get('/register')
  register(): Promise<{ done: boolean, code: string, id: string }> {
    return this.guestsService.register()
  }

  @Public()
  @Sse(':id')
  status(@Param() params): Observable<MessageEvent> {
    return this.guestsService.listenRegistration(params.id)
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
