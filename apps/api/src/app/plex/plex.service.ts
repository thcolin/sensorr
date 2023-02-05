import { Injectable, Logger } from '@nestjs/common'
import { Plex } from '@sensorr/plex'
import { EMPTY, from, interval, Observable, of } from 'rxjs'
import { map, mergeMap, takeWhile, tap } from 'rxjs/operators'
import { ConfigService } from '../config/config.service'
import app from './../../../../../package.json'

@Injectable()
export class PlexService {
  private readonly logger = new Logger(PlexService.name)
  constructor(private configService: ConfigService) {}

  async register(url) {
    this.logger.log(`Register, url="${url}"`)
    const plex = Plex({ url }, app)
    this.configService.config.set('plex.url', url)
    this.configService.config.set('plex.pin', await plex.authenticator.getNewPin())
    await this.configService.write()
    return this.configService.config.get('plex.pin')
  }

  async reset() {
    this.logger.log(`Reset`)
    this.configService.config.set('plex.url', '')
    this.configService.config.set('plex.pin.id', '')
    this.configService.config.set('plex.pin.code', '')
    this.configService.config.set('plex.token', '')
    await this.configService.write()
  }

  listenStatus(id): Observable<MessageEvent> {
    this.logger.log(`ListenStatus "${id}"`)

    if (!this.configService.config.get('plex.url')) {
      this.logger.log(`ListenStatus "${id}", error="No Plex URL defined, first register Plex server"`)
      return of({ data: { error: 'No Plex URL defined, first register Plex server' } } as MessageEvent)
    }

    if (this.configService.config.get('plex.token')) {
      this.logger.log(`ListenStatus "${id}", registered`)
      return of({ data: { token: this.configService.config.get('plex.token') } } as MessageEvent)
    }

    const plex = Plex({ url: this.configService.config.get('plex.url') }, app)

    return interval(2000).pipe(
      mergeMap(() => from(new Promise(async resolve => plex.authenticator.checkPinForAuth(id, (error, status) => resolve({ error, status }))))),
      takeWhile(({ error, status }) => !error && status === 'waiting', true),
      mergeMap(({ error, status }) => {
        if (error) {
          this.logger.log(`ListenStatus "${id}", error="${error}"`)
          return of({ data: { error } } as MessageEvent)
        }

        if (!['waiting', 'authorized'].includes(status)) {
          this.logger.log(`ListenStatus "${id}", error="Invalid Pin status '${status}'"`)
          return of({ data: { error: `Invalid Pin status "${status}"` } } as MessageEvent)
        }

        if (status !== 'authorized') {
          this.logger.log(`ListenStatus "${id}", status="${status}"`)
          return EMPTY
        }

        return of(plex.authenticator.token).pipe(
          tap(() => this.logger.log(`ListenRegistration "${id}", status="${status}", registered`)),
          tap(token => this.configService.config.set('plex.token', token)),
          mergeMap(token => from(this.configService.write()).pipe(
            map(() => ({ data: { token } } as MessageEvent)),
          ))
        )
      })
    )
  }
}
