import * as qs from 'query-string'
import { certifications } from './certifications'
import { studios } from './studios'
import { Genre } from './interfaces'

export class TMDB {
  // TODO: Remove last /
  base: string = 'https://api.themoviedb.org/3/'
  key: string
  region: string = 'en-US'
  genres: Genre[] = []
  studios = studios
  certifications = certifications
  adult: boolean = false
  ready: boolean = false
  events: { fetchStart?: (uri: string, params: {}) => void; fetchEnd?: (uri: string, params: {}) => void } = {}

  constructor({
    key,
    adult,
    region,
    events,
  }: {
    key: string
    adult?: boolean
    region?: string
    events?: { fetchStart?: (uri: string, params: {}) => void; fetchEnd?: (uri: string, params: {}) => void }
  }) {
    this.key = key

    if (region) {
      this.region = region
    }

    if (events) {
      this.events = events
    }

    if (typeof adult !== 'undefined') {
      this.adult = adult
    }

    this.init()
  }

  async init() {
    try {
      const body = await this.fetch('genre/movie/list', {}, {}, true)
      this.genres = body.genres.reduce((acc, genre) => ({ ...acc, [genre.id]: genre }), {})
    } catch (e) {
      console.warn(e)
    } finally {
      this.ready = true
    }
  }

  build(uri: string, params: any = {}) {
    const query = {
      language: this.region,
      ...params,
      api_key: this.key,
      include_adult: this.adult,
      include_video: false,
    }

    return `${this.base}${uri}?${qs.stringify(query)}`
  }

  transform(body: any, { uri, params = {} }: { uri: string; params: any }) {
    switch (uri) {
      case 'trending/movie/day':
      case 'discover/movie':
      case 'movie/upcoming':
      case 'movie/now_playing':
      case 'search/movie':
        return {
          ...body,
          results: body.results.map(({ genre_ids, ...result }) => ({
            ...result,
            genres: genre_ids.map((id) => this.genres[id]),
          })),
          // TODO: Remove [TMDB issue](https://www.themoviedb.org/talk/61bbb4dc6a300b00977d906c) is fixed
          total_results: Math.min(10000, body.total_results),
          total_pages: Math.min(500, body.total_pages),
        }
      case (uri.match(/movie\/\d+/) || {}).input:
        return {
          ...body,
          ...(body.recommendations && {
            recommendations: {
              ...body.recommendations,
              results: body.recommendations.results.map(({ genre_ids, ...result }) => ({
                ...result,
                genres: genre_ids.map((id) => this.genres[id]),
              })),
            },
          }),
          ...(body.similar && {
            similar: {
              ...body.similar,
              results: body.similar.results.map(({ genre_ids, ...result }) => ({
                ...result,
                genres: genre_ids.map((id) => this.genres[id]),
              })),
            },
          }),
        }
      case (uri.match(/person\/\d+/) || {}).input:
        return {
          ...body,
          ...(body.movie_credits && {
            movie_credits: {
              ...body.movie_credits,
              cast: body.movie_credits.cast.map(({ genre_ids, ...cast }) => ({
                ...cast,
                genres: genre_ids.map((id) => this.genres[id]),
              })),
              crew: body.movie_credits.crew.map(({ genre_ids, ...crew }) => ({
                ...crew,
                genres: genre_ids.map((id) => this.genres[id]),
              })),
            },
          }),
        }
      case (uri.match(/collection\/\d+/) || {}).input:
        return {
          ...body,
          parts: body.parts.map(({ genre_ids, ...result }) => ({
            ...result,
            genres: genre_ids.map((id) => this.genres[id]),
          })),
        }
      default:
        return body
    }
  }

  async fetch(uri: string, params?: any, init?: any, force?: boolean) {
    const t = Date.now()

    if (typeof this.events.fetchStart === 'function') {
      this.events.fetchStart(uri, { ...params, t })
    }

    if (!force && !this.ready) {
      await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (this.ready) {
            clearInterval(interval)
            resolve(true)
          }
        }, 100)
      })
    }

    const res = await fetch(this.build(uri, params), init)
    const body = await res.json().catch(() => {
      throw new Error(`[TMDB] ${res.url} ${res.status}: ${res.statusText}`)
    })

    if (
      ((body.errors || []).length === 1 && body.errors[0] === 'query must be provided') ||
      (uri === 'search/collection' && body.status_code === 34)
    ) {
      return { ...body, results: [], total_results: 0 }
    }

    if ((body.errors || []).length) {
      throw new Error(body.errors.join(', '))
    }

    if (body.success === false && body.status_code === 7) {
      throw new Error('Invalid TMDB API key, check your configuration.')
    }

    if (body.success === false) {
      throw new Error(body.status_message)
    }

    if (!res.ok) {
      throw new Error(`[TMDB] ${res.url} ${res.status}: ${res.statusText}`)
    }

    if (typeof this.events.fetchEnd === 'function') {
      this.events.fetchEnd(uri, { ...params, t })
    }

    return this.transform(body, { uri, params })
  }
}
