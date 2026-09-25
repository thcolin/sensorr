import { Injectable, Logger } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { CronJob } from 'cron'
import { from, merge, Observable } from 'rxjs'
import { filter, map, scan, tap } from 'rxjs/operators'
import { JOBS } from '@sensorr/sensorr'
import { Log as LogDocument } from '../logs/log.schema'
import { LogsService } from '../logs/logs.service'
import { ConfigService } from '../config/config.service'
import { SensorrService } from '../sensorr/sensorr.service'

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name)
  // The CLI logs a summary value whole, an Accept or a Refuse adds a delta to its log
  private readonly sum = (key, summary, acc) => (typeof summary?.[key] === 'number' || typeof acc?.[key] === 'number') ? { [key]: (summary?.[key] || 0) + (acc?.[key] || 0) } : {}
  private readonly transform = ({ timestamp, message, meta: { job, summary, ...meta } }, acc) => ({
    ...acc,
    job,
    ...(timestamp ? {
      timestamp,
      start: Math.min(acc?.start || Infinity, (timestamp && new Date(timestamp).getTime()) || Infinity),
      end: Math.max(acc?.end || 0, new Date(timestamp).getTime()),
    } : {}),
    messages: [...(acc?.messages || []), message].filter(m => !!m),
    meta: { ...acc?.meta, ...meta, summary: { ...acc?.meta?.summary, ...summary, treated: (summary?.treated || 0) + (acc?.meta?.summary?.treated || 0), ...this.sum('accepted', summary, acc?.meta?.summary) } },
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

    for (const [command, types] of Object.entries(JOBS)) {
      for (const type of types.length ? types : [undefined]) {
        const { cron, paused } = this.configService.config.get(['jobs', command, type].filter(Boolean).join('.'))

        if (!paused) {
          this.setupCron(command, type, cron)
        }
      }
    }
  }

  setupCron(command: string, type: string | undefined, cron: string) {
    const name = [command, type].filter(Boolean).join(' ')
    // runProcess logs why a run did not start
    const job = new CronJob(cron, () => {
      this.sensorrService.runProcess(command, type, cron).catch(() => null)
    })
    this.schedulerRegistry.addCronJob(name, job)
    job.start()
    this.logger.log(`SetupCron "${name}" at "${cron}"`)
  }
}
