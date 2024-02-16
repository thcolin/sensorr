import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { Injectable, Logger } from '@nestjs/common'
import { ProxyModuleOptions, ProxyModuleOptionsFactory } from '@finastra/nestjs-proxy'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

@Injectable()
export class ProxyConfigService implements ProxyModuleOptionsFactory {
  private readonly logger = new Logger(ProxyConfigService.name)

  createModuleConfig(): ProxyModuleOptions {
    try {
      const raw = fs.readFileSync(path.resolve(`${__dirname}/../../../../../config.json`), 'utf-8')
      const config = JSON.parse(raw)

      return {
        services: config.znabs.map(znab => ({
          id: znab.name,
          url: znab.url,
          config: {}
        })),
      }
    } catch (e) {
      this.logger.log(`Fail to load config.json and initialize proxy services`)
      return {}
    }
  }
}
