import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ScheduleModule } from '@nestjs/schedule'
import { ProxyModule } from '@finastra/nestjs-proxy'
import { AuthModule } from './auth/auth.module'
import { MoviesModule } from './movies/movies.module'
import { PersonsModule } from './persons/persons.module'
import { GuestsModule } from './guests/guests.module'
import { JobsModule } from './jobs/jobs.module'
import { PlexModule } from './plex/plex.module'
import { ConfigModule } from './config/config.module'
import { SensorrModule } from './sensorr/sensorr.module'
import { ProxyConfigService } from './proxy/proxy.service'

@Module({
  imports: [
    MongooseModule.forRoot(`mongodb://${process.env.NX_MONGO_USERNAME}:${process.env.NX_MONGO_PASSWORD}@${process.env.NX_MONGO_HOST}:${process.env.NX_MONGO_PORT}/sensorr?authSource=admin&directConnection=true`),
    ProxyModule.forRootAsync({ useClass: ProxyConfigService }),
    ScheduleModule.forRoot(),
    AuthModule,
    MoviesModule,
    PersonsModule,
    GuestsModule,
    JobsModule,
    PlexModule,
    ConfigModule,
    SensorrModule,
  ],
})
export class AppModule {}
