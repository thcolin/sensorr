import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigService } from '../config/config.service'
import { ShowsController } from './shows.controller'
import { EpisodesController } from './episodes.controller'
import { ShowsService } from './shows.service'
import { Show, ShowSchema } from './show.schema'
import { Episode, EpisodeSchema } from './episode.schema'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Show.name, schema: ShowSchema }]),
    MongooseModule.forFeature([{ name: Episode.name, schema: EpisodeSchema }]),
  ],
  controllers: [ShowsController, EpisodesController],
  providers: [ShowsService, ConfigService],
})
export class ShowsModule {}
