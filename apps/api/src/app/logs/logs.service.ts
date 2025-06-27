import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Log as LogDocument } from './log.schema'

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name)

  constructor(@InjectModel(LogDocument.name) private readonly logModel: Model<LogDocument>) {}

  async ammendLog(match: string | { [key: string]: any }, body: any) {
    this.logger.log(`AmmendLog "${JSON.stringify(match)}"`)

    try {
      await this.logModel.findOneAndUpdate(typeof match === 'string' ? { _id: match } : match, body).lean()
    } catch (e) {
      return {}
    }
  }
}
