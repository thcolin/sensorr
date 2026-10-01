import { Module } from '@nestjs/common'
import { ConfigService } from '../config/config.service'
import { MailController } from './mail.controller'
import { MailService } from './mail.service'

@Module({
  controllers: [MailController],
  providers: [MailService, ConfigService],
  exports: [MailService],
})
export class MailModule {}
