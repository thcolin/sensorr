import { Body, Controller, Delete, Get, HttpException, Logger, OnApplicationBootstrap, Param, Post, Query, Sse } from '@nestjs/common'
import { Observable } from 'rxjs'
import { JobsService } from './jobs.service'
import { Log as LogDocument } from '../logs/log.schema'
import { SensorrService } from '../sensorr/sensorr.service'

@Controller('jobs')
export class JobsController implements OnApplicationBootstrap {
  private readonly logger = new Logger(JobsController.name)

  constructor(
    private readonly jobsService: JobsService,
    private readonly sensorrService: SensorrService
  ) {}

  onApplicationBootstrap() {
    this.jobsService.setupCrons()
  }

  @Sse()
  listenJobs(): Observable<MessageEvent> {
    return this.jobsService.listenJobs()
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
  listenJob(@Param() params, @Query('summarize') summarize): Observable<MessageEvent> {
    return this.jobsService.listenJob(params.job, summarize ? {
      match: { 'meta.important': true },
      test: (doc) => !!doc?.meta?.movie,
    } : null)
  }

  @Get(':job/:group')
  getJobDetails(@Param() params): Promise<LogDocument[]> {
    return this.jobsService.getJob(params.job, {
      match: { 'meta.group': Number(params.group) },
      test: (doc) => Number(doc?.meta?.group) === Number(params.group),
    })
  }

  @Sse(':job/:group')
  listenJobDetails(@Param() params): Observable<MessageEvent> {
    return this.jobsService.listenJob(params.job, {
      match: { 'meta.group': Number(params.group) },
      test: (doc) => Number(doc?.meta?.group) === Number(params.group),
    })
  }

  @Delete('/:job')
  stopJob(@Param() params) {
    this.sensorrService.stopProcess(params.job)
    return { success: true }
  }
}
