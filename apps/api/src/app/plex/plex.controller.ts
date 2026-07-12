import { Body, Controller, Delete, Get, HttpException, Logger, Param, Post } from '@nestjs/common'
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

  @Get(':id/status')
  status(@Param('id') id): Promise<{ done: boolean, token?: string, expired?: boolean, error?: string }> {
    return this.plexService.checkStatus(id)
  }
}
