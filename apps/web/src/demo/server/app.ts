/* eslint-disable @nx/enforce-module-boundaries */
// The demo runs the controllers and services of `apps/api` as they are: this file is the only one that imports
// them, and the `demo` build aliases what they import from Nest, mongoose and Node to `./shims`
import 'reflect-metadata'
import qs from 'query-string'
import { isObservable, Observable } from 'rxjs'
import { create } from '@sensorr/config'
import { HttpException, parameters, prefixes, routes, Verb } from './shims/nest-common'
import { collections, injections, properties } from './shims/nest-mongoose'
import { EventEmitter2 } from './shims/nest-event-emitter'
import { OperatorsPipe } from '../../../../api/src/app/operators'
import { AuthController } from '../../../../api/src/app/auth/auth.controller'
import { ConfigController } from '../../../../api/src/app/config/config.controller'
import { ConfigService } from '../../../../api/src/app/config/config.service'
import { MoviesController } from '../../../../api/src/app/movies/movies.controller'
import { ShowsController } from '../../../../api/src/app/shows/shows.controller'
import { EpisodesController } from '../../../../api/src/app/shows/episodes.controller'
import { PersonsController } from '../../../../api/src/app/persons/persons.controller'
import { LogsController } from '../../../../api/src/app/logs/logs.controller'
import { JobsController } from '../../../../api/src/app/jobs/jobs.controller'
import { SensorrController } from '../../../../api/src/app/sensorr/sensorr.controller'
import { NotificationsController } from '../../../../api/src/app/notifications/notifications.controller'
import { Movie } from '../../../../api/src/app/movies/movie.schema'
import { Show } from '../../../../api/src/app/shows/show.schema'
import { Episode } from '../../../../api/src/app/shows/episode.schema'
import { Person } from '../../../../api/src/app/persons/person.schema'
import { Log } from '../../../../api/src/app/logs/log.schema'
import { Subscription } from '../../../../api/src/app/notifications/subscription.schema'
import { Guest } from '../../../../api/src/app/guests/guest.schema'
import { Edition } from '../../../../api/src/app/wrapped/wrapped.schema'
import { mount } from './shims/files'
import { unavailable } from './sensorr.service'
import { Model } from './model'
import { ProxyController } from './proxy.controller'
import { GuestsController } from './guests.controller'
import { WrappedController } from './wrapped.controller'
import { Store } from './store'

const CONTROLLERS = [AuthController, ConfigController, MoviesController, ShowsController, EpisodesController, PersonsController, LogsController, JobsController, SensorrController, NotificationsController, ProxyController, GuestsController, WrappedController]
const SCHEMAS = [Movie, Show, Episode, Person, Log, Subscription, Guest, Edition]

export type Response = { status: number, body?: any, stream?: Observable<any> }

const operators = new OperatorsPipe()

const pathOf = (...parts: string[]) => `/${parts.join('/').split('/').filter(Boolean).join('/')}`

const matcherOf = (path: string) => {
  const names: string[] = []
  const pattern = new RegExp(`^${path.replace(/:([^/]+)/g, (_, name) => {
    names.push(name)
    return '([^/]+)'
  })}/?$`)

  return (pathname: string) => {
    const match = pattern.exec(pathname)
    return match ? Object.fromEntries(names.map((name, index) => [name, decodeURIComponent(match[index + 1])])) : null
  }
}

const failure = (err: any): Response => {
  if (err instanceof HttpException) {
    const response = err.getResponse()
    return { status: err.getStatus(), body: typeof response === 'object' ? response : { statusCode: err.getStatus(), message: response } }
  }

  console.error('[Demo]', err)
  return { status: 500, body: { statusCode: 500, message: 'Internal server error' } }
}

export class App {
  private readonly instances = new Map<any, any>()
  private readonly models = new Map<string, Model>()
  private readonly emitter = new EventEmitter2()
  private readonly table: { verb: Verb, match: (pathname: string) => any, controller: any, key: string }[]

  constructor(readonly store: Store) {
    mount({ read: (name) => store.file(name), write: (name, content) => store.writeFile(name, content) })
    this.instances.set(EventEmitter2, this.emitter)

    // The server and the web app share one bundle, so `@sensorr/config` too: the server reads its own copy, as it
    // does in its own process
    const configService = this.resolve(ConfigService)
    const config = create()
    config.load(configService.config.getProperties())
    configService.config = config

    for (const schema of SCHEMAS) {
      this.models.set(schema.name, new Model(store, collections.get(schema), properties.get(schema) || {}))
    }

    this.table = CONTROLLERS.flatMap((controller) => routes
      .filter((route) => route.target === controller)
      .map((route) => ({ verb: route.verb, match: matcherOf(pathOf(prefixes.get(controller) || '', route.path)), controller: this.resolve(controller), key: route.key })))
  }

  // What Nest's injector does for these classes: a model where `@InjectModel` asks for one, a single instance of
  // each other class the constructor declares
  private resolve(type: any) {
    if (!this.instances.has(type)) {
      const declared = Reflect.getMetadata('design:paramtypes', type) || []
      const named = injections.get(type) || {}
      const count = Math.max(declared.length, ...Object.keys(named).map((index) => Number(index) + 1))
      const instance = new type(...Array.from({ length: count }, (_, index) => named[index] ? this.models.get(named[index]) : this.resolve(declared[index])))
      this.instances.set(type, instance)
      this.emitter.listen(instance)
    }

    return this.instances.get(type)
  }

  model(name: string) {
    return this.models.get(name)
  }

  async handle(verb: Verb, url: URL, body?: any): Promise<Response> {
    const pathname = url.pathname.replace(/^.*?\/api(?=\/)/, '')
    const route = this.table.map((route) => ({ route, params: route.verb === verb ? route.match(pathname) : null })).find(({ params }) => params)

    // Plex, mails, Tautulli, dumps, updates: what needs a server of its own says so
    if (!route) {
      console.warn(`[Demo] No route for ${verb} /api${pathname}`)
      return { status: 503, body: { statusCode: 503, message: unavailable(), error: 'Service Unavailable' } }
    }

    const { controller, key } = route.route
    const query = qs.parse(url.search)
    const sources = { body, query, param: route.params, none: undefined }

    try {
      const args = []

      for (const { index, source, name, pipes } of parameters.get(controller.constructor)?.[key] || []) {
        let value = name ? sources[source]?.[name] : sources[source]

        if (source !== 'none') {
          value = operators.transform(value)
        }

        for (const pipe of pipes) {
          value = (typeof pipe === 'function' ? new pipe() : pipe).transform(value)
        }

        args[index] = value
      }

      const result = await controller[key](...args)

      if (verb === 'SSE') {
        return { status: 200, stream: isObservable(result) ? result : new Observable() }
      }

      return { status: verb === 'POST' ? 201 : 200, body: result }
    } catch (err) {
      return failure(err)
    }
  }
}
