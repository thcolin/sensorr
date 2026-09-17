import { Injectable, Logger } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { CronJob } from 'cron'
import { from, merge, Observable } from 'rxjs'
import { filter, map, scan, tap } from 'rxjs/operators'
import { Log as LogDocument } from '../logs/log.schema'
import { LogsService } from '../logs/logs.service'
import { ConfigService } from '../config/config.service'
import { SensorrService } from '../sensorr/sensorr.service'

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name)
  private readonly transform = ({ timestamp, message, meta: { job, summary, ...meta } }, acc) => ({
    ...acc,
    job,
    ...(timestamp ? {
      timestamp,
      start: Math.min(acc?.start || Infinity, (timestamp && new Date(timestamp).getTime()) || Infinity),
      end: Math.max(acc?.end || 0, new Date(timestamp).getTime()),
    } : {}),
    messages: [...(acc?.messages || []), message].filter(m => !!m),
    meta: { ...acc?.meta, ...meta, summary: { ...acc?.meta?.summary, ...summary, treated: (summary?.treated || 0) + (acc?.meta?.summary?.treated || 0) } },
  })

  constructor(
    @InjectModel(LogDocument.name) private readonly logModel: Model<LogDocument>,
    private schedulerRegistry: SchedulerRegistry,
    private sensorrService: SensorrService,
    private configService: ConfigService,
    private logsService: LogsService,
  ) {}

  listenJobs(): Observable<MessageEvent> {
    this.logger.log('ListenJobs')

    return merge(
      from(this.logModel.find({ 'meta.summary': { $exists: true } }).lean().exec()).pipe(
        map(res => res.reduce((acc, doc: any) => ({ ...acc, [doc?.meta.job]: this.transform(doc, acc[doc?.meta.job]) }), {})),
      ),
      this.logsService.changes$.pipe(
        filter((change: any) => change?.ns?.coll === 'log' && change?.operationType === 'insert' && change?.fullDocument?.meta?.summary),
      ),
    ).pipe(
      scan((acc, { fullDocument: doc }) => ({ ...acc, current: doc?.meta.job, [doc?.meta.job]: this.transform(doc, acc[doc?.meta.job]) })),
      map((jobs: { [key: string]: any }) => ({ data: jobs.current ? jobs[jobs.current] : jobs } as MessageEvent)),
      tap(() => this.logger.log(`ListenJobs, message=""`)),
    )
  }

  getJob(job: string, additional: null | { match: any, test: (doc: any) => boolean }): Promise<LogDocument[]> {
    this.logger.log(`getJob "${job}"${additional ? ` ${JSON.stringify(additional.match)}` : ''}`)

    return this.logModel.find({ 'meta.job': { $eq: job }, ...(additional ? additional.match : {}) }).sort({ timestamp: 1 }).lean().exec()
  }

  listenJob(job: string, additional: null | { match: any, test: (doc: any) => boolean }): Observable<MessageEvent> {
    this.logger.log(`ListenJob "${job}"${additional ? ` ${JSON.stringify(additional.match)}` : ''}`)

    return merge(
      from(this.logModel.find({ 'meta.job': { $eq: job }, ...(additional ? additional.match : {}) }).sort({ timestamp: -1 }).lean().exec()).pipe(
        map(data => ({ data } as MessageEvent)),
      ),
      this.logsService.changes$.pipe(
        filter((change: any) => change?.ns?.coll === 'log' && change.operationType === 'insert' && change.fullDocument?.meta?.job === job && (!additional || additional.test(change.fullDocument))),
        map(({ fullDocument: data }) => ({ data } as MessageEvent)),
        tap(() => this.logger.log(`ListenJob "${job}", message=""`)),
      )
    )
  }

  setupCrons() {
    this.logger.log(`SetupCrons`)
    Object.entries(this.configService.config.get('jobs'))
      .map(([name, { cron, paused }]: [string, { cron: string, paused: boolean }]) => !paused && this.setupCron(name, cron))
  }

  setupCron(name: string, cron: string) {
    if (!Object.keys(this.configService.config.get('jobs')).includes(name)) {
      throw new Error(`Unknown job "${name}"`)
    }

    const job = new CronJob(cron, () => {
      this.sensorrService.runProcess(name, cron)
    })
    this.schedulerRegistry.addCronJob(name, job)
    job.start()
    this.logger.log(`SetupCron "${name}" at "${cron}"`)
  }

  editCron(name: string, cron: string) {
    this.schedulerRegistry.deleteCronJob(name)
    this.logger.log(`EditCron "${name}", cron="${cron}"`)
    this.setupCron(name, cron)
  }
}
