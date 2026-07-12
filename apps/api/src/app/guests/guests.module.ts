import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigService } from '../config/config.service'
import { GuestsController } from './guests.controller'
import { GuestsService } from './guests.service'
import { Guest, GuestSchema } from './guest.schema'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Guest.name, schema: GuestSchema }]),
  ],
  controllers: [GuestsController],
  providers: [GuestsService, ConfigService],
})
export class GuestsModule {}
