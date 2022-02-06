import fetch from 'node-fetch'
import fs from 'fs/promises'
import path from 'path'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { PaginateModel, PaginateResult } from 'mongoose'
import { filter, mergeMap, map } from 'rxjs/operators'
import { fields } from '@sensorr/tmdb'
import { MovieDTO } from './movie.dto'
import { Movie as MovieDocument } from './movie.schema'
import { Observable, fromEventPattern } from 'rxjs'
import { ConfigService } from '../config/config.service'

@Injectable()
export class MoviesService {
  constructor(
    @InjectModel(MovieDocument.name) private readonly movieModel: PaginateModel<MovieDocument>,
    private configService: ConfigService
  ) {}

  async upsertMovie(movie: MovieDTO): Promise<any> {
    if (movie.state === 'ignored') {
      const res = await this.movieModel.findByIdAndDelete(movie.id)
      res.state = 'ignored'
      return res
    }

    if (movie.release) {
      const res = await fetch(movie.release.enclosure)
      const buffer = await res.buffer()
      await fs.writeFile(path.join(this.configService.config.get('blackhole'), `${movie.release.meta.generated}-${movie.release.znab}.torrent`), buffer)
    }

    return this.movieModel.findByIdAndUpdate(movie.id, movie, { new: true, upsert: true })
  }

  async getMovies(params = {} as any, page: number = 1, limit: number = 20): Promise<PaginateResult<MovieDocument>> {
    return this.movieModel.paginate({
      state: { $ne: null },
      ...(params.state ? {
        state: { $in: params.state.split('|') }
      } : {}),
      ...(params.genres ? {
        'genres.id': { $in: params.genres.split('|').map(parseInt) }
      } : {}),
      ...((params['release_date.lte'] || params['release_date.gte']) ? {
        release_date: {
          ...(params['release_date.lte'] ? { $lte: new Date(params['release_date.lte']) } : {}),
          ...(params['release_date.gte'] ? { $gte: new Date(params['release_date.gte']) } : {}),
        },
      } : {}),
      ...((params['popularity.lte'] || params['popularity.gte']) ? {
        popularity: {
          ...(params['popularity.lte'] ? { $lte: parseInt(params['popularity.lte']) } : {}),
          ...(params['popularity.gte'] ? { $gte: parseInt(params['popularity.gte']) } : {}),
        },
      } : {}),
      ...((params['vote_average.lte'] || params['vote_average.gte']) ? {
        vote_average: {
          ...(params['vote_average.lte'] ? { $lte: parseInt(params['vote_average.lte']) } : {}),
          ...(params['vote_average.gte'] ? { $gte: parseInt(params['vote_average.gte']) } : {}),
        },
      } : {}),
      ...((params['runtime.lte'] || params['runtime.gte']) ? {
        runtime: {
          ...(params['runtime.lte'] ? { $lte: parseInt(params['runtime.lte']) } : {}),
          ...(params['runtime.gte'] ? { $gte: parseInt(params['runtime.gte']) } : {}),
        },
      } : {}),
    }, {
      page,
      ...(limit ? { limit } : { pagination: false }),
      sort: { [params.sort_by.split('.')[0]]: params.sort_by.split('.')[1] },
      customLabels: { totalDocs: 'total_results', docs: 'results' },
    })
  }

  async getMetadata() {
    const res = await this.movieModel.find({}, ['state', 'policy', 'query']).exec()

    return res.reduce((acc, curr) => ({
      ...acc,
      [curr._id]: {
        state: curr.state,
        policy: curr.policy,
        query: curr.query,
      },
    }), {})
  }

  listenMetadata(): Observable<MessageEvent> {
    return fromEventPattern(
      (handler) => this.movieModel.watch().on('change', handler),
      (handler) => this.movieModel.watch().removeListener('change', handler),
    ).pipe(
      filter((change: any) => change?.ns?.coll === 'movies'),
      mergeMap(() => this.getMetadata()),
      map(metadata => ({ data: metadata } as MessageEvent)),
    )
  }

  async getStatistics() {
    const raw = await this.movieModel.aggregate([
      { $match: { state: { $ne: null } } },
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

    return raw[0]
  }
}
