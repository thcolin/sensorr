import fs from 'fs/promises'
import path from 'path'
import config from '@sensorr/config'

export class ConfigService {
  config: any = config

  constructor() {
    this.config.loadFile(path.resolve(`${__dirname}/../../../config/local.json`))
  }

  async write() {
    this.config.validate({ allowed: 'strict', output: () => {} })
    await fs.writeFile(path.resolve(`${__dirname}/../../../config/local.json`), JSON.stringify(JSON.parse(this.config.toString()), null, 2))
  }
}
