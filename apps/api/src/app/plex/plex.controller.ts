import { Body, Controller, Delete, HttpException, Param, Post, Sse } from '@nestjs/common'
import { Observable } from 'rxjs'
import { PlexService } from './plex.service'

@Controller('plex')
export class PlexController {
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
    } catch (e) {
      throw new HttpException(e, 500)
    }
  }

  @Sse(':id')
  status(@Param() params): Observable<MessageEvent> {
    return this.plexService.listenStatus(params.id)
  }
}
