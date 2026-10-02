import { Module } from '@nestjs/common'
import { JobsModule } from '../jobs/jobs.module'
import { UpdateController } from './update.controller'
import { UpdateService } from './update.service'

// The jobs' SensorrService, the one whose running jobs an update has to wait for
@Module({
  imports: [JobsModule],
  controllers: [UpdateController],
  providers: [UpdateService],
})
export class UpdateModule {}
