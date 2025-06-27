import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigService } from '../config/config.service'
import { Log, LogSchema } from '../logs/log.schema'
import { LogsService } from '../logs/logs.service'
import { SensorrService } from '../sensorr/sensorr.service'
import { Metafile, MetafileSchema } from '../sensorr/metafile.schema'
import { MoviesController } from './movies.controller'
import { MoviesService } from './movies.service'
import { Movie, MovieSchema } from './movie.schema'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }]),
    MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }]),
    MongooseModule.forFeature([{ name: Metafile.name, schema: MetafileSchema }]),
  ],
  controllers: [MoviesController],
  providers: [MoviesService, ConfigService, SensorrService, LogsService],
})
export class MoviesModule {}
