import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Movie, MovieSchema } from '../movies/movie.schema'
import { MoviesService } from '../movies/movies.service'
import { GuestsController } from './guests.controller'
import { GuestsService } from './guests.service'
import { Guest, GuestSchema } from './guest.schema'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Guest.name, schema: GuestSchema }]),
    MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }])
  ],
  controllers: [GuestsController],
  providers: [GuestsService, MoviesService],
})
export class GuestsModule {}
