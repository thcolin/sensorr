import { Controller, Get } from './shims/nest-common'
import { InjectModel } from './shims/nest-mongoose'

// Stands for `apps/api/src/app/guests/guests.controller.ts`, whose service reaches Plex and sends mails: the demo
// lists the friends whose watchlists became requests, as `GuestsService.getGuests` reads them
@Controller('guests')
export class GuestsController {
  constructor(private readonly guestModel: any) {}

  @Get()
  getGuests() {
    return this.guestModel.paginate({}, { pagination: false, lean: true, leanWithId: true, customLabels: { totalDocs: 'total_results', docs: 'results' } })
  }
}

// Babel, which builds this file, takes no decorator on a parameter
InjectModel('Guest')(GuestsController, undefined, 0)
