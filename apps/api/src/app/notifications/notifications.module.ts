import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { NotificationsController } from './notifications.controller'
import { NotificationsService } from './notifications.service'
import { Log, LogSchema } from '../logs/log.schema'
import { LogsModule } from '../logs/logs.module'
import { Subscription, SubscriptionSchema } from './subscription.schema'

@Module({
  imports: [
    LogsModule,
    MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }]),
    MongooseModule.forFeature([{ name: Subscription.name, schema: SubscriptionSchema }]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
  ],
})
export class NotificationsModule {}
