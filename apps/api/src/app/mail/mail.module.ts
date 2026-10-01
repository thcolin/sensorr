import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigService } from '../config/config.service'
import { Guest, GuestSchema } from '../guests/guest.schema'
import { Movie, MovieSchema } from '../movies/movie.schema'
import { Show, ShowSchema } from '../shows/show.schema'
import { Episode, EpisodeSchema } from '../shows/episode.schema'
import { MailController } from './mail.controller'
import { MailService } from './mail.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Guest.name, schema: GuestSchema },
      { name: Movie.name, schema: MovieSchema },
      { name: Show.name, schema: ShowSchema },
      { name: Episode.name, schema: EpisodeSchema },
    ]),
  ],
  controllers: [MailController],
  providers: [MailService, ConfigService],
  exports: [MailService],
})
export class MailModule {}
