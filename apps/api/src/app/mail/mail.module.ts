import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigService } from '../config/config.service'
import { Guest, GuestSchema } from '../guests/guest.schema'
import { MailController } from './mail.controller'
import { MailService } from './mail.service'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Guest.name, schema: GuestSchema }]),
  ],
  controllers: [MailController],
  providers: [MailService, ConfigService],
  exports: [MailService],
})
export class MailModule {}
