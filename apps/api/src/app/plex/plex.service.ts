import { Injectable } from '@nestjs/common'
import PlexAPI from 'plex-api'
import PlexPinAuth from 'plex-api-pinauth'
import { EMPTY, from, interval, Observable, of } from 'rxjs'
import { map, mergeMap, tap } from 'rxjs/operators'
import { ConfigService } from '../config/config.service'
import app from './../../../../../package.json'

@Injectable()
export class PlexService {
  constructor(private configService: ConfigService) {}

  async register(raw) {
    const url = new URL(raw || '')
    const client = new PlexAPI({
      hostname: url.hostname,
      port: url.port || 32400,
      https: url.protocol === 'https:',
      authenticator: PlexPinAuth({}),
      options: {
        // TODO: Should use env variable
        identifier: '56dc3686-4a64-4e26-9389-4d04fe588850',
        product: app.name,
        version: app.version,
        deviceName: app.name,
      }
    })

    this.configService.config.set('plex.url', raw)
    this.configService.config.set('plex.pin', await client.authenticator.getNewPin())
    await this.configService.write()
    return this.configService.config.get('plex.pin')
  }

  async reset() {
    this.configService.config.set('plex.url', '')
    this.configService.config.set('plex.pin.id', '')
    this.configService.config.set('plex.pin.code', '')
    this.configService.config.set('plex.token', '')
    await this.configService.write()
  }

  listenStatus(id): Observable<MessageEvent> {
    if (!this.configService.config.get('plex.url')) {
      return of({ data: { error: 'No Plex URL defined, first register Plex server' } } as MessageEvent)
    }

    if (this.configService.config.get('plex.token')) {
      return of({ data: { token: this.configService.config.get('plex.token') } } as MessageEvent)
    }

    const url = new URL(this.configService.config.get('plex.url'))

    const client = new PlexAPI({
      hostname: url.hostname,
      port: url.port || 32400,
      https: url.protocol === 'https:',
      authenticator: PlexPinAuth({}),
      options: {
        identifier: '56dc3686-4a64-4e26-9389-4d04fe588850',
        product: app.name,
        version: app.version,
        deviceName: app.name,
      }
    })

    return interval(2000).pipe(
      mergeMap(() => from(new Promise(async resolve => client.authenticator.checkPinForAuth(id, (error, status) => resolve({ error, status }))))),
      mergeMap(({ error, status }) =>
          error ? of({ data: { error } } as MessageEvent) : (
          status === 'authorized' ? (
            of(client.authenticator.token).pipe(
              tap(token => this.configService.config.set('plex.token', token)),
              mergeMap(token => from(this.configService.write()).pipe(
                map(() => ({ data: { token } } as MessageEvent)),
              ))
            )
          ) : EMPTY
        ),
      )
    )
  }
}
