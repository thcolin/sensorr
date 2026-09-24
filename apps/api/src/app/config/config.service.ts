import fs from 'fs/promises'
import { copyFileSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import config from '@sensorr/config'
import { migrateJobs } from './migrate'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

@Injectable()
export class ConfigService implements OnModuleInit {
  private readonly logger = new Logger(ConfigService.name)
  private readonly file = path.resolve(`${__dirname}/../../../../../config.json`)
  config: any = config

  constructor(
    private eventEmitter: EventEmitter2,
  ) {
    this.migrate()
    this.config.loadFile(this.file)
    this.config.set('docker', process.env.NX_API_DOCKER_ENV === 'true')
    this.config.set('vapidPublicKey', process.env.NX_SENSORR_VAPID_PUBLIC_KEY)
  }

  // Ensure a unique, stable X-Plex-Client-Identifier per installation.
  // Plex requires it to be unique/persistent per app installation, and reusing a shared
  // identifier across installs leads to device/token management issues on Plex's side.
  async onModuleInit() {
    if (!this.config.get('plex.client_identifier')) {
      const identifier = randomUUID()
      this.config.set('plex.client_identifier', identifier)
      await this.write()
      this.logger.log(`Generated Plex client identifier "${identifier}"`)
    }
  }

  // Runs before the file is loaded: convict would keep the old job keys next to the new ones
  private migrate() {
    const raw = JSON.parse(readFileSync(this.file, 'utf8'))
    const migrated = migrateJobs(raw)

    if (migrated === raw) {
      return
    }

    copyFileSync(this.file, `${this.file}.bak`)
    writeFileSync(this.file, JSON.stringify(migrated, null, 2))
    this.logger.log(`Migrate jobs of "${this.file}" to jobs.<command>.<type>, previous file kept as "${this.file}.bak"`)
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
    // The Settings pages post the whole config they loaded: the report job's cursor would go back with it.
    delete changes?.jobs?.report?.movies?.since

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
