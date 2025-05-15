import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ScheduleModule } from '@nestjs/schedule'
import { ProxyModule } from './proxy/proxy.module'
import { AuthModule } from './auth/auth.module'
import { MoviesModule } from './movies/movies.module'
import { PersonsModule } from './persons/persons.module'
import { GuestsModule } from './guests/guests.module'
import { JobsModule } from './jobs/jobs.module'
import { LogsModule } from './logs/logs.module'
import { NotificationsModule } from './notifications/notifications.module'
import { PlexModule } from './plex/plex.module'
import { ConfigModule } from './config/config.module'
import { SensorrModule } from './sensorr/sensorr.module'

@Module({
  imports: [
    MongooseModule.forRoot(`mongodb://${process.env.NX_MONGO_USERNAME}:${process.env.NX_MONGO_PASSWORD}@${process.env.NX_MONGO_HOST}:${process.env.NX_MONGO_PORT}/sensorr?authSource=admin&directConnection=true`),
    ScheduleModule.forRoot(),
    ProxyModule,
    AuthModule,
    MoviesModule,
    PersonsModule,
    GuestsModule,
    JobsModule,
    LogsModule,
    NotificationsModule,
    PlexModule,
    ConfigModule,
    SensorrModule,
  ],
})
export class AppModule {}
