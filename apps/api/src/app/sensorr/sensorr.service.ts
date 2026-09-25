import fetch from 'node-fetch'
import sanitizeFilename from 'sanitize-filename'
import fs from 'fs/promises'
import path from 'path'
import cp from 'child_process'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { Observable, Subject, merge, of, tap } from 'rxjs'
import { ConflictException, Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { isJob, torrentFiles, TorrentFiles, MEDIA } from '@sensorr/sensorr'
import { ReleaseDTO } from '../movies/release.dto'
import { ConfigService } from '../config/config.service'
import { Metafile as MetafileDocument } from './metafile.schema'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SENSORR_BIN = process.env.NX_SENSORR_BIN || path.resolve(`${__dirname}/../../../../../bin/sensorr`)

const showTorrentOf = (buffer: Uint8Array): TorrentFiles => {
  let torrent: TorrentFiles

  try {
    torrent = torrentFiles(buffer)
  } catch (error) {
    throw new UnprocessableEntityException(error.message)
  }

  if (!torrent.files.some(({ path }) => MEDIA.test(path))) {
    throw new UnprocessableEntityException('Invalid .torrent, no video file')
  }

  return torrent
}

@Injectable()
export class SensorrService {
  private readonly logger = new Logger(SensorrService.name)
  public process = {}
  public processObservable = new Subject<MessageEvent>()
  private readonly running = new Set<string>()

  constructor(
    @InjectModel(MetafileDocument.name) private readonly metafileModel: Model<MetafileDocument>,
    private configService: ConfigService,
  ) {}

  async downloadRelease(release: ReleaseDTO, source: 'enclosure' | 'cache' = 'enclosure', destination: 'fs' | 'cache' = 'fs', kind: 'movie' | 'show' = 'movie'): Promise<TorrentFiles | void> {
    const filename = sanitizeFilename(`${release.title}-${release.znab}.torrent`)
    const blackhole = this.configService.config.get(kind === 'show' ? 'shows.blackhole' : 'blackhole')
    let res, buffer

    // An accepted release has already left the cache, so it is fetched again from its indexer
    if (source === 'cache' && !(await this.metafileModel.exists({ _id: release.link }))) {
      source = 'enclosure'
    }

    switch (source) {
      case 'enclosure':
        res = await fetch(release.enclosure)

        if (!res.ok) {
          throw new Error(`Indexer answered ${res.status} for "${release.title}"`)
        }

        buffer = await res.buffer()
        break
      case 'cache':
        res = await this.metafileModel.findById(release.link)
        buffer = res.buffer
        break
    }

    const torrent = kind === 'show' ? showTorrentOf(buffer) : undefined

    switch (destination) {
      case 'fs':
        this.logger.log(`Download "${filename}" from ${source} to ${destination}, blackhole="${blackhole}"`)
        await fs.writeFile(path.join(blackhole, `${filename}`), buffer)

        if (source === 'cache') {
          await this.metafileModel.deleteOne({ _id: release.link })
        }

        break
      case 'cache':
        this.logger.log(`Download "${filename}" from ${source} to ${destination}, blackhole="database"`)
        await this.metafileModel.findByIdAndUpdate(release.link, { buffer }, { new: true, upsert: true })
        break
    }

    return torrent
  }

  async removeRelease(release: ReleaseDTO) {
    await this.metafileModel.deleteOne({ _id: release.link })
  }

  listenStatus(): Observable<MessageEvent> {
    return merge(
      of({ data: this.process } as MessageEvent),
      this.processObservable.pipe(
        tap(() => this.logger.log(`ListenStatus, message=""`)),
      ),
    )
  }

  runProcess(command: string, type?: string, cron?: string) {
    const name = [command, type].filter(Boolean).join(' ')

    if (!isJob(command, type)) {
      throw new NotFoundException(`Unknown Sensorr job "${name}"`)
    }

    if (this.running.has(name)) {
      this.logger.warn(`RunProcess "${name}" refused, it is already running` + (cron ? `, from cron "${cron}"` : ''))
      return Promise.reject(new ConflictException(`Sensorr job "${name}" is already running`))
    }

    this.running.add(name)

    return new Promise((resolve, reject) => {
      let job
      let fulfilled = false
      this.logger.log(`RunProcess "${name}"` + (cron ? `, from cron "${cron}"` : ''))
      const child = cp.spawn(SENSORR_BIN, [command, type].filter(Boolean))
      child.stdout.on('data', (data) => {
        if (fulfilled) {
          return
        }

        try {
          const res = JSON.parse((`${data}` || '').split('\n')[0])
          job = res.job
          this.logger.log(`Command "${name}" running as job "${job}"`)
          fulfilled = true
          resolve(job)
          this.process[job] = { job, command, type, abort: () => child.kill('SIGTERM') }
          this.processObservable.next({ data: this.process } as MessageEvent)
        } catch (e) {
          this.logger.error(e, data)
          reject(e)
        }
      })
      child.stderr.on('data', (data) => this.logger.error(`Command "${name}": ${data}`))
      child.on('error', (err) => {
        this.logger.log(`Command "${name}" error (${err})`)
        this.running.delete(name)
      })
      child.on('close', code => {
        this.logger.log(`Command "${name}" exit (${code})`)
        this.running.delete(name)
        delete this.process[job]
        this.processObservable.next({ data: this.process } as MessageEvent)
      })
    })
  }

  stopProcess(job: string) {
    if (!this.process[job]) {
      throw new NotFoundException(`Job ${job} not found or not running`)
    }

    this.logger.log(`StopProcess "${job}" (${[this.process[job].command, this.process[job].type].filter(Boolean).join(' ')})`)
    this.process[job].abort()
  }
}
