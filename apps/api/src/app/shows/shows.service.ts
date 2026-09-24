import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/mongoose'
import { PaginateModel, PaginateResult } from 'mongoose'
import { Observable, defer, fromEventPattern } from 'rxjs'
import { filter, finalize, mergeMap, share, tap } from 'rxjs/operators'
import { entryPolicy } from '@sensorr/sensorr'
import { ConfigService } from '../config/config.service'
import { SensorrService } from '../sensorr/sensorr.service'
import { LogsService } from '../logs/logs.service'
import { ShowDTO, ShowReleaseDTO } from './show.dto'
import { EpisodeDTO } from './episode.dto'
import { Show as ShowDocument } from './show.schema'
import { Episode as EpisodeDocument } from './episode.schema'

const METADATA_FIELDS = ['name', 'state', 'monitored', 'monitor_new_seasons', 'policy', 'proposal_only', 'path', 'query', 'releases', 'banned_releases', 'requested_by']

const LABELS = { totalDocs: 'total_results', totalPages: 'total_pages', docs: 'results' }

const monitored = (value) => ({
  true: { monitored: true },
  false: { monitored: { $ne: true } },
})[`${value}`] || {}

@Injectable()
export class ShowsService {
  private readonly logger = new Logger(ShowsService.name)

  private readonly changes$: Observable<any> = defer(() => {
    this.logger.log('Changes, opened')
    const stream = this.showModel.watch()

    return fromEventPattern(
      (handler) => stream.on('change', handler),
      (handler) => stream.removeListener('change', handler),
    ).pipe(
      finalize(() => {
        this.logger.log('Changes, closed')
        stream.close()
      }),
    )
  }).pipe(share())

  constructor(
    @InjectModel(ShowDocument.name) private readonly showModel: PaginateModel<ShowDocument>,
    @InjectModel(EpisodeDocument.name) private readonly episodeModel: PaginateModel<EpisodeDocument>,
    private configService: ConfigService,
    private sensorrService: SensorrService,
    private logsService: LogsService,
  ) {}

  @OnEvent('guest.delete')
  async handleGuestDelete({ email }: { email: string }) {
    this.logger.log(`Handling guest.delete event: ${email}`)
    await this.showModel.updateMany({}, { '$pull': { requested_by: email } })
  }

  @OnEvent('policy.rename')
  async handlePolicyRename({ oldName, newName }: { oldName: string, newName: string }) {
    this.logger.log(`Handling policy.rename event: ${JSON.stringify({ oldName, newName })}`)
    await this.showModel.updateMany({ policy: oldName }, { policy: newName })
  }

  @OnEvent('plex.reset')
  async handlePlexReset() {
    this.logger.log(`Handling plex.reset event`)
    await this.showModel.updateMany({}, { '$pull': { 'releases': { from: 'sync' } } })
    await this.episodeModel.updateMany({}, { files: [] })
  }

  // Same rule as a movie: a show entering the library follows the first policy matching its original language
  private async matchPolicies(changes: { [key: string]: ShowDTO }): Promise<{ [key: string]: ShowDTO }> {
    const policies = this.configService.config.get('policies') || []
    const candidates = Object.keys(changes).filter(id => changes[id].state && changes[id].state !== 'ignored' && !changes[id].policy)
    if (!candidates.length || !policies.some(policy => policy.match?.original_languages?.length)) {
      return changes
    }

    const stored = new Map((await this.showModel.find({ _id: { $in: candidates } }, { policy: 1, state: 1, original_language: 1 }).lean()).map(show => [`${show._id}`, show]))

    return candidates.reduce((acc, id) => {
      const show = stored.get(`${id}`)
      const policy = entryPolicy({ original_language: changes[id].original_language || show?.original_language }, show, policies)
      return policy ? { ...acc, [id]: { ...changes[id], policy: policy.name } } : acc
    }, changes)
  }

  // Only the fields sent are written, so a TMDB refresh leaves the Sensorr fields alone
  async upsertShows(raw: { [key: string]: ShowDTO }): Promise<any> {
    this.logger.log(`UpsertShows "${Object.keys(raw)}"`)
    const changes = await this.matchPolicies(raw)
    const torrents = new Map()

    for (const [i, { releases }] of Object.entries(changes)) {
      const id = Number(i)

      for (const release of (releases || []) as (ShowReleaseDTO & { choice?: boolean })[]) {
        if (!release.proposal || release.choice === undefined) {
          continue
        }

        const log = { 'meta.job': release.job, 'meta.group': id, 'meta.release.id': release.id, 'meta.release.proposal': true }

        if (release.choice) {
          torrents.set(release.id, await this.sensorrService.downloadRelease(release, release.job === 'manual' ? 'enclosure' : 'cache', 'fs', 'show'))

          if (release.coverage?.length) {
            await this.episodeModel.updateMany({ show_id: id, $or: release.coverage.map(({ season, episode }) => ({ season_number: season, episode_number: episode })) }, { release: release.id })
          }

          if (release.job !== 'manual') {
            await this.logsService.ammendLog(log, { 'meta.treated': true, 'meta.choice': true, 'meta.seen': true, 'meta.summary': { treated: 1 } })
          }
        } else {
          await this.sensorrService.removeRelease(release)
          await this.episodeModel.updateMany({ show_id: id, release: release.id }, { release: null })

          if (release.job !== 'manual') {
            await this.logsService.ammendLog(log, { 'meta.treated': true, 'meta.choice': false, 'meta.seen': true, 'meta.summary': { treated: 1 } })
          }
        }
      }
    }

    const { insertedCount, modifiedCount, upsertedCount } = await this.showModel.bulkWrite(Object.keys(changes).map(i => ({
      updateOne: {
        filter: { _id: i },
        update: {
          _id: i,
          ...changes[i],
          ...(changes[i].releases ? {
            releases: (changes[i].releases as (ShowReleaseDTO & { choice?: boolean })[])
              .filter(release => !release.proposal || release.choice !== false)
              .map(({ proposal, choice, ...release }) => ({
                ...release,
                ...(proposal && choice === undefined ? { proposal: true } : {}),
                ...(proposal && choice === true ? { torrent: torrents.get(release.id) || release.torrent, accepted_at: Date.now() } : {}),
              })),
          } : {}),
        },
        upsert: true,
      },
    })))

    return { upserted: Number(insertedCount + modifiedCount + upsertedCount) }
  }

  async deleteShows(changes: { [key: string]: ShowDTO }): Promise<any> {
    this.logger.log(`DeleteShows "${Object.keys(changes)}"`)
    const ids = Object.keys(changes).map(Number)
    const { deletedCount } = await this.showModel.deleteMany({ _id: { $in: ids } })
    const { deletedCount: episodes } = await this.episodeModel.deleteMany({ show_id: { $in: ids } })
    return { deleted: deletedCount, episodes }
  }

  async getShows(params = {} as any, page = 1, limit = 20): Promise<PaginateResult<ShowDocument>> {
    this.logger.log(`GetShows, params=${JSON.stringify(params)}, page=${page}`)
    const res = await this.showModel.paginate({
      state: { $nin: ['ignored'] },
      ...(params.state ? {
        state: { $in: params.state.split('|') }
      } : {}),
      ...(params.policy ? {
        policy: { $in: params.policy.split('|') }
      } : {}),
      ...(params.status ? {
        status: { $in: params.status.split('|') }
      } : {}),
      ...monitored(params.monitored),
      ...(params.requested_by ? {
        requested_by: {
          ...(!/,/.test(params.requested_by) ? {
            $in: params.requested_by.split('|'),
          } : {}),
          ...(/,/.test(params.requested_by) ? {
            $all: params.requested_by.split(','),
          } : {}),
        },
      } : {}),
      ...(params['requested_by.gte'] ? {
        [`requested_by.${Number(params['requested_by.gte']) - 1}`]: { $exists: true },
      } : {}),
      ...(({
        true: { 'releases': { $elemMatch: { 'proposal': true } } },
        false: { 'releases': { $not: { $elemMatch: { 'proposal': true } } } },
      })[params['releases.proposal']] || {}),
    }, {
      page,
      lean: true,
      leanWithId: false,
      ...(limit ? { limit } : { pagination: false }),
      ...(params.fields ? { select: params.fields.split('|') } : {}),
      sort: { [params.sort_by.split('.')[0]]: params.sort_by.split('.')[1], id: 1 },
      customLabels: LABELS,
    })

    if (`${params.progress}` === 'true') {
      const progress = await this.getProgress((res.results as any[]).map(({ _id }) => _id))
      res.results = (res.results as any[]).map(show => ({ ...show, progress: progress[show._id] || { owned: 0, aired: 0 } })) as any
    }

    return res
  }

  // Same counts as `progressOf` from @sensorr/sensorr, specials left out
  async getProgress(ids: number[]): Promise<{ [id: number]: { owned: number, aired: number } }> {
    const counts = await this.episodeModel.aggregate([
      { $match: { show_id: { $in: ids }, season_number: { $ne: 0 } } },
      {
        $group: {
          _id: '$show_id',
          owned: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$files', []] } }, 0] }, 1, 0] } },
          aired: { $sum: { $cond: [{ $and: [{ $gt: ['$air_date', null] }, { $lte: ['$air_date', new Date()] }] }, 1, 0] } },
        },
      },
    ])

    return counts.reduce((acc, { _id, owned, aired }) => ({ ...acc, [_id]: { owned, aired } }), {})
  }

  async getShow(id: number) {
    this.logger.log(`GetShow "${id}"`)
    const show = await this.showModel.findById(id).lean()
    if (!show) {
      throw new NotFoundException(`Show ${id} not found`)
    }

    return show
  }

  async getMetadata(page = 1) {
    this.logger.log(`GetMetadata, page="${page}"`)
    const res = await this.showModel.paginate({}, {
      page,
      lean: true,
      leanWithId: true,
      limit: 1000,
      select: METADATA_FIELDS,
      customLabels: LABELS,
    })

    res.results = (res.results as any[]).reduce((acc, curr) => ({ ...acc, [curr._id]: curr }), {})
    return res
  }

  // A deleted show is sent as `null`, so a client can drop it
  listenMetadata(): Observable<MessageEvent> {
    this.logger.log('ListenMetadata')

    return this.changes$.pipe(
      filter((change: any) => change?.documentKey),
      mergeMap(async (change: any) => {
        const id = change?.documentKey?._id
        const show = await this.showModel.findById(id, METADATA_FIELDS).lean().exec()
        return { data: { [id]: show || null } } as MessageEvent
      }),
      tap(() => this.logger.log(`ListenMetadata, message=""`)),
    )
  }

  async upsertEpisodes(changes: { [key: string]: EpisodeDTO }): Promise<any> {
    this.logger.log(`UpsertEpisodes "${Object.keys(changes).length}"`)
    const { insertedCount, modifiedCount, upsertedCount } = await this.episodeModel.bulkWrite(Object.keys(changes).map(i => ({
      updateOne: {
        filter: { _id: i },
        update: { _id: i, ...changes[i] },
        upsert: true,
      },
    })))

    return { upserted: Number(insertedCount + modifiedCount + upsertedCount) }
  }

  async getEpisodes(params = {} as any, page = 1, limit = 20): Promise<PaginateResult<EpisodeDocument>> {
    this.logger.log(`GetEpisodes, params=${JSON.stringify(params)}, page=${page}`)
    return this.episodeModel.paginate({
      ...(params.show ? {
        show_id: { $in: `${params.show}`.split('|').map(Number) }
      } : {}),
      ...monitored(params.monitored),
      ...((params.aired_after || params.aired_before || `${params.wanted}` === 'true') ? {
        $and: [
          ...(params.aired_after ? [{ air_date: { $gte: new Date(params.aired_after) } }] : []),
          ...(params.aired_before ? [{ air_date: { $lte: new Date(params.aired_before) } }] : []),
          // Same rule as `episodeStatus` from @sensorr/sensorr
          ...(`${params.wanted}` === 'true' ? [
            { monitored: true },
            { air_date: { $lte: new Date() } },
            { 'files.0': { $exists: false } },
            { release: null },
          ] : []),
        ],
      } : {}),
    }, {
      page,
      lean: true,
      leanWithId: false,
      ...(limit ? { limit } : { pagination: false }),
      ...(params.fields ? { select: params.fields.split('|') } : {}),
      sort: { [params.sort_by.split('.')[0]]: params.sort_by.split('.')[1], show_id: 1, season_number: 1, episode_number: 1 },
      customLabels: LABELS,
    })
  }

  async getShowEpisodes(id: number) {
    this.logger.log(`GetShowEpisodes "${id}"`)
    return this.episodeModel.find({ show_id: id }).sort({ season_number: 1, episode_number: 1 }).lean()
  }
}
