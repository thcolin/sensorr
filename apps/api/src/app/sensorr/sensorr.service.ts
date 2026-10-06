import fetch from 'node-fetch'
import sanitizeFilename from 'sanitize-filename'
import fs from 'fs/promises'
import path from 'path'
import cp from 'child_process'
import os from 'os'
import unzipper from 'unzipper'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { Observable, Subject, merge, of, tap } from 'rxjs'
import { ConflictException, Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { DUMP_ENTRY_MAX, DumpManifest, dumpManifestError, isJob, isMagnet, torrentFiles, TorrentFiles, MEDIA } from '@sensorr/sensorr'
import { ReleaseDTO } from '../movies/release.dto'
import { ConfigService } from '../config/config.service'
import { Metafile as MetafileDocument } from './metafile.schema'
import { lockOf } from './lock'

const moduleDir = dirname(fileURLToPath(import.meta.url))
const SENSORR_BIN = process.env.NX_SENSORR_BIN || path.resolve(`${moduleDir}/../../../../../bin/sensorr`)

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

// A file name stops at 255 bytes, two a letter in Cyrillic: the title gives way, never the extension
const filenameOf = ({ title, znab }: ReleaseDTO, extension: string): string => {
  const suffix = sanitizeFilename(`-${znab}.${extension}`)
  const stem = [...sanitizeFilename(title)]

  while (Buffer.byteLength(`${stem.join('')}${suffix}`) > 255) {
    stem.pop()
  }

  return `${stem.join('')}${suffix}`
}

// What a dump holds, from an archive in memory or on disk, or why it is not one this Sensorr restores
export const manifestOf = async (archive: Promise<any>): Promise<DumpManifest> => {
  const directory = await archive.catch(() => null)
  const entry = directory?.files.find(({ path }) => path === 'manifest.json')

  if (!entry) {
    throw new UnprocessableEntityException('Not a Sensorr dump, the archive has no manifest.json')
  }

  if (entry.uncompressedSize > DUMP_ENTRY_MAX) {
    throw new UnprocessableEntityException('Not a Sensorr dump, its manifest.json is too large')
  }

  let manifest

  try {
    manifest = JSON.parse((await entry.buffer()).toString())
  } catch {
    throw new UnprocessableEntityException('Not a Sensorr dump, its manifest.json is not JSON')
  }

  const error = dumpManifestError(manifest)

  if (error) {
    throw new UnprocessableEntityException(error)
  }

  return manifest
}

@Injectable()
export class SensorrService {
  private readonly logger = new Logger(SensorrService.name)
  public process = {}
  public processObservable = new Subject<MessageEvent>()
  private readonly running = new Set<string>()
  public exits = new Subject<string>()

  constructor(
    @InjectModel(MetafileDocument.name) private readonly metafileModel: Model<MetafileDocument>,
    private configService: ConfigService,
  ) {}

  async downloadRelease(release: ReleaseDTO, source: 'enclosure' | 'cache' = 'enclosure', destination: 'fs' | 'cache' = 'fs', kind: 'movie' | 'show' = 'movie'): Promise<TorrentFiles | void> {
    const magnet = isMagnet(release.enclosure)
    const filename = filenameOf(release, magnet ? 'magnet' : 'torrent')
    const blackhole = this.configService.config.get(kind === 'show' ? 'shows.blackhole' : 'blackhole')
    let res, buffer

    if (magnet && (kind === 'show' || !this.configService.config.get('magnet'))) {
      throw new UnprocessableEntityException(kind === 'show' ? 'Magnet link, a show needs a .torrent' : 'Magnet link, turned off in Settings > Blackhole')
    }

    // An accepted release has already left the cache, so it is fetched again from its indexer
    if (source === 'cache' && !(await this.metafileModel.exists({ _id: release.link }))) {
      source = 'enclosure'
    }

    switch (source) {
      case 'enclosure':
        // A .magnet file holds one link per line, as qBittorrent reads it from its watched folder: URL drops any line break
        if (magnet) {
          buffer = Buffer.from(`${new URL(release.enclosure).href}\n`)
          break
        }

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
        await this.metafileModel.findByIdAndUpdate(release.link, { buffer }, { returnDocument: 'after', upsert: true })
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

    return this.spawn(name, [command, type].filter(Boolean), { command, type, cron })
  }

  async runMigrate(buffer: Buffer) {
    const entries = await unzipper.Open.buffer(buffer).then(({ files }) => files.map(({ path }) => path), () => [])

    if (!entries.some((entry) => ['movies.txt', 'stars.txt'].includes(entry))) {
      throw new UnprocessableEntityException('Not a 0.x dump, the archive has neither movies.txt nor stars.txt')
    }

    // A second upload would write its archive before the lock refuses it, and its cleanup would take the running one's
    if (this.running.has('migrate')) {
      throw new ConflictException('Sensorr job "migrate" is already running')
    }

    const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'sensorr-migrate-'))
    const archive = path.join(folder, 'dump.zip')
    await fs.writeFile(archive, buffer, { mode: 0o600 })

    return this.spawn('migrate', ['migrate', archive], { command: 'migrate', onClose: () => fs.rm(folder, { recursive: true, force: true }) })
  }

  async runRestore(buffer: Buffer) {
    await manifestOf(unzipper.Open.buffer(buffer))

    // A job running meanwhile would write into a library about to be replaced
    const [running] = this.runningJobs()

    if (running) {
      throw new ConflictException(`Sensorr job "${running}" is running, restore once it ends`)
    }

    const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'sensorr-restore-'))
    const archive = path.join(folder, 'dump.zip')
    await fs.writeFile(archive, buffer, { mode: 0o600 })

    return this.spawn('restore', ['restore', archive], { command: 'restore', onClose: () => fs.rm(folder, { recursive: true, force: true }) })
  }

  private spawn(name: string, args: string[], { command, type, cron, onClose }: { command: string, type?: string, cron?: string, onClose?: () => void }) {
    // A restore empties then refills the library: no job starts before it ends, and it starts after none
    if (this.running.has('restore') || (name === 'restore' && this.running.size)) {
      const reason = name === 'restore' ? `Sensorr job "${[...this.running][0]}" is running, restore once it ends` : `Sensorr job "${name}" refused, a restore is running`
      this.logger.warn(`RunProcess "${name}" refused: ${reason}` + (cron ? `, from cron "${cron}"` : ''))
      onClose?.()
      return Promise.reject(new ConflictException(reason))
    }

    const unlock = lockOf(this.running, name)

    if (!unlock) {
      this.logger.warn(`RunProcess "${name}" refused, it is already running` + (cron ? `, from cron "${cron}"` : ''))
      onClose?.()
      return Promise.reject(new ConflictException(`Sensorr job "${name}" is already running`))
    }

    return new Promise((resolve, reject) => {
      let job
      let fulfilled = false
      this.logger.log(`RunProcess "${name}"` + (cron ? `, from cron "${cron}"` : ''))
      const child = cp.spawn(SENSORR_BIN, args)
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
      // A spawn that fails, or a process that ends before naming its job, rejects instead of leaving the request hanging
      child.on('error', (err) => {
        this.logger.log(`Command "${name}" error (${err})`)
        unlock()
        onClose?.()

        if (!fulfilled) {
          fulfilled = true
          reject(err)
        }
      })
      child.on('close', code => {
        this.logger.log(`Command "${name}" exit (${code})`)
        unlock()
        onClose?.()

        if (!fulfilled) {
          fulfilled = true
          reject(new Error(`Sensorr job "${name}" exited (${code}) before it started`))
        }

        delete this.process[job]
        this.processObservable.next({ data: this.process } as MessageEvent)
        if (job) {
          this.exits.next(job)
        }
      })
    })
  }

  runningJobs(): string[] {
    return [...this.running]
  }

  stopProcess(job: string) {
    if (!this.process[job]) {
      throw new NotFoundException(`Job ${job} not found or not running`)
    }

    this.logger.log(`StopProcess "${job}" (${[this.process[job].command, this.process[job].type].filter(Boolean).join(' ')})`)
    this.process[job].abort()
  }
}
