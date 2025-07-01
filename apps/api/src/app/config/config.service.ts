import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import config from '@sensorr/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name)
  private readonly file = path.resolve(`${__dirname}/../../../../../config.json`)
  config: any = config

  constructor(
    private eventEmitter: EventEmitter2,
  ) {
    this.config.loadFile(this.file)
    this.config.set('docker', process.env.NX_API_DOCKER_ENV === 'true')
    this.config.set('vapidPublicKey', process.env.NX_SENSORR_VAPID_PUBLIC_KEY)
  }

  async get() {
    this.logger.log(`Read "${this.file}"`)
    return this.config.toString()
  }

  async write() {
    this.config.validate({ allowed: 'warn', output: () => {} })
    await fs.writeFile(this.file, JSON.stringify(JSON.parse(this.config.toString()), null, 2))
    this.logger.log(`Write "${this.file}"`)
  }

  async set(key, value) {
    this.config.set(key, value)
    await this.write()
    this.logger.log(`Set "${key}"`)
  }

  async update(changes) {
    if (changes.policies && changes.policies.some(policy => policy.removed || (policy.oldName !== policy.name))) {
      for (const policy of changes.policies) {
        if (policy.removed || policy.oldName !== policy.name) {
          this.eventEmitter.emit('policy.rename', { oldName: policy.oldName, newName: policy.removed ? null : policy.name })
        }
      }

      changes.policies = changes.policies.filter(policy => !policy.removed).map(({ oldName, ...policy }) => ({ ...policy }))
    }

    this.config.load(changes)
    await this.write()
    this.logger.log(`Update "${changes}"`)
    return this.config.toString()
  }
}
