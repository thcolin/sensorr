import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { from, fromEventPattern, merge, Observable } from 'rxjs'
import { filter, map, scan } from 'rxjs/operators'
import { Log as LogDocument } from './log.schema'

@Injectable()
export class LogService {
  constructor(@InjectModel(LogDocument.name) private readonly logModel: Model<LogDocument>) {}

  listenJobs(): Observable<MessageEvent> {
    const stream = this.logModel.watch()

    return merge(
      from(this.logModel.find({ 'meta.summary': { $eq: true } }).exec()).pipe(
        map(res => res.reduce((acc, { _doc: { timestamp, message, meta: { job, summary, ...meta } } }: any) => ({
          ...acc,
          [job]: {
            ...acc[job],
            job,
            timestamp,
            messages: [...(acc[job]?.messages || []), message],
            meta: { ...acc[job]?.meta, ...meta },
          },
        }), {})),
      ),
      fromEventPattern(
        (handler) => stream.on('change', handler),
        (handler) => stream.removeListener('change', handler),
      ).pipe(
        filter((change: any) => change?.ns?.coll === 'log' && change?.operationType === 'insert' && change?.fullDocument?.meta?.summary),
      ),
    ).pipe(
      scan((acc, { fullDocument: { timestamp, message, meta: { job, summary, ...meta } } }) => ({
        ...acc,
        current: job,
        [job]: {
          ...acc[job],
          job,
          timestamp,
          messages: [...(acc[job]?.messages || []), message],
          meta: { ...acc[job]?.meta, ...meta },
        },
      })),
      map(jobs => ({ data: jobs.current ? jobs[jobs.current] : jobs } as MessageEvent)),
    )
  }

  listenJob(job: string): Observable<MessageEvent> {
    const stream = this.logModel.watch({ $match: { 'meta.job': { $eq: job } } } as any)

    return merge(
      from(this.logModel.find({ 'meta.job': { $eq: job } }).sort({ timestamp: -1 }).exec()).pipe(
        map(res => ({ data: res.map(({ _doc: { _id, ...data } }: any) => data) } as MessageEvent)),
      ),
      fromEventPattern(
        (handler) => stream.on('change', handler),
        (handler) => stream.removeListener('change', handler),
      ).pipe(
        filter((change: any) => change?.ns?.coll === 'log' && change.operationType === 'insert' && change.fullDocument?.meta?.job === job),
        map(({ fullDocument: { _id, ...data } }) => ({ data } as MessageEvent)),
      )
    )
  }
}
