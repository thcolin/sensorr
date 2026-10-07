import { BadRequestException, Controller, Get, HttpException, Logger, Param, ParseIntPipe } from '@nestjs/common'
import { MediuxService } from './mediux.service'
import { typeOf } from './sets'
import { coded } from '../errors'

@Controller('mediux')
export class MediuxController {
  private readonly logger = new Logger(MediuxController.name)

  constructor(private readonly mediuxService: MediuxService) {}

  @Get('sets/:type/:id')
  async sets(@Param('type') raw: string, @Param('id', ParseIntPipe) id: number) {
    const type = typeOf(raw)

    if (!type) {
      throw new BadRequestException(coded('mediux.kind', 'Not a movie nor a show'))
    }

    try {
      return { sets: await this.mediuxService.sets(type, id) }
    } catch (err) {
      this.logger.warn(`Sets ${type} "${id}", ${err.message}`)
      throw new HttpException(coded('mediux.answered', err.message, { reason: err.message }), 502)
    }
  }
}
