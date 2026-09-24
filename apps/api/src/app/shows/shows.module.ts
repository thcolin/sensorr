import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigService } from '../config/config.service'
import { LogsModule } from '../logs/logs.module'
import { SensorrService } from '../sensorr/sensorr.service'
import { Metafile, MetafileSchema } from '../sensorr/metafile.schema'
import { ShowsController } from './shows.controller'
import { EpisodesController } from './episodes.controller'
import { ShowsService } from './shows.service'
import { Show, ShowSchema } from './show.schema'
import { Episode, EpisodeSchema } from './episode.schema'

@Module({
  imports: [
    LogsModule,
    MongooseModule.forFeature([{ name: Show.name, schema: ShowSchema }]),
    MongooseModule.forFeature([{ name: Episode.name, schema: EpisodeSchema }]),
    MongooseModule.forFeature([{ name: Metafile.name, schema: MetafileSchema }]),
  ],
  controllers: [ShowsController, EpisodesController],
  providers: [ShowsService, ConfigService, SensorrService],
})
export class ShowsModule {}
