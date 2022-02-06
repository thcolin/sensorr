import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigService } from '../config/config.service'
import { MoviesController } from './movies.controller'
import { MoviesService } from './movies.service'
import { Movie, MovieSchema } from './movie.schema'

@Module({
  imports: [MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }])],
  controllers: [MoviesController],
  providers: [MoviesService, ConfigService],
})
export class MoviesModule {}
