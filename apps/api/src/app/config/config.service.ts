import fs from 'fs/promises'
import { chmodSync, copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { CronTime } from 'cron'
import config, { create } from '@sensorr/config'
import { JOBS } from '@sensorr/sensorr'
import { migrateJobs, migrateLegacy } from './migrate'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))

@Injectable()
export class ConfigService implements OnModuleInit {
  private readonly logger = new Logger(ConfigService.name)
  private readonly file = path.resolve(`${moduleDir}/../../../../../config.json`)
  config: any = config

  constructor(
    private eventEmitter: EventEmitter2,
  ) {
    this.migrate()
    this.config.loadFile(this.file)
    this.config.set('docker', process.env.NX_API_DOCKER_ENV === 'true')
    this.config.set('onboarding.defaultPassword', process.env.NX_SENSORR_PASSWORD === 'sensorr')
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

  // Runs before the file is loaded: convict would keep the old keys next to the new ones.
  // Compose mounts config.json alone but .secrets/ whole, so the copy goes there to outlive the container.
  private migrate() {
    const raw = JSON.parse(readFileSync(this.file, 'utf8'))
    const legacy = migrateLegacy(raw)
    const migrated = migrateJobs(legacy)

    if (migrated === raw) {
      return
    }

    const backup = path.join(path.dirname(this.file), '.secrets', 'config.json.bak')
    mkdirSync(path.dirname(backup), { recursive: true })
    copyFileSync(this.file, backup)
    chmodSync(backup, 0o600)
    writeFileSync(this.file, JSON.stringify(migrated, null, 2))
    this.logger.log(legacy === raw
      ? `Migrate jobs of "${this.file}" to jobs.<command>.<type>, previous file kept as "${backup}"`
      : `Convert the 0.x config "${this.file}", previous file kept as "${backup}"`)
  }

  async get() {
    this.logger.log(`Read "${this.file}"`)
    return this.config.toString()
  }

  async write() {
    this.config.validate({ allowed: 'warn', output: () => {} })
    await fs.writeFile(this.file, JSON.stringify(JSON.parse(this.config.toString()), null, 2))
    this.logger.log(`Write "${this.file}"`)
    this.eventEmitter.emit('config.write')
  }

  // Convict keeps whatever it loaded even when validation then fails, and routes read the config live
  private validate(apply: (candidate: any) => void) {
    const candidate = create()
    candidate.load(this.config.getProperties())
    apply(candidate)
    candidate.validate({ allowed: 'warn', output: () => {} })

    // Convict only knows a cron as a String, the scheduler's own parser is the one that decides, and it never reads a paused job's
    for (const [command, types] of Object.entries(JOBS)) {
      for (const type of types.length ? types : [undefined]) {
        const key = ['jobs', command, type].filter(Boolean).join('.')

        if (candidate.get(`${key}.paused`)) {
          continue
        }

        try {
          new CronTime(candidate.get(`${key}.cron`))
        } catch (err) {
          throw new Error(`${key}.cron: ${err.message}`)
        }
      }
    }
  }

  async set(key, value) {
    this.validate((candidate) => candidate.set(key, value))
    this.config.set(key, value)
    await this.write()
    this.logger.log(`Set "${key}"`)
  }

  async update(changes) {
    // The Settings pages post the whole config they loaded: the report job's cursor would go back with it.
    delete changes?.jobs?.report?.movies?.since

    const renames = []

    if (changes.policies && changes.policies.some(policy => policy.removed || (policy.oldName !== policy.name))) {
      for (const policy of changes.policies) {
        if (policy.removed || policy.oldName !== policy.name) {
          renames.push({ oldName: policy.oldName, newName: policy.removed ? null : policy.name })
        }
      }

      changes.policies = changes.policies.filter(policy => !policy.removed).map(({ oldName, ...policy }) => ({ ...policy }))
    }

    this.validate((candidate) => candidate.load(changes))
    renames.forEach((rename) => this.eventEmitter.emit('policy.rename', rename))
    this.config.load(changes)
    await this.write()
    this.logger.log(`Update "${changes}"`)
    return this.config.toString()
  }
}
