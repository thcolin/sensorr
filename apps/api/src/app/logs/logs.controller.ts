import { Body, Controller, Param, Patch } from '@nestjs/common'
import { LogsService } from './logs.service'

@Controller('logs')
export class LogsController {
  constructor(
    private readonly logsService: LogsService,
  ) {}

  @Patch('/:log')
  async ammendLog(@Param() params, @Body() body) {
    return await this.logsService.ammendLog(params.log, body)
  }
}
