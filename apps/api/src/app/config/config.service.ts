import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { Injectable, Logger } from '@nestjs/common'
import config from '@sensorr/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name)
  private readonly file = path.resolve(`${__dirname}/../../../../../config.json`)
  config: any = config

  constructor() {
    this.config.loadFile(this.file)
    this.config.set('docker', process.env.NX_API_DOCKER_ENV === 'true')
  }

  async get() {
    this.logger.log(`Read "${this.file}"`)
    return this.config.toString()
  }

  async write() {
    this.config.validate({ allowed: 'strict', output: () => {} })
    await fs.writeFile(this.file, JSON.stringify(JSON.parse(this.config.toString()), null, 2))
    this.logger.log(`Write "${this.file}"`)
  }

  async set(key, value) {
    this.config.set(key, value)
    await this.write()
    this.logger.log(`Set "${key}"`)
  }
}
