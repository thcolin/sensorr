import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { JobsController } from './jobs.controller'
import { JobsService } from './jobs.service'
import { SensorrService } from '../sensorr/sensorr.service'
import { ConfigService } from '../config/config.service'
import { Log, LogSchema } from '../logs/log.schema'
import { LogsModule } from '../logs/logs.module'
import { Metafile, MetafileSchema } from '../sensorr/metafile.schema'

@Module({
  imports: [
    LogsModule,
    MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }]),
    MongooseModule.forFeature([{ name: Metafile.name, schema: MetafileSchema }]),
  ],
  controllers: [JobsController],
  providers: [
    JobsService,
    SensorrService,
    ConfigService,
  ],
})
export class JobsModule {}
