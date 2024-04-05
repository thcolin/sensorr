import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { LogsController } from './logs.controller'
import { LogsService } from './logs.service'
import { Log, LogSchema } from './log.schema'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }]),
  ],
  controllers: [LogsController],
  providers: [
    LogsService,
  ],
})
export class LogsModule {}
