import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { JobsController } from './jobs.controller'
import { LogService } from './log.service'
import { Log, LogSchema } from './log.schema'

@Module({
  imports: [MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }])],
  controllers: [JobsController],
  providers: [LogService],
})
export class JobsModule {}
