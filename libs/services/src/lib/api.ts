import * as qs from 'query-string'

export class API {
  private base: string = `/api/`

  public query = {
    movies: {
      postMovie: (
        { body, init = {} }: { body: any, init?: any }
      ): { uri: string, params: {}, init: {} } => ({
        uri: 'movies',
        params: {},
        init: {
          ...init,
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        }
      }),
      getMovies: (
        { init = {}, params: { page = 1, ...params } = {} }: { init?: any, params?: { page?: number, [key: string]: any } }
      ): { uri: string, params: {}, init: {} } => ({
        uri: `movies`,
        params: {
          ...params,
          page,
        },
        init: {
          ...init,
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      }),
      getMetadata: (
        { init = {} }: { init?: any }
      ): { uri: string, params: {}, init: {} } => ({
        uri: 'movies/metadata',
        params: {},
        init: {
          ...init,
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      }),
      getStatistics: (
        { init = {} }: { init?: any }
      ): { uri: string, params: {}, init: {} } => ({
        uri: 'movies/statistics',
        params: {},
        init: {
          ...init,
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      }),
    },
    persons: {
      postPerson: (
        { body, init = {} }: { body: any, init?: any }
      ): { uri: string, params: {}, init: {} } => ({
        uri: 'persons',
        params: {},
        init: {
          ...init,
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        }
      }),
      getPersons: (
        { init = {}, params: { page = 1 } = {} }: { init?: any, params?: { page?: number } }
      ): { uri: string, params: {}, init: {} } => ({
        uri: `persons`,
        params: {
          page,
        },
        init: {
          ...init,
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      }),
      getMetadata: (
        { init = {} }: { init?: any }
      ): { uri: string, params: {}, init: {} } => ({
        uri: 'persons/metadata',
        params: {},
        init: {
          ...init,
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      }),
    },
    plex: {
      register: (
        { body, init = {} }: { body: any, init?: any }
      ): { uri: string, params: {}, init: {} } => ({
        uri: 'plex',
        params: {},
        init: {
          ...init,
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        }
      }),
      reset: (
        { init = {} }: { init?: any }
      ): { uri: string, params: {}, init: {} } => ({
        uri: 'plex',
        params: {},
        init: {
          ...init,
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      }),
    },
    config: {
      putConfig: (
        { body, init = {} }: { body: { key: string, value: any }, init?: any }
      ): { uri: string, params: {}, init: {} } => ({
        uri: 'config',
        params: {},
        init: {
          ...init,
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        }
      }),
    }
  }

  constructor(base) {
    this.base = base
  }

  build(uri: string, params: any = {}) {
    return `${this.base}${uri}${Object.keys(params).length ? `?${qs.stringify(params)}` : ''}`
  }

  async fetch(uri: string, params?: any, init?: any) {
    const res = await fetch(this.build(uri, params), init)

    if (!res.ok) {
      throw new Error(`[API] "${res.url}": ${res.status} (${res.statusText})`)
    }

    const body = await res.json()
    return body
  }
}
