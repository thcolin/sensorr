import qs from 'query-string'

export class API {
  private base: string = `/api/`
  public access_token: string = ''

  public query = {
    auth: (
      { body, init = {} }: { body: any, init?: any }
    ): { uri: string, params: {}, init: {} } => ({
      uri: 'auth',
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
            Authorization: `Bearer __ACCESS_TOKEN__`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        }
      }),
      deleteMovie: (
        { body, init = {} }: { body: any, init?: any }
      ): { uri: string, params: {}, init: {} } => ({
        uri: 'movies',
        params: {},
        init: {
          ...init,
          method: 'DELETE',
          headers: {
            Authorization: `Bearer __ACCESS_TOKEN__`,
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
            Authorization: `Bearer __ACCESS_TOKEN__`,
            Accept: 'application/json',
          },
        }
      }),
      getMetadata: (
        { init = {}, params: { page = 1 } = {} }: { init?: any, params?: { page?: number } }
      ): { uri: string, params: {}, init: {} } => ({
        uri: 'movies/metadata',
        params: {
          page,
        },
        init: {
          ...init,
          method: 'GET',
          headers: {
            Authorization: `Bearer __ACCESS_TOKEN__`,
            Accept: 'application/json',
          },
        }
      }),
      getStatistics: (
        { init = {}, params = {} }: { init?: any, params?: { [key: string]: any } }
      ): { uri: string, params: {}, init: {} } => ({
        uri: 'movies/statistics',
        params,
        init: {
          ...init,
          method: 'GET',
          headers: {
            Authorization: `Bearer __ACCESS_TOKEN__`,
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
            Authorization: `Bearer __ACCESS_TOKEN__`,
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
            Authorization: `Bearer __ACCESS_TOKEN__`,
            Accept: 'application/json',
          },
        }
      }),
      getMetadata: (
        { init = {}, params: { page = 1 } = {} }: { init?: any, params?: { page?: number } }
      ): { uri: string, params: {}, init: {} } => ({
        uri: 'persons/metadata',
        params: {
          page,
        },
        init: {
          ...init,
          method: 'GET',
          headers: {
            Authorization: `Bearer __ACCESS_TOKEN__`,
            Accept: 'application/json',
          },
        }
      }),
      getStatistics: (
        { init = {} }: { init?: any }
      ): { uri: string, params: {}, init: {} } => ({
        uri: 'persons/statistics',
        params: {},
        init: {
          ...init,
          method: 'GET',
          headers: {
            Authorization: `Bearer __ACCESS_TOKEN__`,
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
            Authorization: `Bearer __ACCESS_TOKEN__`,
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
            Authorization: `Bearer __ACCESS_TOKEN__`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      }),
    },
    guests: {
      postGuest: (
        { body, init = {} }: { body: any, init?: any }
      ): { uri: string, params: {}, init: {} } => ({
        uri: 'guests',
        params: {},
        init: {
          ...init,
          method: 'POST',
          headers: {
            Authorization: `Bearer __ACCESS_TOKEN__`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        }
      }),
      getGuests: (
        { init = {} }: { init?: any } = {}
      ): { uri: string, params: {}, init: {} } => ({
        uri: `guests`,
        params: {},
        init: {
          ...init,
          method: 'GET',
          headers: {
            Authorization: `Bearer __ACCESS_TOKEN__`,
            Accept: 'application/json',
          },
        }
      }),
      deleteGuest: (
        { body, init = {} }: { body: any, init?: any }
      ): { uri: string, params: {}, init: {} } => ({
        uri: 'guests',
        params: {},
        init: {
          ...init,
          method: 'DELETE',
          headers: {
            Authorization: `Bearer __ACCESS_TOKEN__`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        }
      }),
      register: (
        { init = {} }: { init?: any }
      ): { uri: string, params: {}, init: {} } => ({
        uri: 'guests/register',
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
    config: {
      getConfig: (
        { init = {} }: { init?: any }
      ): { uri: string, params: {}, init: {} } => ({
        uri: 'config',
        params: {},
        init: {
          ...init,
          method: 'GET',
          headers: {
            Authorization: `Bearer __ACCESS_TOKEN__`,
            Accept: 'application/json',
          },
        }
      }),
      putConfig: (
        { body, init = {} }: { body: { key: string, value: any }, init?: any }
      ): { uri: string, params: {}, init: {} } => ({
        uri: 'config',
        params: {},
        init: {
          ...init,
          method: 'PUT',
          headers: {
            Authorization: `Bearer __ACCESS_TOKEN__`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        }
      }),
    },
    jobs: {
      statusProcess: (
        { init = {} }: { init?: any }
      ): { uri: string, params: {}, init: {} } => ({
        uri: 'jobs/process',
        params: {},
        init: {
          ...init,
          method: 'GET',
          headers: {
            Authorization: `Bearer __ACCESS_TOKEN__`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      }),
      runJob: (
        { body, init = {} }: { body: any, init?: any }
      ): { uri: string, params: {}, init: {} } => ({
        uri: 'jobs',
        params: {},
        init: {
          ...init,
          method: 'POST',
          headers: {
            Authorization: `Bearer __ACCESS_TOKEN__`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        }
      }),
      stopJob: (
        { init = {}, params: { job } }: { init?: any, params: { job: string } }
      ): { uri: string, params: {}, init: {} } => ({
        uri: `jobs/${job}`,
        params: {},
        init: {
          ...init,
          method: 'DELETE',
          headers: {
            Authorization: `Bearer __ACCESS_TOKEN__`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      }),
      postJobLog: (
        { body, init = {}, params: { job } }: { body: any, init?: any, params: { job: string } }
      ): { uri: string, params: {}, init: {} } => ({
        uri: `jobs/${job}/logs`,
        params: {},
        init: {
          ...init,
          method: 'POST',
          headers: {
            Authorization: `Bearer __ACCESS_TOKEN__`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        },
      }),
    },
    sensorr: {
      downloadRelease: (
        { body, init = {}, params: { source = 'enclosure', destination = 'fs' } = { source: 'enclosure', destination: 'fs' } }: { body: any, init?: any, params?: { source?: 'enclosure' | 'cache', destination?: 'fs' | 'cache' } }
      ): { uri: string, params: {}, init: {} } => ({
        uri: 'sensorr/release/download',
        params: {
          source,
          destination,
        },
        init: {
          ...init,
          method: 'POST',
          headers: {
            Authorization: `Bearer __ACCESS_TOKEN__`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        }
      }),
      removeRelease: (
        { body, init = {} }: { body: any, init?: any }
      ): { uri: string, params: {}, init: {} } => ({
        uri: 'sensorr/release',
        params: {},
        init: {
          ...init,
          method: 'DELETE',
          headers: {
            Authorization: `Bearer __ACCESS_TOKEN__`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        }
      }),
    },
  }

  constructor(base, access_token = '') {
    this.base = base
    this.access_token = access_token
  }

  build(uri: string, params: any = {}) {
    return `${this.base}${uri}${Object.keys(params).length ? `?${qs.stringify(params)}` : ''}`
  }

  async login(username, password) {
    const { uri, params, init } = this.query.auth({ body: { username, password } })
    const { access_token } = (await this.fetch(uri, params, init)) as any
    this.access_token = access_token
    return this.access_token
  }

  async fetch(uri: string, params?: any, init?: any, options?: { [key: string]: any }) {
    const res = await fetch(this.build(uri, params), {
      ...(init || {}),
      headers: {
        ...(init || {}).headers,
        ...((init || {}).headers?.Authorization ? {
          Authorization: ((init || {}).headers?.Authorization || '').replace('__ACCESS_TOKEN__', this.access_token),
        } : {}),
      },
    })

    if (!res.ok) {
      if (options?.rawError) {
        throw res
      } else {
        throw new Error(`[API] "${res.url}": ${res.status} (${res.statusText})`)
      }
    }

    const body = await res.json()
    return body
  }
}
