import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigService } from '../config/config.service'
import { SensorrService } from '../sensorr/sensorr.service'
import { Metafile, MetafileSchema } from '../sensorr/metafile.schema'
import { LogsService } from '../logs/logs.service'
import { Log, LogSchema } from '../logs/log.schema'
import { Movie, MovieSchema } from '../movies/movie.schema'
import { MoviesService } from '../movies/movies.service'
import { GuestsController } from './guests.controller'
import { GuestsService } from './guests.service'
import { Guest, GuestSchema } from './guest.schema'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Guest.name, schema: GuestSchema }]),
    MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }]),
    MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }]),
    MongooseModule.forFeature([{ name: Metafile.name, schema: MetafileSchema }]),
  ],
  controllers: [GuestsController],
  providers: [GuestsService, ConfigService, SensorrService, LogsService, MoviesService],
})
export class GuestsModule {}
