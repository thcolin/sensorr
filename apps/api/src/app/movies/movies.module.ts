import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { MoviesController } from './movies.controller'
import { MoviesService } from './movies.service'
import { Movie, MovieSchema } from './movie.schema'

@Module({
  imports: [MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }])],
  controllers: [MoviesController],
  providers: [MoviesService],
})
export class MoviesModule {}
