import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/mongoose'
import { PaginateModel, PaginateResult } from 'mongoose'
import { Observable, defer, fromEventPattern } from 'rxjs'
import { filter, finalize, mergeMap, map, share, tap } from 'rxjs/operators'
import { fields } from '@sensorr/tmdb'
import { entryPolicy } from '@sensorr/sensorr'
import { facetFilter, movieFilter } from '../filters'
import { SensorrService } from '../sensorr/sensorr.service'
import { ConfigService } from '../config/config.service'
import { LogsService } from '../logs/logs.service'
import { ReleaseDTO } from './release.dto'
import { MovieDTO } from './movie.dto'
import { Movie as MovieDocument } from './movie.schema'
import { arrivedOf } from './arrivals'

const SWAPS = ['refine', 'shrink', 'report']

const METADATA_FIELDS = ['title', 'state', 'policy', 'refine', 'shrink', 'query', 'plex_url', 'releases', 'banned_releases', 'requested_by']

@Injectable()
export class MoviesService {
  private readonly logger = new Logger(MoviesService.name)

  private readonly changes$: Observable<any> = defer(() => {
    this.logger.log('Changes, opened')
    const stream = this.movieModel.watch()

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
    @InjectModel(MovieDocument.name) private readonly movieModel: PaginateModel<MovieDocument>,
    private configService: ConfigService,
    private sensorrService: SensorrService,
    private logsService: LogsService,
  ) {}

  @OnEvent('guest.delete')
  async handleGuestDelete({ email }: { email: string }) {
    this.logger.log(`Handling guest.delete event: ${email}`)
    await this.movieModel.updateMany({}, { '$pull': { requested_by: email } })
  }

  @OnEvent('policy.rename')
  async handlePolicyRename({ oldName, newName }: { oldName: string, newName: string }) {
    this.logger.log(`Handling policy.rename event: ${JSON.stringify({ oldName, newName })}`)
    await this.movieModel.updateMany({ policy: oldName }, { policy: newName })
  }

  @OnEvent('plex.reset')
  async handlePlexReset() {
    this.logger.log(`Handling plex.reset event`)
    await this.movieModel.updateMany({}, { '$pull': { 'releases': { from: 'sync' } } })
  }

  // Without a match a movie keeps no policy, and follows the first one
  private async matchPolicies(changes: { [key: string]: MovieDTO }): Promise<{ [key: string]: MovieDTO }> {
    const policies = this.configService.config.get('policies') || []
    const candidates = Object.keys(changes).filter(id => changes[id].state && changes[id].state !== 'ignored' && !changes[id].policy)
    if (!candidates.length || !policies.some(policy => policy.match?.original_languages?.length)) {
      return changes
    }

    const stored = new Map((await this.movieModel.find({ _id: { $in: candidates } }, { policy: 1, state: 1, original_language: 1 }).lean()).map(movie => [`${movie._id}`, movie]))

    return candidates.reduce((acc, id) => {
      const movie = stored.get(`${id}`)
      const policy = entryPolicy({ original_language: changes[id].original_language || movie?.original_language }, movie, policies)
      return policy ? { ...acc, [id]: { ...changes[id], policy: policy.name } } : acc
    }, changes)
  }

  async upsertMovie(movie: MovieDTO): Promise<any> {
    this.logger.log(`UpsertMovie "${movie?.id}", state="${movie?.state}"`)
    const { [movie.id]: matched } = await this.matchPolicies({ [movie.id]: movie })
    const [archived] = await this.archivedNow({ [movie.id]: matched })
    return this.movieModel.findByIdAndUpdate(movie.id, { ...matched, ...(archived ? { archived_at: Date.now() } : {}) }, { new: true, upsert: true })
  }

  private async archivedNow(changes: { [key: string]: { plex_url?: string } }) {
    const linked = Object.keys(changes).filter((id) => changes[id].plex_url)
    return arrivedOf(changes, linked.length ? await this.movieModel.find({ _id: { $in: linked } }, { plex_url: 1, archived_at: 1 }).lean() : [])
  }

  // A choice acts on the release as the database holds it, only a manual pick comes from the body.
  async upsertMovies(raw: { [key: string]: MovieDTO }): Promise<any> {
    this.logger.log(`UpsertMovies "${Object.keys(raw)}"`)
    const changes = await this.matchPolicies(raw)
    const failed: number[] = []

    for (const [i, { releases }] of Object.entries(changes)) {
      const id = Number(i)

      if (!releases) {
        continue
      }

      // A dropped swap never lands: what accepting it would have freed leaves the job summary
      const stored: any = await this.movieModel.findById(id).lean()
      for (const dropped of (stored?.releases || []).filter(({ id: releaseId, replaces }) => replaces?.length && !releases.some(release => release.id === releaseId))) {
        await this.logsService.ammendLog({ 'meta.job': dropped.job, 'meta.group': id, 'meta.release.id': dropped.id, 'meta.release.proposal': true }, { 'meta.summary.accepted': 0 })
      }

      // Written as the database holds it, or dropped when it holds none
      const keep = (releaseId: string, current) => {
        changes[i] = { ...changes[i], releases: changes[i].releases.flatMap(posted => posted.id === releaseId ? (current ? [current] : []) : [posted]) }
      }

      let accepted = false
      let failure = false

      for (const posted of releases as (ReleaseDTO & { choice?: boolean })[]) {
        if (!posted.proposal || typeof posted.choice !== 'boolean') {
          continue
        }

        const current: ReleaseDTO = (stored?.releases || []).find(({ id: releaseId }) => releaseId === posted.id)
        const manual = posted.job === 'manual' && !current
        const release: ReleaseDTO = manual ? posted : current

        if (!manual && !release?.proposal) {
          keep(posted.id, release)
          continue
        }

        if (posted.choice) {
          // Reserved before the download: a second answer to the same proposal finds nothing left to accept,
          // and writes the release as the database holds it
          if (!manual) {
            const { modifiedCount } = await this.movieModel.updateOne({ _id: id, releases: { $elemMatch: { id: release.id, proposal: true } } }, { $set: { 'releases.$.proposal': false } })

            if (modifiedCount !== 1) {
              keep(release.id, (await this.movieModel.findById(id, { releases: { $elemMatch: { id: release.id } } }).lean())?.releases?.[0])
              continue
            }
          }

          try {
            await this.sensorrService.downloadRelease(release, manual ? 'enclosure' : 'cache', 'fs')
          } catch (error) {
            this.logger.error(`UpsertMovies "${id}", release "${release.title}" not downloaded: ${error.message}`)

            if (!manual) {
              await this.movieModel.updateOne({ _id: id, 'releases.id': release.id }, { $set: { 'releases.$.proposal': true } })
            }

            failure = true
            keep(release.id, manual ? undefined : { ...release, proposal: true })
            continue
          }

          accepted = true

          if (!manual) {
            keep(release.id, { ...release, proposal: true, choice: true })
            const files = releases.filter(({ from }) => from === 'sync')
            const size = (files.length && typeof release.size === 'number') ? { accepted: release.size - files.reduce((sum, file) => sum + (file.size || 0), 0) } : {}
            await this.logsService.ammendLog({ 'meta.job': release.job, 'meta.group': id, 'meta.release.id': release.id, 'meta.release.proposal': true }, { 'meta.treated': true, 'meta.choice': true, 'meta.seen': true, 'meta.summary': { treated: 1, ...size } })
          }
        } else if (!manual) {
          // Pulled before the metafile goes: an acceptance in flight keeps what it reserved
          const { modifiedCount } = await this.movieModel.updateOne({ _id: id }, { $pull: { releases: { id: release.id, proposal: true } } })

          if (modifiedCount !== 1) {
            keep(release.id, (await this.movieModel.findById(id, { releases: { $elemMatch: { id: release.id } } }).lean())?.releases?.[0])
            continue
          }

          await this.sensorrService.removeRelease(release)
          await this.logsService.ammendLog({ 'meta.job': release.job, 'meta.group': id, 'meta.release.id': release.id, 'meta.release.proposal': true }, { 'meta.treated': true, 'meta.choice': false, 'meta.seen': true, 'meta.summary': { treated: 1 } })
        }
      }

      // Nothing accepted, so the state that came with the choice does not hold: only the releases are written,
      // and a movie not in the library yet is not created
      if (failure) {
        failed.push(id)

        if (!accepted && stored) {
          changes[i] = { releases: changes[i].releases } as MovieDTO
        } else if (!accepted) {
          delete changes[i]
        }
      }
    }

    const archived = new Set(await this.archivedNow(changes))
    const { insertedCount, modifiedCount } = await this.movieModel.bulkWrite(Object.keys(changes).map(i => ({
      updateOne: {
        filter: { _id: i },
        update: {
          ...changes[i],
          _id: i,
          id: Number(i),
          ...(archived.has(i) ? { archived_at: Date.now() } : {}),
          ...(changes[i].releases ? {
            releases: changes[i].releases
              .filter(release => !release.proposal || (release as ReleaseDTO & { choice?: boolean }).choice !== false)
              .map(({ proposal, choice, overdue, ...release }: ReleaseDTO & { choice?: boolean }) => ({
                ...release,
                ...(proposal && typeof choice !== 'boolean' ? { proposal: true } : {}),
                // An accepted swap names the Plex versions it replaces, for `sync` to delete once it lands.
                // Accepting an overdue swap again starts it over.
                ...(proposal && choice === true && SWAPS.includes(release.from) ? {
                  replaces: changes[i].releases.filter(({ from }) => from === 'sync').map(({ id }) => id),
                  accepted_at: Date.now(),
                } : {
                  ...(overdue ? { overdue } : {}),
                }),
              })),
          } : {}),
        },
        new: true,
        upsert: true,
      },
    })))

    return { upserted: Number(insertedCount + modifiedCount), failed }
  }

  // Upserted: a release can be banned from the search of a movie not in the library yet
  async banRelease(id: number, title: string): Promise<any> {
    this.logger.log(`BanRelease "${id}", title="${title}"`)
    const { modifiedCount, upsertedCount } = await this.movieModel.updateOne({ _id: id }, { $addToSet: { banned_releases: title } }, { upsert: true })
    return { banned: modifiedCount + upsertedCount }
  }

  async unbanRelease(id: number, title: string): Promise<any> {
    this.logger.log(`UnbanRelease "${id}", title="${title}"`)
    const { modifiedCount } = await this.movieModel.updateOne({ _id: id }, { $pull: { banned_releases: title } })
    return { unbanned: modifiedCount }
  }

  async deleteMovie(movie: MovieDTO): Promise<any> {
    this.logger.log(`DeleteMovie "${movie?.id}"`)
    return this.movieModel.findByIdAndRemove(movie.id)
  }

  async deleteMovies(changes: { [key: string]: MovieDTO }): Promise<any> {
    this.logger.log(`DeleteMovies "${Object.keys(changes)}"`)
    const { deletedCount } = await this.movieModel.deleteMany({ _id: { $in: Object.keys(changes).map(Number)} })
    return { deleted: deletedCount }
  }

  async getMovies(params = {} as any, page: number = 1, limit: number = 20): Promise<PaginateResult<MovieDocument>> {
    this.logger.log(`GetMovies, params=${JSON.stringify(params)}, page=${page}`)
    const res = await this.movieModel.paginate(movieFilter(params), {
      page,
      lean: true,
      ...(limit ? { limit } : { pagination: false }),
      // A caller that only needs a few fields pays 1.6 KB a movie instead of 4.9 KB,
      // which is what makes loading the whole proposal queue at once tenable.
      ...(params.fields ? { select: params.fields.split('|') } : {}),
      // A request older than `requested_at` has none: it comes after the dated ones, by `updated_at`
      sort: { [params.sort_by.split('.')[0]]: params.sort_by.split('.')[1], ...(params.sort_by.startsWith('requested_at.') ? { updated_at: params.sort_by.split('.')[1] } : {}), id: 1 },
      customLabels: { totalDocs: 'total_results', totalPages: 'total_pages', docs: 'results' },
    })

    res.results = (res.results as any[]).map(({ id, ...rest }) => ({ id: Number(id), ...rest }))
    return res
  }

  async getMetadata(page: number = 1) {
    this.logger.log(`GetMetadata, page="${page}"`)
    const res = await this.movieModel.paginate({}, {
      page,
      lean: true,
      leanWithId: true,
      limit: 1000,
      select: METADATA_FIELDS,
      customLabels: { totalDocs: 'total_results', totalPages: 'total_pages', docs: 'results' },
    })

    res.results = (res.results as any[]).reduce((acc, curr) => ({
      ...acc,
      [curr._id]: {
        ...curr,
        shrink: typeof curr.shrink === 'boolean' ? curr.shrink : true,
        refine: typeof curr.refine === 'boolean' ? curr.refine : true,
      },
    }), {})
    return res
  }

  // Out of the metadata pages, read one after the other: a poster would wait for its page
  async getArtworks() {
    this.logger.log('GetArtworks')
    const movies = await this.movieModel.find({ plex_artworks: { $ne: null } }, { plex_artworks: 1 }).lean()
    return Object.fromEntries(movies.map(({ _id, plex_artworks }) => [_id, plex_artworks]))
  }

  listenMetadata(): Observable<MessageEvent> {
    this.logger.log('ListenMetadata')

    return this.changes$.pipe(
      filter((change: any) => change?.ns?.coll === 'movies'),
      mergeMap((change: any) => this.movieModel.find({ '_id': { $eq: change?.documentKey?._id } }, [...METADATA_FIELDS, 'plex_artworks']).lean().exec()),
      map(metadata => ({
        data: metadata.reduce((acc, curr) => ({
          ...acc,
          [curr._id]: {
            ...curr,
            shrink: typeof curr.shrink === 'boolean' ? curr.shrink : true,
            refine: typeof curr.refine === 'boolean' ? curr.refine : true,
          },
        }), {}),
      } as MessageEvent)),
      tap(() => this.logger.log(`ListenMetadata, message=""`)),
    )
  }

  async getStatistics(params = {} as any, context: 'library' | 'requests' = 'library') {
    this.logger.log('GetStatistics')
    const filtered = (...keys: string[]) => ({ $match: facetFilter(movieFilter, params, ...keys) })
    const raw = await this.movieModel.aggregate([
      {
        $match: {
          ...({
            library: {
              state: { $nin: ['ignored'] },
            },
            requests: {
              state: { $in: 'archived|wished|proposal|pinned|missing|ignored'.split('|') },
              [`requested_by.0`]: { $exists: true },
            },
          }[context]),
        },
      },
      {
        $facet: {
          genres: [
            filtered('genres'),
            { $unwind: "$genres" },
            {
              $group: {
                _id: "$genres.id",
                count: { $sum: 1 },
              }
            },
          ],
          original_languages: [filtered('original_languages'), {
            $group: {
              _id: "$original_language",
              count: { $sum: 1 }
            },
          }],
          spoken_languages: [
            filtered('spoken_languages'),
            { $unwind: "$spoken_languages" },
            {
              $group: {
                _id: "$spoken_languages.iso_639_1",
                count: { $sum: 1 },
              }
            },
          ],
          production_companies: [
            filtered('production_companies'),
            { $unwind: "$production_companies" },
            {
              $group: {
                _id: "$production_companies.name",
                count: { $sum: 1 },
              }
            },
          ],
          requested_by: [
            filtered('requested_by'),
            { $unwind: "$requested_by" },
            {
              $group: {
                _id: "$requested_by",
                count: { $sum: 1 },
              }
            },
          ],
          popularity: [filtered('popularity'), {
            $bucket: {
              groupBy: "$popularity",
              boundaries: fields.popularity.boundaries,
              default: -1,
              output: {
                count: { $sum: 1 }
              },
            },
          }],
          release_date: [filtered('release_date'), {
            $group: {
              _id: { $year: "$release_date" },
              count: { $sum: 1 }
            },
          }],
          runtime: [filtered('runtime'), {
            $bucket: {
              groupBy: "$runtime",
              boundaries: fields.runtime.boundaries,
              default: -1,
              output: {
                count: { $sum: 1 }
              },
            },
          }],
          state: [filtered('state'), {
            $group: {
              _id: "$state",
              count: { $sum: 1 }
            },
          }],
          policy: [filtered('policy'), {
            $group: {
              _id: { $ifNull: ["$policy", (this.configService.config.get('policies') || {})[0]?.name || 'Unknown'] },
              count: { $sum: 1 }
            },
          }],
          proposal: [
            filtered('releases.proposal'),
            { $match: { state: { $nin: ['ignored'] }, 'releases.proposal': true } },
            { $group: { _id: null, count: { $sum: 1 } } },
          ],
          vote_average: [filtered('vote_average'), {
            $bucket: {
              groupBy: "$vote_average",
              boundaries: fields.vote_average.boundaries,
              default: -1,
              output: {
                count: { $sum: 1 }
              },
            },
          }],
          vote_count: [filtered('vote_count'), {
            $bucket: {
              groupBy: "$vote_count",
              boundaries: fields.vote_count.boundaries,
              default: -1,
              output: {
                count: { $sum: 1 }
              },
            },
          }],
          budget: [
            filtered('budget'),
            {
              $addFields: {
                budgetInMillions: { $divide: ["$budget", 1000000] }
              }
            },
            {
              $bucket: {
                groupBy: "$budgetInMillions",
                boundaries: fields.budget.boundaries,
                default: -1,
                output: {
                  count: { $sum: 1 }
                },
              },
            },
          ],
          bulk: [
            { $match: movieFilter(params) },
            { $group: { _id: null, entities: { $addToSet: '$id' } } },
          ]
        }
      }
    ])

    raw[0].state.push({ _id: 'proposal', count: raw[0].proposal[0]?.count || 0 })
    delete raw[0].proposal

    return raw[0]
  }
}
