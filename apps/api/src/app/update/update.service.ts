import fs from 'fs/promises'
import path from 'path'
import fetch from 'node-fetch'
import { BadRequestException, ConflictException, HttpException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { SensorrService } from '../sensorr/sensorr.service'
import { Channel, TAGS, channelOf, versionOn } from './update'
// The app version lives in the workspace package.json, outside any project
// eslint-disable-next-line @nx/enforce-module-boundaries
import app from './../../../../../package.json'
import { coded } from '../errors'

const UPDATER = process.env.NX_UPDATER_URL
const SECRET = path.resolve(process.env.NX_UPDATER_SECRET || '.secrets/updater')
const TTL = 15 * 60 * 1000

@Injectable()
export class UpdateService {
  private readonly logger = new Logger(UpdateService.name)
  private readonly available = new Map<string, { at: number, version: Promise<{ version: string | null, revision: string | null } | { error: string }> }>()

  constructor(private readonly sensorrService: SensorrService) {}

  private versionOf(channel: keyof typeof TAGS) {
    const cached = this.available.get(channel)

    if (cached && Date.now() - cached.at < TTL) {
      return cached.version
    }

    const version = versionOn(TAGS[channel]).catch((err) => {
      this.logger.warn(`Version of "${TAGS[channel]}" on GHCR, ${err.message}`)
      this.available.delete(channel)
      return { error: err.message }
    })

    this.available.set(channel, { at: Date.now(), version })
    return version
  }

  private async updater(route: string, init: { method?: string, body?: string } = {}) {
    const secret = (await fs.readFile(SECRET, 'utf8')).trim()
    const res = await fetch(`${UPDATER}${route}`, {
      ...init,
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
    })
    const body = (await res.json()) as any

    if (!res.ok) {
      throw new HttpException(coded('update.updater', `sensorr-updater answered ${res.status}, ${body.message}`, { status: res.status, reason: body.message }), res.status === 401 ? 502 : res.status)
    }

    return body
  }

  // Without the `updater` profile its host name does not resolve: no updater, rather than a broken one
  private async updaterStatus() {
    if (!UPDATER) {
      return null
    }

    try {
      return await this.updater('/status')
    } catch (err) {
      if (['ENOTFOUND', 'EAI_AGAIN'].includes(err.cause?.code || err.code)) {
        return null
      }

      return { error: err.message }
    }
  }

  async status() {
    const tag = process.env.NX_SENSORR_TAG
    const [beta, stable, dev, updater] = await Promise.all([this.versionOf('beta'), this.versionOf('stable'), this.versionOf('dev'), this.updaterStatus()])

    return {
      version: app.version,
      revision: process.env.NX_SENSORR_REVISION || null,
      tag: tag || null,
      channel: channelOf(tag),
      channels: { beta, stable, dev },
      updater,
    }
  }

  async update(channel: Channel) {
    if (!Object.hasOwn(TAGS, channel)) {
      throw new BadRequestException(coded('update.channel', `Unknown channel "${channel}", expected ${Object.keys(TAGS).join(' or ')}`, { channel }))
    }

    const [job] = this.sensorrService.runningJobs()

    if (job) {
      throw new ConflictException(coded('update.jobRunning', `Sensorr job "${job}" is running, recreating sensorr-api would kill it`, { job }))
    }

    if (!UPDATER) {
      throw new NotFoundException(coded('update.unset', 'No sensorr-updater, NX_UPDATER_URL is not set'))
    }

    this.logger.log(`Update to "${TAGS[channel]}"`)
    try {
      await this.updater('/update', { method: 'POST', body: JSON.stringify({ tag: TAGS[channel] }) })
    } catch (err) {
      if (['ENOTFOUND', 'EAI_AGAIN'].includes(err.cause?.code || err.code)) {
        throw new NotFoundException(coded('update.off', 'No sensorr-updater, turn on the updater profile'))
      }

      throw err
    }

    this.available.clear()
    return { tag: TAGS[channel] }
  }
}
