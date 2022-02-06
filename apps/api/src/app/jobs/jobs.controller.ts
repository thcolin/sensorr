import { Controller, Param, Sse } from '@nestjs/common'
import { Observable } from 'rxjs'
import { LogService } from './log.service'

@Controller('jobs')
export class JobsController {
  constructor(private readonly logService: LogService) {}

  @Sse()
  listenJobs(): Observable<MessageEvent> {
    return this.logService.listenJobs()
  }

  @Sse(':job')
  listenJob(@Param() params): Observable<MessageEvent> {
    return this.logService.listenJob(params.job)
  }
}
