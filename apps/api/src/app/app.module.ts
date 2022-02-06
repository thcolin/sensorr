import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ProxyModule } from '@finastra/nestjs-proxy'
import { MoviesModule } from './movies/movies.module'
import { PersonsModule } from './persons/persons.module'
import { JobsModule } from './jobs/jobs.module'
import { PlexModule } from './plex/plex.module'
import { ConfigModule } from './config/config.module'

@Module({
  imports: [
    MongooseModule.forRoot(
      `mongodb://${process.env.NX_MONGO_USERNAME}:${process.env.NX_MONGO_PASSWORD}@${process.env.NX_MONGO_HOST}:${process.env.NX_MONGO_PORT}/${process.env.NX_MONGO_DATABASE}?authSource=admin&directConnection=true`,
      { useFindAndModify: false }
    ),
    ProxyModule.forRoot({
      config: {},
      services: [
        // TODO: Should be populated with ZNAB from config
        // {
        //   id: 'ZNAB_XXX',
        //   url: `https://xxx.xxx`,
        //   config: {}
        // }
      ]
    }),
    MoviesModule,
    PersonsModule,
    JobsModule,
    PlexModule,
    ConfigModule,
  ],
})
export class AppModule {}
