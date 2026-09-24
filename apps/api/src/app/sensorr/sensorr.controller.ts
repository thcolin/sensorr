import { Body, Controller, Delete, HttpException, Logger, Post, Query } from '@nestjs/common'
import { SensorrService } from './sensorr.service'
import { ReleaseDTO } from '../movies/release.dto'

@Controller('sensorr')
export class SensorrController {
  private readonly logger = new Logger(SensorrController.name)

  constructor(private readonly sensorrService: SensorrService) {}

  @Post('/release/download')
  async downloadRelease(
    @Body() release: ReleaseDTO,
    @Query('source') source:('enclosure' | 'cache') = 'enclosure',
    @Query('destination') destination:('fs' | 'cache') = 'fs',
    @Query('kind') kind:('movie' | 'show') = 'movie',
  ) {
    try {
      const torrent = await this.sensorrService.downloadRelease(release, source, destination, kind)
      return { success: true, ...(torrent ? { torrent } : {}) }
    } catch (err) {
      this.logger.error(err)
      throw new HttpException(err, 500)
    }
  }

  @Delete('/release')
  async removeRelease(
    @Body() release: ReleaseDTO
  ) {
    try {
      await this.sensorrService.removeRelease(release)
      return { success: true }
    } catch (err) {
      this.logger.error(err)
      throw new HttpException(err, 500)
    }
  }
}
