import { Body, Controller, Post, Sse } from '@nestjs/common'
import { Observable } from 'rxjs'
import { NotificationsService } from './notifications.service'
import { SubscriptionDTO } from './subscription.dto'

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {
    this.notificationsService.dispatchWebPushNotifications()
  }

  @Sse()
  listenNotifications(): Observable<MessageEvent> {
    return this.notificationsService.listenNotifications()
  }

  @Post('/subscribe')
  async subscribeNotifications(@Body() subscription: SubscriptionDTO) {
    return this.notificationsService.subscribeNotifications(subscription)
  }
}
