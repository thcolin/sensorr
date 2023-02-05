import { Body, Controller, Delete, HttpException, Logger, Param, Post, Sse } from '@nestjs/common'
import { Observable } from 'rxjs'
import { PlexService } from './plex.service'

@Controller('plex')
export class PlexController {
  private readonly logger = new Logger(PlexController.name)

  constructor(private readonly plexService: PlexService) {}

  @Post()
  register(@Body() raw): Promise<{ code: string, id: string }> {
    return this.plexService.register(raw.url)
  }

  @Delete()
  async reset(): Promise<{}> {
    try {
      await this.plexService.reset()
      return { success: true }
    } catch (err) {
      this.logger.error(err)
      throw new HttpException(err, 500)
    }
  }

  @Sse(':id')
  status(@Param() params): Observable<MessageEvent> {
    return this.plexService.listenStatus(params.id)
  }
}
