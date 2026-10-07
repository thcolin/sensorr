import { Body, Controller, Get, NotFoundException, Post } from './shims/nest-common'
import { InjectModel } from './shims/nest-mongoose'

// Stands for `apps/api/src/app/wrapped/wrapped.controller.ts`, whose service reads the plays Tautulli keeps: the demo
// has one wrapped, Alex's, frozen in `editions` by `tools/demo/seed.ts` and opened by the `demo` token of the guest
@Controller('wrapped')
export class WrappedController {
  constructor(private readonly guestModel: any, private readonly editionModel: any) {}

  @Get('years')
  async years() {
    return [...new Set((await this.editionModel.find({}, { year: 1 }).lean()).map(({ year }) => year))]
  }

  @Get('guests')
  async guests() {
    const [guests, editions] = await Promise.all([this.guestModel.find({}).lean(), this.editionModel.find({}, { user_id: 1 }).lean()])
    // A friend with a wrapped is a viewer of the server, the others are not
    return guests.map(({ email, name, wrapped_token }) => ({
      email,
      wrapped_token: wrapped_token || null,
      viewer: wrapped_token && editions.length ? editions[0].user_id : null,
      username: wrapped_token ? name : null,
    }))
  }

  // The demo's wrapped is at one address, a renewed link keeps it
  @Post('tokens')
  async renewToken(email: string) {
    const guest = typeof email === 'string' ? await this.guestModel.findOne({ email }).lean() : null

    if (!guest?.wrapped_token) {
      throw new NotFoundException()
    }

    return { email, wrapped_token: guest.wrapped_token }
  }
}

// Babel, which builds this file, takes no decorator on a parameter
InjectModel('Guest')(WrappedController, undefined, 0)
InjectModel('Edition')(WrappedController, undefined, 1)
Body('email')(WrappedController.prototype, 'renewToken', 0)
