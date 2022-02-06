import { Body, Controller, HttpException, Put } from '@nestjs/common'
import { ConfigService } from './config.service'

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Put()
  async register(@Body() raw): Promise<{}> {
    try {
      this.configService.config.set(raw.key, raw.value)
      await this.configService.write()
      return { success: true }
    } catch (e) {
      throw new HttpException(e, 500)
    }
  }
}
