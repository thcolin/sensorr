import { Module } from '@nestjs/common'
import { ConfigService } from '../config/config.service'
import { PlexController } from './plex.controller'
import { PlexService } from './plex.service'

@Module({
  controllers: [PlexController],
  providers: [PlexService, ConfigService],
})
export class PlexModule {}
