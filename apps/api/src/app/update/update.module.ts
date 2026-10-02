import { Module } from '@nestjs/common'
import { JobsModule } from '../jobs/jobs.module'
import { UpdateController } from './update.controller'
import { UpdateService } from './update.service'

// JobsModule's SensorrService is the instance that runs the jobs an update waits for
@Module({
  imports: [JobsModule],
  controllers: [UpdateController],
  providers: [UpdateService],
})
export class UpdateModule {}
