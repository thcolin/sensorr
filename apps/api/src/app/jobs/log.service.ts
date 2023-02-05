import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { from, fromEventPattern, merge, Observable } from 'rxjs'
import { filter, map, scan, tap } from 'rxjs/operators'
import { Log as LogDocument } from './log.schema'

const transform = ({ timestamp, message, meta: { job, summary, ...meta } }, acc) => ({
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

@Injectable()
export class LogService {
  private readonly logger = new Logger(LogService.name)

  constructor(@InjectModel(LogDocument.name) private readonly logModel: Model<LogDocument>) {}

  listenJobs(): Observable<MessageEvent> {
    this.logger.log('ListenJobs')
    const stream = this.logModel.watch()

    return merge(
      from(this.logModel.find({ 'meta.summary': { $exists: true } }).lean().exec()).pipe(
        map(res => res.reduce((acc, doc: any) => ({ ...acc, [doc?.meta.job]: transform(doc, acc[doc?.meta.job]) }), {})),
      ),
      fromEventPattern(
        (handler) => stream.on('change', handler),
        (handler) => {
          this.logger.log('ListenJobs, closed')
          stream.removeListener('change', handler)
          stream.close()
        },
      ).pipe(
        filter((change: any) => change?.ns?.coll === 'log' && change?.operationType === 'insert' && change?.fullDocument?.meta?.summary),
      ),
    ).pipe(
      scan((acc, { fullDocument: doc }) => ({ ...acc, current: doc?.meta.job, [doc?.meta.job]: transform(doc, acc[doc?.meta.job]) })),
      map((jobs: { [key: string]: any }) => ({ data: jobs.current ? jobs[jobs.current] : jobs } as MessageEvent)),
      tap(() => this.logger.log(`ListenJobs, message=""`)),
    )
  }

  listenJob(job: string): Observable<MessageEvent> {
    this.logger.log(`ListenJob "${job}"`)
    const stream = this.logModel.watch({ $match: { 'meta.job': { $eq: job } } } as any)

    return merge(
      from(this.logModel.find({ 'meta.job': { $eq: job } }).sort({ timestamp: -1 }).lean().exec()).pipe(
        map(res => ({ data: res.map(({ _id, ...data }: any) => data) } as MessageEvent)),
      ),
      fromEventPattern(
        (handler) => stream.on('change', handler),
        (handler) => {
          this.logger.log(`ListenJob "${job}", closed`)
          stream.removeListener('change', handler)
          stream.close()
        },
      ).pipe(
        filter((change: any) => change?.ns?.coll === 'log' && change.operationType === 'insert' && change.fullDocument?.meta?.job === job),
        map(({ fullDocument: { _id, ...data } }) => ({ data } as MessageEvent)),
        tap(() => this.logger.log(`ListenJob "${job}", message=""`)),
      )
    )
  }

  async logJob(log: LogDocument) {
    this.logger.log(`LogJob "${log.meta.job}"`)
    try {
      const parent = await this.logModel.findOne({ 'meta.job': log.meta.job, 'meta.group': log.meta.group }, null, { sort: { timestamp: -1 } }).lean()

      if (!parent) {
        this.logger.log(`No logs for job "${log.meta.job}", likely expired, no need to push "proceeded log"`)
        throw new Error()
      }

      return this.logModel.create({ ...log, timestamp: parent.timestamp })
    } catch (e) {
      return {}
    }
  }
}
