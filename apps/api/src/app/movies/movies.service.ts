import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { PaginateModel, PaginateResult } from 'mongoose'
import { filter, mergeMap, map, tap } from 'rxjs/operators'
import { fields } from '@sensorr/tmdb'
import { MovieDTO } from './movie.dto'
import { Movie as MovieDocument } from './movie.schema'
import { Observable, fromEventPattern } from 'rxjs'

const METADATA_FIELDS = ['state', 'policy', 'cared', 'query', 'plex_url', 'releases', 'banned_releases', 'requested_by']

@Injectable()
export class MoviesService {
  private readonly logger = new Logger(MoviesService.name)

  constructor(
    @InjectModel(MovieDocument.name) private readonly movieModel: PaginateModel<MovieDocument>
  ) {}

  async upsertMovie(movie: MovieDTO): Promise<any> {
    this.logger.log(`UpsertMovie "${movie?.id}", state="${movie?.state}"`)
    return this.movieModel.findByIdAndUpdate(movie.id, movie, { new: true, upsert: true })
  }

  async deleteMovie(movie: MovieDTO): Promise<any> {
    this.logger.log(`DeleteMovie "${movie?.id}"`)
    return this.movieModel.findByIdAndRemove(movie.id)
  }

  async removeMoviesGuestRequests(email: string): Promise<any> {
    return this.movieModel.updateMany({}, { '$pull': { requested_by: email } })
  }

  async getMovies(params = {} as any, page: number = 1, limit: number = 20): Promise<PaginateResult<MovieDocument>> {
    this.logger.log(`GetMovies, params=${JSON.stringify(params)}, page=${page}`)
    const res = await this.movieModel.paginate({
      state: { $nin: ['ignored'] },
      ...(params.state ? {
        state: { $in: params.state.split('|') }
      } : {}),
      ...(typeof params.cared === 'boolean' ? {
        cared: params.cared ? { $ne: false } : { $eq: false },
      } : {}),
      ...((params.genres && !/\,/.test(params.genres)) ? {
        'genres.id': { $in: params.genres.split('|').map(Number) }
      } : {}),
      ...((params.genres && /\,/.test(params.genres)) ? {
        'genres.id': { $all: params.genres.split(',').map(Number) }
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
      ...(params['releases.proposal'] ? ({
        true: { 'releases': { $elemMatch: { 'proposal': true } } },
        false: { 'releases': { $not: { $elemMatch: { 'proposal': true } } } },
      })[params['releases.proposal']] || {} : {}),
      ...((params['cared_at.lte'] || params['cared_at.gte']) ? {
        cared_at: {
          ...(params['cared_at.lte'] ? { $not: { $gte: params['cared_at.lte'] }  } : {}),
          ...(params['cared_at.gte'] ? { $not: { $lte: params['cared_at.gte'] }  } : {}),
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
      ...((params['runtime.lte'] || params['runtime.gte']) ? {
        runtime: {
          ...(params['runtime.lte'] ? { $lte: Number(params['runtime.lte']) } : {}),
          ...(params['runtime.gte'] ? { $gte: Number(params['runtime.gte']) } : {}),
        },
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

    res.results = (res.results as any[]).reduce((acc, curr) => ({ ...acc, [curr._id]: curr }), {})
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

  async getStatistics(params = {} as any) {
    this.logger.log('GetStatistics')
    const raw = await this.movieModel.aggregate([
      {
        $match: {
          state: { $nin: ['ignored'] },
          ...(params.state ? {
            state: { $in: params.state.split('|') }
          } : {}),
          ...(params['requested_by.gte'] ? {
            [`requested_by.${Number(params['requested_by.gte']) - 1}`]: { $exists: true },
          } : {}),
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
          proposal: [
            { $match: { state: { $nin: ['ignored'] } } },
            { $match: { 'releases.proposal': true } },
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
        }
      }
    ])

    raw[0].state.push({ _id: 'proposal', count: raw[0].proposal[0].count })
    delete raw[0].proposal

    return raw[0]
  }
}
