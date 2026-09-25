import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { NotificationsController } from './notifications.controller'
import { NotificationsService } from './notifications.service'
import { Log, LogSchema } from '../logs/log.schema'
import { Subscription, SubscriptionSchema } from './subscription.schema'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }]),
    MongooseModule.forFeature([{ name: Subscription.name, schema: SubscriptionSchema }]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
  ],
})
export class NotificationsModule {}
