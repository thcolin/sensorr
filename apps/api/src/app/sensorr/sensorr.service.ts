import fetch from 'node-fetch'
import sanitizeFilename from 'sanitize-filename'
import fs from 'fs/promises'
import path from 'path'
import cp from 'child_process'
import { Observable, Subject, merge, of, tap } from 'rxjs'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ReleaseDTO } from '../movies/release.dto'
import { ConfigService } from '../config/config.service'
import { Metafile as MetafileDocument } from './metafile.schema'

const SENSORR_BIN = process.env.NX_SENSORR_BIN || path.resolve(`${__dirname}/../../../bin/sensorr`)

@Injectable()
export class SensorrService {
  private readonly logger = new Logger(SensorrService.name)
  public readonly ALLOWED_COMMANDS = ['record', 'sync', 'keep-in-touch', 'refresh', 'doctor']
  public process = {}
  public processObservable = new Subject<MessageEvent>()

  constructor(
    @InjectModel(MetafileDocument.name) private readonly metafileModel: Model<MetafileDocument>,
    private configService: ConfigService,
  ) {}

  async downloadRelease(release: ReleaseDTO, source: 'enclosure' | 'cache' = 'enclosure', destination: 'fs' | 'cache' = 'fs'): Promise<any> {
    const filename = sanitizeFilename(`${release.title}-${release.znab}.torrent`)
    let res, buffer

    switch (source) {
      case 'enclosure':
        res = await fetch(release.enclosure)
        buffer = await res.buffer()
        break
      case 'cache':
        res = await this.metafileModel.findById(release.link)
        buffer = res.buffer
        break
    }

    switch (destination) {
      case 'fs':
        this.logger.log(`Download "${filename}" from ${source} to ${destination}, blackhole="${this.configService.config.get('blackhole')}"`)
        await fs.writeFile(path.join(this.configService.config.get('blackhole'), `${filename}`), buffer)

        if (source === 'cache') {
          await this.metafileModel.deleteOne({ _id: release.link })
        }

        break
      case 'cache':
        this.logger.log(`Download "${filename}" from ${source} to ${destination}, blackhole="database"`)
        await this.metafileModel.findByIdAndUpdate(release.link, { id: release.link, buffer }, { new: true, upsert: true })
        break
    }
  }

  async removeRelease(release: ReleaseDTO) {
    await this.metafileModel.deleteOne({ id: release.link })
  }

  listenStatus(): Observable<MessageEvent> {
    return merge(
      of({ data: this.process } as MessageEvent),
      this.processObservable.pipe(
        tap(() => this.logger.log(`ListenStatus, message=""`)),
      ),
    )
  }

  runProcess(command: string, cron?: string) {
    if (!this.ALLOWED_COMMANDS.includes(command)) {
      throw new NotFoundException(`Unknown Sensorr command "${command}"`)
    }

    return new Promise((resolve, reject) => {
      let job
      let fulfilled = false
      this.logger.log(`RunProcess "${command}"` + (cron ? `, from cron "${cron}"` : ''))
      const child = cp.spawn(SENSORR_BIN, [command])
      child.stdout.on('data', (data) => {
        if (fulfilled) {
          return
        }

        try {
          const res = JSON.parse((`${data}` || '').split('\n')[0])
          job = res.job
          this.logger.log(`Command "${command}" running as job "${job}"`)
          fulfilled = true
          resolve(job)
          this.process[job] = { job, command, abort: () => child.kill('SIGTERM') }
          this.processObservable.next({ data: this.process } as MessageEvent)
        } catch (e) {
          this.logger.error(e, data)
          reject(e)
        }
      })
      child.stderr.on('data', (data) => this.logger.error(`Command "${command}": ${data}`))
      child.on('error', (err) => this.logger.log(`Command "${command}" error (${err})`))
      child.on('close', code => {
        this.logger.log(`Command "${command}" exit (${code})`)
        delete this.process[job]
        this.processObservable.next({ data: this.process } as MessageEvent)
      })
    })
  }

  stopProcess(job: string) {
    if (!this.process[job]) {
      throw new NotFoundException(`Job ${job} not found or not running`)
    }

    this.logger.log(`StopProcess "${job}" (${this.process[job].command})`)
    this.process[job].abort()
  }
}
