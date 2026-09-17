import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { defer, fromEventPattern, Observable } from 'rxjs'
import { finalize, share } from 'rxjs/operators'
import { Log as LogDocument } from './log.schema'

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name)

  public readonly changes$: Observable<any> = defer(() => {
    this.logger.log('Changes, opened')
    const stream = this.logModel.watch()

    return fromEventPattern(
      (handler) => stream.on('change', handler),
      (handler) => stream.removeListener('change', handler),
    ).pipe(
      finalize(() => {
        this.logger.log('Changes, closed')
        stream.close()
      }),
    )
  }).pipe(share())

  constructor(@InjectModel(LogDocument.name) private readonly logModel: Model<LogDocument>) {}

  async ammendLogs(match: string[], body: any) {
    this.logger.log(`AmmendLogs "${JSON.stringify(match)}"`)

    try {
      const { insertedCount, modifiedCount } = await this.logModel.bulkWrite(match.map(i => ({
        updateOne: {
          filter: { _id: i },
          update: { _id: i, ...body },
          new: false,
          upsert: true,
        },
      })))

      return { upserted: Number(insertedCount + modifiedCount) }
    } catch (e) {
      console.warn(e)
      return {}
    }
  }

  async ammendLog(match: string | { [key: string]: any }, body: any) {
    this.logger.log(`AmmendLog "${JSON.stringify(match)}"`)

    try {
      await this.logModel.findOneAndUpdate(typeof match === 'string' ? { _id: match } : match, body).lean()
    } catch (e) {
      return {}
    }
  }
}
