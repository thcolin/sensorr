import { Body, Controller, Param, Patch } from '@nestjs/common'
import { LogsService } from './logs.service'

@Controller('logs')
export class LogsController {
  constructor(
    private readonly logsService: LogsService,
  ) {}

  @Patch()
  async ammendLogs(@Body() { logs, ...body }) {
    return await this.logsService.ammendLogs(logs, body)
  }

  @Patch('/:log')
  async ammendLog(@Param() params, @Body() body) {
    return await this.logsService.ammendLog(params.log, body)
  }
}
