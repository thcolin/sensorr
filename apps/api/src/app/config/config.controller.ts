import { Body, Controller, Get, HttpException, Logger, Put } from '@nestjs/common'
import { ConfigService } from './config.service'

@Controller('config')
export class ConfigController {
  private readonly logger = new Logger(ConfigController.name)

  constructor(private readonly configService: ConfigService) {}

  @Get()
  get(): {} {
    return this.configService.get()
  }

  @Put()
  async register(@Body() raw): Promise<{}> {
    try {
      this.configService.set(raw.key, raw.value)
      return { success: true }
    } catch (err) {
      this.logger.error(err)
      throw new HttpException(err, 500)
    }
  }
}
