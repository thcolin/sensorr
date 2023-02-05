import { Body, Controller, Delete, Get, HttpException, Logger, OnApplicationBootstrap, Param, Post, Sse } from '@nestjs/common'
import { Observable } from 'rxjs'
import { JobsService } from './jobs.service'
import { LogService } from './log.service'
import { SensorrService } from '../sensorr/sensorr.service'

@Controller('jobs')
export class JobsController implements OnApplicationBootstrap {
  private readonly logger = new Logger(JobsController.name)

  constructor(
    private readonly logService: LogService,
    private readonly jobsService: JobsService,
    private readonly sensorrService: SensorrService
  ) {}

  onApplicationBootstrap() {
    this.jobsService.setupCrons()
  }

  @Sse()
  listenJobs(): Observable<MessageEvent> {
    return this.logService.listenJobs()
  }

  @Sse('/status')
  listenStatus(): Observable<MessageEvent> {
    return this.sensorrService.listenStatus()
  }

  @Post()
  async runJob(@Body() body) {
    if (!this.sensorrService.ALLOWED_COMMANDS.includes(body.command)) {
      throw new HttpException(`Unknown Sensorr command "${body.command}"`, 404)
    }

    try {
      const job = await this.sensorrService.runProcess(body.command)
      return { success: true, job }
    } catch (err) {
      this.logger.error(err)
      throw new HttpException(err, 500)
    }
  }

  @Sse(':job')
  listenJob(@Param() params): Observable<MessageEvent> {
    return this.logService.listenJob(params.job)
  }

  @Delete('/:job')
  stopJob(@Param() params) {
    this.sensorrService.stopProcess(params.job)
    return { success: true }
  }

  @Post('/:job/logs')
  async logJob(@Body() body) {
    return await this.logService.logJob(body)
  }
}
