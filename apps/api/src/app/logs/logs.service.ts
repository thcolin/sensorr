import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Log as LogDocument } from './log.schema'

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name)

  constructor(@InjectModel(LogDocument.name) private readonly logModel: Model<LogDocument>) {}

  async ammendLog(_id: string, body: any) {
    this.logger.log(`AmmendLog "${_id}"`)

    try {
      await this.logModel.findByIdAndUpdate(_id, body).lean()
    } catch (e) {
      return {}
    }
  }
}
