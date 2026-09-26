import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/mongoose'
import { PaginateModel, PaginateResult } from 'mongoose'
import { Observable, defer, fromEventPattern } from 'rxjs'
import { filter, finalize, mergeMap, share, tap } from 'rxjs/operators'
import { entryPolicy, swapReplacesOf } from '@sensorr/sensorr'
import { ConfigService } from '../config/config.service'
import { SensorrService } from '../sensorr/sensorr.service'
import { LogsService } from '../logs/logs.service'
import { ShowDTO, ShowReleaseDTO } from './show.dto'
import { EpisodeDTO } from './episode.dto'
import { Show as ShowDocument } from './show.schema'
import { Episode as EpisodeDocument } from './episode.schema'

const METADATA_FIELDS = ['name', 'status', 'last_air_date', 'state', 'monitored', 'monitor_new_seasons', 'policy', 'proposal_only', 'path', 'query', 'releases', 'banned_releases', 'requested_by']

const RELEASE_FIELDS = ['imported_at', 'overdue', 'proposal', 'accepted_at', 'torrent', 'replaces']

const LABELS ={ totalDocs: 'total_results', totalPages: 'total_pages', docs: 'results' }

const NO_PROGRESS = { owned: 0, aired: 0, next: null, seasons: [] }

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

  // `releases` only carries a choice on a proposal, read back from the database: jobs write the array one release at a time
  async upsertShows(raw: { [key: string]: ShowDTO }): Promise<any> {
    this.logger.log(`UpsertShows "${Object.keys(raw)}"`)
    const changes = await this.matchPolicies(raw)

    for (const [i, { releases }] of Object.entries(changes)) {
      const id = Number(i)

      for (const posted of (releases || []) as (ShowReleaseDTO & { choice?: boolean })[]) {
        if (!posted.proposal || typeof posted.choice !== 'boolean') {
          continue
        }

        const release = (await this.showModel.findOne({ _id: id }, { releases: { $elemMatch: { id: posted.id } } }).lean())?.releases?.[0] as ShowReleaseDTO
        const manual = posted.job === 'manual' && !release

        if (!manual && !release?.proposal) {
          continue
        }

        const log = { 'meta.job': posted.job, 'meta.group': id, 'meta.release.id': posted.id, 'meta.release.proposal': true }

        if (posted.choice) {
          const { choice, ...picked } = (manual ? posted : release) as ShowReleaseDTO & { choice?: boolean }
          // Reserved before the download: a second answer to the same proposal finds nothing left to accept
          const { modifiedCount } = manual
            ? await this.showModel.updateOne({ _id: id, 'releases.id': { $ne: picked.id } }, { $push: { releases: { ...picked, proposal: false } } })
            : await this.showModel.updateOne({ _id: id, releases: { $elemMatch: { id: picked.id, proposal: true } } }, { $set: { 'releases.$.proposal': false } })

          if (modifiedCount !== 1) {
            continue
          }

          let torrent

          try {
            torrent = await this.sensorrService.downloadRelease(picked, manual ? 'enclosure' : 'cache', 'fs', 'show')
          } catch (error) {
            await (manual
              ? this.showModel.updateOne({ _id: id }, { $pull: { releases: { id: picked.id } } })
              : this.updateRelease(id, picked.id, { proposal: true }))
            throw error
          }

          const accepted = { accepted_at: Date.now(), ...(torrent ? { torrent } : {}), ...(picked.swap ? { replaces: await this.replacedFilesOf(id, picked.coverage || []) } : {}) }

          if (picked.coverage?.length) {
            await this.episodeModel.updateMany({ show_id: id, $or: picked.coverage.map(({ season, episode }) => ({ season_number: season, episode_number: episode })) }, { release: picked.id })
          }

          await this.updateRelease(id, picked.id, accepted)

          // A manual pick takes over its episodes, accepted first: a proposal waiting on one of them is refused,
          // and lets go only of the episodes the pick does not cover
          if (manual && picked.coverage?.length) {
            const covered = new Set(picked.coverage.map(({ season, episode }) => `${season}:${episode}`))
            const { releases: stored = [] } = (await this.showModel.findOne({ _id: id }, { releases: 1 }).lean()) || {}

            for (const other of (stored as ShowReleaseDTO[]).filter(other => other.proposal && (other.coverage || []).some(({ season, episode }) => covered.has(`${season}:${episode}`)))) {
              await this.refuseProposal(id, other)
            }
          }

          if (!manual) {
            await this.logsService.ammendLog(log, { 'meta.treated': true, 'meta.choice': true, 'meta.seen': true, 'meta.summary': { treated: 1 } })
          }
        } else if (!manual) {
          await this.refuseProposal(id, release)
        }
      }
    }

    // Only a whole show, named and in a state, creates one: a partial write on a show deleted meanwhile would bring it back stateless
    const { insertedCount, modifiedCount, upsertedCount } = await this.showModel.bulkWrite(Object.keys(changes).map(i => {
      const { releases, ...fields } = changes[i]

      return {
        updateOne: {
          filter: { _id: i },
          update: { _id: i, ...fields },
          upsert: !!(fields.name && fields.state),
        },
      }
    }))

    return { upserted: Number(insertedCount + modifiedCount + upsertedCount) }
  }

  // Pulled only while still a proposal: an answer accepted meanwhile keeps its release, its metafile and its episodes
  private async refuseProposal(id: number, release: ShowReleaseDTO) {
    const { modifiedCount } = await this.showModel.updateOne({ _id: id }, { $pull: { releases: { id: release.id, proposal: true } } })

    if (modifiedCount !== 1) {
      return
    }

    await this.sensorrService.removeRelease(release)
    await this.episodeModel.updateMany({ show_id: id, release: release.id }, { release: null })
    await this.logsService.ammendLog(
      { 'meta.job': release.job, 'meta.group': id, 'meta.release.id': release.id, 'meta.release.proposal': true },
      { 'meta.treated': true, 'meta.choice': false, 'meta.seen': true, 'meta.summary': { treated: 1 } },
    )
  }

  // An accepted swap names the Plex files of its seasons, for `sync shows` to delete once it lands
  private async replacedFilesOf(id: number, coverage: { season: number, episode: number }[]): Promise<string[]> {
    const episodes = await this.episodeModel.find({ show_id: id, season_number: { $in: [...new Set(coverage.map(({ season }) => season))] } }, { season_number: 1, episode_number: 1, files: 1 }).lean()
    return swapReplacesOf(coverage, episodes as any[])
  }

  async pushRelease(id: number, release: ShowReleaseDTO): Promise<any> {
    this.logger.log(`PushRelease "${id}", release="${release.id}"`)
    const { modifiedCount } = await this.showModel.updateOne({ _id: id, 'releases.id': { $ne: release.id } }, { $push: { releases: release } })
    return { pushed: modifiedCount }
  }

  async pullRelease(id: number, release: string): Promise<any> {
    this.logger.log(`PullRelease "${id}", release="${release}"`)
    const { modifiedCount } = await this.showModel.updateOne({ _id: id }, { $pull: { releases: { id: release } } })
    return { pulled: modifiedCount }
  }

  async banRelease(id: number, title: string): Promise<any> {
    this.logger.log(`BanRelease "${id}", title="${title}"`)
    const { modifiedCount } = await this.showModel.updateOne({ _id: id }, { $addToSet: { banned_releases: title } })
    return { banned: modifiedCount }
  }

  async unbanRelease(id: number, title: string): Promise<any> {
    this.logger.log(`UnbanRelease "${id}", title="${title}"`)
    const { modifiedCount } = await this.showModel.updateOne({ _id: id }, { $pull: { banned_releases: title } })
    return { unbanned: modifiedCount }
  }

  async updateRelease(id: number, release: string, fields: Partial<ShowReleaseDTO>): Promise<any> {
    this.logger.log(`UpdateRelease "${id}", release="${release}"`)
    const changes = Object.entries(fields).filter(([key]) => RELEASE_FIELDS.includes(key))

    if (!changes.length) {
      return { updated: 0 }
    }

    const { modifiedCount } = await this.showModel.updateOne({ _id: id, 'releases.id': release }, { $set: Object.fromEntries(changes.map(([key, value]) => [`releases.$.${key}`, value])) })
    return { updated: modifiedCount }
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
      // A request older than `requested_at` has none: it comes after the dated ones, by `refreshed_at`
      sort: { [params.sort_by.split('.')[0]]: params.sort_by.split('.')[1], ...(params.sort_by.startsWith('requested_at.') ? { refreshed_at: params.sort_by.split('.')[1] } : {}), id: 1 },
      customLabels: LABELS,
    })

    if (`${params.progress}` === 'true') {
      const progress = await this.getProgress((res.results as any[]).map(({ _id }) => _id))
      res.results = (res.results as any[]).map(show => ({ ...show, progress: progress[show._id] || NO_PROGRESS })) as any
    }

    return res
  }

  // Specials are left out, like everywhere else progress is counted
  async getProgress(ids: number[]): Promise<{ [id: number]: { owned: number, aired: number, next: Date | null, seasons: { season_number: number, owned: number, aired: number }[] } }> {
    // One instant for both counts, so an episode is either aired or next
    const now = new Date()
    const counts = await this.episodeModel.aggregate([
      { $match: { show_id: { $in: ids }, season_number: { $ne: 0 } } },
      {
        $group: {
          _id: { show_id: '$show_id', season_number: '$season_number' },
          owned: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$files', []] } }, 0] }, 1, 0] } },
          aired: { $sum: { $cond: [{ $and: [{ $gt: ['$air_date', null] }, { $lte: ['$air_date', now] }] }, 1, 0] } },
          // $min skips the nulls: a season with nothing left to air gives none
          next: { $min: { $cond: [{ $gt: ['$air_date', now] }, '$air_date', null] } },
        },
      },
      { $sort: { '_id.show_id': 1, '_id.season_number': 1 } },
    ])

    const progress = {}

    for (const { _id: { show_id, season_number }, owned, aired, next } of counts) {
      progress[show_id] = progress[show_id] || { owned: 0, aired: 0, next: null, seasons: [] }
      progress[show_id].owned += owned
      progress[show_id].aired += aired
      if (next && (!progress[show_id].next || next < progress[show_id].next)) {
        progress[show_id].next = next
      }
      progress[show_id].seasons.push({ season_number, owned, aired })
    }

    return progress
  }

  async getShowProgress(id: number) {
    this.logger.log(`GetShowProgress "${id}"`)
    return (await this.getProgress([id]))[id] || NO_PROGRESS
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

  // An episode holding a file or a release stays: a job may have taken it since the caller read it
  async deleteEpisodes(ids: number[]): Promise<any> {
    this.logger.log(`DeleteEpisodes "${ids.length}"`)
    const { deletedCount } = await this.episodeModel.deleteMany({ _id: { $in: ids }, 'files.0': { $exists: false }, release: null })
    return { deleted: deletedCount }
  }

  // Only the episodes whose release is still `from` move, so two jobs never both take one
  async moveEpisodesRelease(ids: number[], from: string | null, to: string | null): Promise<any> {
    this.logger.log(`MoveEpisodesRelease "${ids.length}", from="${from}", to="${to}"`)
    const { modifiedCount } = await this.episodeModel.updateMany({ _id: { $in: ids }, release: from }, { release: to })
    return { modified: modifiedCount }
  }

  async getEpisodes(params = {} as any, page = 1, limit = 20): Promise<PaginateResult<EpisodeDocument>> {
    this.logger.log(`GetEpisodes, params=${JSON.stringify(params)}, page=${page}`)

    const followed = `${params.monitored_show}` === 'true'
      ? (await this.showModel.find(monitored(true), { _id: 1 }).lean()).map(({ _id }) => Number(_id))
      : null
    const requested = params.show ? `${params.show}`.split('|').map(Number) : null
    const shows = (followed && requested) ? requested.filter(id => followed.includes(id)) : (followed || requested)

    return this.episodeModel.paginate({
      ...(shows ? {
        show_id: { $in: shows }
      } : {}),
      ...monitored(params.monitored),
      ...((params.aired_after || params.aired_before || `${params.wanted}` === 'true') ? {
        $and: [
          ...(params.aired_after ? [{ air_date: { $gte: new Date(params.aired_after) } }] : []),
          ...(params.aired_before ? [{ air_date: { $lte: new Date(params.aired_before) } }] : []),
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
