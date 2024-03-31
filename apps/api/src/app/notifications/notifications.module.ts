import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { NotificationsController } from './notifications.controller'
import { LogsService } from '../logs/log.service'
import { Log, LogSchema } from '../logs/log.schema'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }]),
  ],
  controllers: [NotificationsController],
  providers: [
    LogsService,
  ],
})
export class NotificationsModule {}
