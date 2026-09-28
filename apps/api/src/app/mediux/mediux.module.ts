import { Module } from '@nestjs/common'
import { ConfigService } from '../config/config.service'
import { MediuxController } from './mediux.controller'
import { MediuxService } from './mediux.service'

@Module({
  controllers: [MediuxController],
  providers: [MediuxService, ConfigService],
})
export class MediuxModule {}
