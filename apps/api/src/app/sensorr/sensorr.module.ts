import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigService } from '../config/config.service'
import { SensorrController } from './sensorr.controller'
import { SensorrService } from './sensorr.service'
import { Metafile, MetafileSchema } from './metafile.schema'

@Module({
  imports: [MongooseModule.forFeature([{ name: Metafile.name, schema: MetafileSchema }])],
  controllers: [SensorrController],
  providers: [SensorrService, ConfigService],
})
export class SensorrModule {}
