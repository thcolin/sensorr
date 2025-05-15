import { Module } from '@nestjs/common'
import { ProxyController } from './proxy.controller'

@Module({
  controllers: [ProxyController],
  providers: [],
})
export class ProxyModule {}

