import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/mongoose'
import { PaginateModel, PaginateResult } from 'mongoose'
import { Observable, fromEventPattern } from 'rxjs'
import { filter, mergeMap, map, tap } from 'rxjs/operators'
import { fields } from '@sensorr/tmdb'
import { SensorrService } from '../sensorr/sensorr.service'
import { ConfigService } from '../config/config.service'
import { LogsService } from '../logs/logs.service'
import { ReleaseDTO } from './release.dto'
import { MovieDTO } from './movie.dto'
import { Movie as MovieDocument } from './movie.schema'

const METADATA_FIELDS = ['state', 'policy', 'refine', 'shrink', 'query', 'plex_url', 'releases', 'banned_releases', 'requested_by']

@Injectable()
export class MoviesService {
  private readonly logger = new Logger(MoviesService.name)

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

  async upsertMovie(movie: MovieDTO): Promise<any> {
    this.logger.log(`UpsertMovie "${movie?.id}", state="${movie?.state}"`)
    return this.movieModel.findByIdAndUpdate(movie.id, movie, { new: true, upsert: true })
  }

  async upsertMovies(changes: { [key: string]: MovieDTO }): Promise<any> {
    this.logger.log(`UpsertMovies "${Object.keys(changes)}"`)

    for (const { id, releases } of Object.values(changes)) {
      if (!releases) {
        continue
      }

      for (const release of releases) {
        if (release.proposal) {
          if ((release as ReleaseDTO & { choice: boolean }).choice) {
            await this.sensorrService.downloadRelease(release, (release.from === 'record' && release.job === 'manual') ? 'enclosure' : 'cache', 'fs')

            if (release.job !== 'manual') {
              await this.logsService.ammendLog({ 'meta.job': release.job, 'meta.group': id, 'meta.release.proposal': true }, { 'meta.treated': true, 'meta.choice': true, 'meta.seen': true, 'meta.summary': { treated: 1 } })
            }
          } else {
            await this.sensorrService.removeRelease(release)

            if (release.job !== 'manual') {
              await this.logsService.ammendLog({ 'meta.job': release.job, 'meta.group': id, 'meta.release.proposal': true }, { 'meta.treated': true, 'meta.choice': false, 'meta.seen': true, 'meta.summary': { treated: 1 } })
            }
          }
        }
      }
    }

    const { insertedCount, modifiedCount } = await this.movieModel.bulkWrite(Object.keys(changes).map(i => ({
      updateOne: {
        filter: { id: i },
        update: {
          _id: i,
          ...changes[i],
          ...(changes[i].releases ? {
            releases: changes[i].releases
              .filter(release => !release.proposal || (release as ReleaseDTO & { choice: boolean }).choice)
              .map(({ proposal, choice, ...release }: ReleaseDTO & { choice: boolean }) => release),
          } : {}),
        },
        new: true,
        upsert: true,
      },
    })))

    return { upserted: Number(insertedCount + modifiedCount) }
  }

  async deleteMovie(movie: MovieDTO): Promise<any> {
    this.logger.log(`DeleteMovie "${movie?.id}"`)
    return this.movieModel.findByIdAndRemove(movie.id)
  }

  async deleteMovies(changes: { [key: string]: MovieDTO }): Promise<any> {
    this.logger.log(`DeleteMovies "${Object.keys(changes)}"`)
    const { deletedCount } = await this.movieModel.deleteMany({ id: { $in: Object.keys(changes).map(Number)} })
    return { deleted: deletedCount }
  }

  async getMovies(params = {} as any, page: number = 1, limit: number = 20): Promise<PaginateResult<MovieDocument>> {
    this.logger.log(`GetMovies, params=${JSON.stringify(params)}, page=${page}`)
    const res = await this.movieModel.paginate({
      state: { $nin: ['ignored'] },
      ...(params.state ? {
        state: { $in: params.state.split('|') }
      } : {}),
      ...(params.policy ? {
        policy: { $in: params.policy.split('|') }
      } : {}),
      ...(typeof params.refine === 'boolean' ? {
        refine: params.refine ? { $ne: false } : { $eq: false },
      } : {}),
      ...(typeof params.shrink === 'boolean' ? {
        shrink: params.shrink ? { $ne: false } : { $eq: false },
      } : {}),
      ...((params.genres && !/\,/.test(params.genres)) ? {
        'genres.id': { $in: params.genres.split('|').map(Number) }
      } : {}),
      ...((params.genres && /\,/.test(params.genres)) ? {
        'genres.id': { $all: params.genres.split(',').map(Number) }
      } : {}),
      ...((params.original_languages && !/\,/.test(params.original_languages)) ? {
        'original_language': { $in: params.original_languages.split('|') }
      } : {}),
      ...((params.original_languages && /\,/.test(params.original_languages)) ? {
        'original_language': { $all: params.original_languages.split(',') }
      } : {}),
      ...((params.spoken_languages && !/\,/.test(params.spoken_languages)) ? {
        'spoken_languages.iso_639_1': { $in: params.spoken_languages.split('|') }
      } : {}),
      ...((params.spoken_languages && /\,/.test(params.spoken_languages)) ? {
        'spoken_languages.iso_639_1': { $all: params.spoken_languages.split(',') }
      } : {}),
      ...((params.production_companies && !/\,/.test(params.production_companies)) ? {
        'production_companies.name': { $in: params.production_companies.split('|') }
      } : {}),
      ...((params.production_companies && /\,/.test(params.production_companies)) ? {
        'production_companies.name': { $all: params.spoken_languages.split(',') }
      } : {}),
      ...(params.requested_by ? {
        requested_by: {
          ...(!/\,/.test(params.requested_by) ? {
            $in: params.requested_by.split('|'),
          } : {}),
          ...(/\,/.test(params.requested_by) ? {
            $all: params.requested_by.split(','),
          } : {}),
        },
      } : {}),
      ...(params['requested_by.gte'] ? {
        [`requested_by.${Number(params['requested_by.gte']) - 1}`]: { $exists: true },
      } : {}),
      ...((params['refined_at.lte'] || params['refined_at.gte']) ? {
        refined_at: {
          ...(params['refined_at.lte'] ? { $not: { $gte: params['refined_at.lte'] }  } : {}),
          ...(params['refined_at.gte'] ? { $not: { $lte: params['refined_at.gte'] }  } : {}),
        },
      } : {}),
      ...((params['shrinked_at.lte'] || params['shrinked_at.gte']) ? {
        shrinked_at: {
          ...(params['shrinked_at.lte'] ? { $not: { $gte: params['shrinked_at.lte'] }  } : {}),
          ...(params['shrinked_at.gte'] ? { $not: { $lte: params['shrinked_at.gte'] }  } : {}),
        },
      } : {}),
      ...((params['release_date.lte'] || params['release_date.gte']) ? {
        release_date: {
          ...(params['release_date.lte'] ? { $lte: new Date(params['release_date.lte']) } : {}),
          ...(params['release_date.gte'] ? { $gte: new Date(params['release_date.gte']) } : {}),
        },
      } : {}),
      ...((params['popularity.lte'] || params['popularity.gte']) ? {
        popularity: {
          ...(params['popularity.lte'] ? { $lte: Number(params['popularity.lte']) } : {}),
          ...(params['popularity.gte'] ? { $gte: Number(params['popularity.gte']) } : {}),
        },
      } : {}),
      ...((params['vote_average.lte'] || params['vote_average.gte']) ? {
        vote_average: {
          ...(params['vote_average.lte'] ? { $lte: Number(params['vote_average.lte']) } : {}),
          ...(params['vote_average.gte'] ? { $gte: Number(params['vote_average.gte']) } : {}),
        },
      } : {}),
      ...((params['vote_count.lte'] || params['vote_count.gte']) ? {
        vote_count: {
          ...(params['vote_count.lte'] ? { $lte: Number(params['vote_count.lte']) } : {}),
          ...(params['vote_count.gte'] ? { $gte: Number(params['vote_count.gte']) } : {}),
        },
      } : {}),
      ...((params['budget.lte'] || params['budget.gte']) ? {
        budget: {
          ...(params['budget.lte'] ? { $lte: Number(params['budget.lte']) * 1000000 } : {}),
          ...(params['budget.gte'] ? { $gte: Number(params['budget.gte']) * 1000000 } : {}),
        },
      } : {}),
      ...((params['runtime.lte'] || params['runtime.gte']) ? {
        runtime: {
          ...(params['runtime.lte'] ? { $lte: Number(params['runtime.lte']) } : {}),
          ...(params['runtime.gte'] ? { $gte: Number(params['runtime.gte']) } : {}),
        },
      } : {}),
      ...(Object.keys(params).some(key => [
        'releases.proposal',
        'release_znab.prefer',
        'release_znab.avoid',
        'release_encoding.prefer',
        'release_encoding.avoid',
        'release_resolution.prefer',
        'release_resolution.avoid',
        'release_source.prefer',
        'release_source.avoid',
        'release_dub.prefer',
        'release_dub.avoid',
        'release_language.prefer',
        'release_language.avoid',
        'release_flags.prefer',
        'release_flags.avoid',
        'release_from',
        'release_size.lte',
        'release_size.gte',
      ].includes(key)) ? {
        $and: [
          ...(params['releases.proposal'] ? ({
            true: [{ 'releases': { $elemMatch: { 'proposal': true } } }],
            false: [{ 'releases': { $not: { $elemMatch: { 'proposal': true } } } }],
          })[params['releases.proposal']] || [] : []),
          ...(params['release_znab.prefer'] ? [{
            'releases': { $elemMatch: { znab: { $in: params['release_znab.prefer'].split('|') } }}
          }] : []),
          ...(params['release_znab.avoid'] ? [{
            'releases': { $not: { $elemMatch: { znab: { $nin: params['release_znab.avoid'].split('|') } }} }
          }] : []),
          ...(params['release_encoding.prefer'] ? [{
            'releases': { $elemMatch: { title: { $regex: params['release_encoding.prefer'] } }}
          }] : []),
          ...(params['release_encoding.avoid'] ? [{
            'releases': { $not: { $elemMatch: { title: { $regex: params['release_encoding.avoid'] } }} }
          }] : []),
          ...(params['release_resolution.prefer'] ? [{
            'releases': { $elemMatch: { title: { $regex: params['release_resolution.prefer'] } }}
          }] : []),
          ...(params['release_resolution.avoid'] ? [{
            'releases': { $not: { $elemMatch: { title: { $regex: params['release_resolution.avoid'] } }} }
          }] : []),
          ...(params['release_source.prefer'] ? [{
            'releases': { $elemMatch: { title: { $regex: params['release_source.prefer'] } }}
          }] : []),
          ...(params['release_source.avoid'] ? [{
            'releases': { $not: { $elemMatch: { title: { $regex: params['release_source.avoid'] } }} }
          }] : []),
          ...(params['release_dub.prefer'] ? [{
            'releases': { $elemMatch: { title: { $regex: params['release_dub.prefer'] } }}
          }] : []),
          ...(params['release_dub.avoid'] ? [{
            'releases': { $not: { $elemMatch: { title: { $regex: params['release_dub.avoid'] } }} }
          }] : []),
          ...(params['release_language.prefer'] ? [{
            'releases': { $elemMatch: { title: { $regex: params['release_language.prefer'] } }}
          }] : []),
          ...(params['release_language.avoid'] ? [{
            'releases': { $not: { $elemMatch: { title: { $regex: params['release_language.avoid'] } }} }
          }] : []),
          ...(params['release_flags.prefer'] ? [{
            'releases': { $elemMatch: { title: { $regex: params['release_flags.prefer'] } }}
          }] : []),
          ...(params['release_flags.avoid'] ? [{
            'releases': { $not: { $elemMatch: { title: { $regex: params['release_flags.avoid'] } }} }
          }] : []),
          ...(params['release_from'] ? [{
            'releases': { $elemMatch: { from: { $in: params['release_from'].split('|') } } }
          }] : []),
          ...(params['release_size.lte'] ? [{
            'releases': { $elemMatch: { size: { $lte: params['release_size.lte'] * Math.pow(1024, 3) } } }
          }] : []),
          ...(params['release_size.gte'] ? [{
            'releases': { $elemMatch: { size: { $gte: params['release_size.gte'] * Math.pow(1024, 3) } } }
          }] : []),
        ],
      } : {}),
    }, {
      page,
      lean: true,
      ...(limit ? { limit } : { pagination: false }),
      sort: { [params.sort_by.split('.')[0]]: params.sort_by.split('.')[1], id: 1 },
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
      limit: 200,
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

  listenMetadata(): Observable<MessageEvent> {
    this.logger.log('ListenMetadata')
    const stream = this.movieModel.watch()

    return fromEventPattern(
      (handler) => stream.on('change', handler),
      (handler) => {
        this.logger.log('ListenMetadata, closed')
        stream.removeListener('change', handler)
        stream.close()
      },
    ).pipe(
      filter((change: any) => change?.ns?.coll === 'movies'),
      mergeMap((change: any) => this.movieModel.find({ 'id': { $eq: change?.documentKey?._id } }, METADATA_FIELDS).lean().exec()),
      map(metadata => ({ data: metadata.reduce((acc, curr) => ({ ...acc, [curr._id]: curr }), {}) } as MessageEvent)),
      tap(() => this.logger.log(`ListenMetadata, message=""`)),
    )
  }

  async getStatistics(params = {} as any, context: 'library' | 'requests' = 'library') {
    this.logger.log('GetStatistics')
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
            { $unwind: "$genres" },
            {
              $group: {
                _id: "$genres.id",
                count: { $sum: 1 },
              }
            },
          ],
          original_languages: [{
            $group: {
              _id: "$original_language",
              count: { $sum: 1 }
            },
          }],
          spoken_languages: [
            { $unwind: "$spoken_languages" },
            {
              $group: {
                _id: "$spoken_languages.iso_639_1",
                count: { $sum: 1 },
              }
            },
          ],
          production_companies: [
            { $unwind: "$production_companies" },
            {
              $group: {
                _id: "$production_companies.name",
                count: { $sum: 1 },
              }
            },
          ],
          requested_by: [
            { $unwind: "$requested_by" },
            {
              $group: {
                _id: "$requested_by",
                count: { $sum: 1 },
              }
            },
          ],
          popularity: [{
            $bucket: {
              groupBy: "$popularity",
              boundaries: fields.popularity.boundaries,
              default: -1,
              output: {
                count: { $sum: 1 }
              },
            },
          }],
          release_date: [{
            $group: {
              _id: { $year: "$release_date" },
              count: { $sum: 1 }
            },
          }],
          runtime: [{
            $bucket: {
              groupBy: "$runtime",
              boundaries: fields.runtime.boundaries,
              default: -1,
              output: {
                count: { $sum: 1 }
              },
            },
          }],
          state: [{
            $group: {
              _id: "$state",
              count: { $sum: 1 }
            },
          }],
          policy: [{
            $group: {
              _id: { $ifNull: ["$policy", (this.configService.config.get('policies') || {})[0]?.name || 'Unknown'] },
              count: { $sum: 1 }
            },
          }],
          proposal: [
            { $match: { state: { $nin: ['ignored'] }, 'releases.proposal': true } },
            { $group: { _id: null, count: { $sum: 1 } } },
          ],
          vote_average: [{
            $bucket: {
              groupBy: "$vote_average",
              boundaries: fields.vote_average.boundaries,
              default: -1,
              output: {
                count: { $sum: 1 }
              },
            },
          }],
          vote_count: [{
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
            {
              $match: {
                state: { $nin: ['ignored'] },
                ...(params.state ? {
                  state: { $in: params.state.split('|') }
                } : {}),
                ...(params.policy ? {
                  policy: { $in: params.policy.split('|') }
                } : {}),
                ...(typeof params.refine === 'boolean' ? {
                  refine: params.refine ? { $ne: false } : { $eq: false },
                } : {}),
                ...(typeof params.shrink === 'boolean' ? {
                  shrink: params.shrink ? { $ne: false } : { $eq: false },
                } : {}),
                ...((params.genres && !/\,/.test(params.genres)) ? {
                  'genres.id': { $in: params.genres.split('|').map(Number) }
                } : {}),
                ...((params.genres && /\,/.test(params.genres)) ? {
                  'genres.id': { $all: params.genres.split(',').map(Number) }
                } : {}),
                ...((params.original_languages && !/\,/.test(params.original_languages)) ? {
                  'original_language': { $in: params.original_languages.split('|') }
                } : {}),
                ...((params.original_languages && /\,/.test(params.original_languages)) ? {
                  'original_language': { $all: params.original_languages.split(',') }
                } : {}),
                ...((params.spoken_languages && !/\,/.test(params.spoken_languages)) ? {
                  'spoken_languages.iso_639_1': { $in: params.spoken_languages.split('|') }
                } : {}),
                ...((params.spoken_languages && /\,/.test(params.spoken_languages)) ? {
                  'spoken_languages.iso_639_1': { $all: params.spoken_languages.split(',') }
                } : {}),
                ...((params.production_companies && !/\,/.test(params.production_companies)) ? {
                  'production_companies.name': { $in: params.production_companies.split('|') }
                } : {}),
                ...((params.production_companies && /\,/.test(params.production_companies)) ? {
                  'production_companies.name': { $all: params.spoken_languages.split(',') }
                } : {}),
                ...(params.requested_by ? {
                  requested_by: {
                    ...(!/\,/.test(params.requested_by) ? {
                      $in: params.requested_by.split('|'),
                    } : {}),
                    ...(/\,/.test(params.requested_by) ? {
                      $all: params.requested_by.split(','),
                    } : {}),
                  },
                } : {}),
                ...(params['requested_by.gte'] ? {
                  [`requested_by.${Number(params['requested_by.gte']) - 1}`]: { $exists: true },
                } : {}),
                ...((params['refined_at.lte'] || params['refined_at.gte']) ? {
                  refined_at: {
                    ...(params['refined_at.lte'] ? { $not: { $gte: params['refined_at.lte'] }  } : {}),
                    ...(params['refined_at.gte'] ? { $not: { $lte: params['refined_at.gte'] }  } : {}),
                  },
                } : {}),
                ...((params['shrinked_at.lte'] || params['shrinked_at.gte']) ? {
                  shrinked_at: {
                    ...(params['shrinked_at.lte'] ? { $not: { $gte: params['shrinked_at.lte'] }  } : {}),
                    ...(params['shrinked_at.gte'] ? { $not: { $lte: params['shrinked_at.gte'] }  } : {}),
                  },
                } : {}),
                ...((params['release_date.lte'] || params['release_date.gte']) ? {
                  release_date: {
                    ...(params['release_date.lte'] ? { $lte: new Date(params['release_date.lte']) } : {}),
                    ...(params['release_date.gte'] ? { $gte: new Date(params['release_date.gte']) } : {}),
                  },
                } : {}),
                ...((params['popularity.lte'] || params['popularity.gte']) ? {
                  popularity: {
                    ...(params['popularity.lte'] ? { $lte: Number(params['popularity.lte']) } : {}),
                    ...(params['popularity.gte'] ? { $gte: Number(params['popularity.gte']) } : {}),
                  },
                } : {}),
                ...((params['vote_average.lte'] || params['vote_average.gte']) ? {
                  vote_average: {
                    ...(params['vote_average.lte'] ? { $lte: Number(params['vote_average.lte']) } : {}),
                    ...(params['vote_average.gte'] ? { $gte: Number(params['vote_average.gte']) } : {}),
                  },
                } : {}),
                ...((params['vote_count.lte'] || params['vote_count.gte']) ? {
                  vote_count: {
                    ...(params['vote_count.lte'] ? { $lte: Number(params['vote_count.lte']) } : {}),
                    ...(params['vote_count.gte'] ? { $gte: Number(params['vote_count.gte']) } : {}),
                  },
                } : {}),
                ...((params['budget.lte'] || params['budget.gte']) ? {
                  budget: {
                    ...(params['budget.lte'] ? { $lte: Number(params['budget.lte']) * 1000000 } : {}),
                    ...(params['budget.gte'] ? { $gte: Number(params['budget.gte']) * 1000000 } : {}),
                  },
                } : {}),
                ...((params['runtime.lte'] || params['runtime.gte']) ? {
                  runtime: {
                    ...(params['runtime.lte'] ? { $lte: Number(params['runtime.lte']) } : {}),
                    ...(params['runtime.gte'] ? { $gte: Number(params['runtime.gte']) } : {}),
                  },
                } : {}),
                ...(Object.keys(params).some(key => [
                  'releases.proposal',
                  'release_znab.prefer',
                  'release_znab.avoid',
                  'release_encoding.prefer',
                  'release_encoding.avoid',
                  'release_resolution.prefer',
                  'release_resolution.avoid',
                  'release_source.prefer',
                  'release_source.avoid',
                  'release_dub.prefer',
                  'release_dub.avoid',
                  'release_language.prefer',
                  'release_language.avoid',
                  'release_flags.prefer',
                  'release_flags.avoid',
                  'release_from',
                  'release_size.lte',
                  'release_size.gte',
                ].includes(key)) ? {
                  $and: [
                    ...(params['releases.proposal'] ? ({
                      true: [{ 'releases': { $elemMatch: { 'proposal': true } } }],
                      false: [{ 'releases': { $not: { $elemMatch: { 'proposal': true } } } }],
                    })[params['releases.proposal']] || [] : []),
                    ...(params['release_znab.prefer'] ? [{
                      'releases': { $elemMatch: { znab: { $in: params['release_znab.prefer'].split('|') } }}
                    }] : []),
                    ...(params['release_znab.avoid'] ? [{
                      'releases': { $not: { $elemMatch: { znab: { $nin: params['release_znab.avoid'].split('|') } }} }
                    }] : []),
                    ...(params['release_encoding.prefer'] ? [{
                      'releases': { $elemMatch: { title: { $regex: params['release_encoding.prefer'] } }}
                    }] : []),
                    ...(params['release_encoding.avoid'] ? [{
                      'releases': { $not: { $elemMatch: { title: { $regex: params['release_encoding.avoid'] } }} }
                    }] : []),
                    ...(params['release_resolution.prefer'] ? [{
                      'releases': { $elemMatch: { title: { $regex: params['release_resolution.prefer'] } }}
                    }] : []),
                    ...(params['release_resolution.avoid'] ? [{
                      'releases': { $not: { $elemMatch: { title: { $regex: params['release_resolution.avoid'] } }} }
                    }] : []),
                    ...(params['release_source.prefer'] ? [{
                      'releases': { $elemMatch: { title: { $regex: params['release_source.prefer'] } }}
                    }] : []),
                    ...(params['release_source.avoid'] ? [{
                      'releases': { $not: { $elemMatch: { title: { $regex: params['release_source.avoid'] } }} }
                    }] : []),
                    ...(params['release_dub.prefer'] ? [{
                      'releases': { $elemMatch: { title: { $regex: params['release_dub.prefer'] } }}
                    }] : []),
                    ...(params['release_dub.avoid'] ? [{
                      'releases': { $not: { $elemMatch: { title: { $regex: params['release_dub.avoid'] } }} }
                    }] : []),
                    ...(params['release_language.prefer'] ? [{
                      'releases': { $elemMatch: { title: { $regex: params['release_language.prefer'] } }}
                    }] : []),
                    ...(params['release_language.avoid'] ? [{
                      'releases': { $not: { $elemMatch: { title: { $regex: params['release_language.avoid'] } }} }
                    }] : []),
                    ...(params['release_flags.prefer'] ? [{
                      'releases': { $elemMatch: { title: { $regex: params['release_flags.prefer'] } }}
                    }] : []),
                    ...(params['release_flags.avoid'] ? [{
                      'releases': { $not: { $elemMatch: { title: { $regex: params['release_flags.avoid'] } }} }
                    }] : []),
                    ...(params['release_from'] ? [{
                      'releases': { $elemMatch: { from: { $in: params['release_from'].split('|') } } }
                    }] : []),
                    ...(params['release_size.lte'] ? [{
                      'releases': { $elemMatch: { size: { $lte: params['release_size.lte'] * Math.pow(1024, 3) } } }
                    }] : []),
                    ...(params['release_size.gte'] ? [{
                      'releases': { $elemMatch: { size: { $gte: params['release_size.gte'] * Math.pow(1024, 3) } } }
                    }] : []),
                  ],
                } : {}),
              }
            },
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
