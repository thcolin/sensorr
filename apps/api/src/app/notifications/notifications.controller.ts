import { Body, Controller, Post, Sse } from '@nestjs/common'
import { Observable } from 'rxjs'
import { LogsService } from '../logs/log.service'

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly logsService: LogsService,
  ) {}

  @Sse()
  listenNotifications(): Observable<MessageEvent> {
    return this.logsService.listenNotifications()
  }

  @Post('/seen')
  async seenNotifications(@Body() body) {
    await this.logsService.markNotificationsAsSeen(body)
  }
}
