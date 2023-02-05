import { PaginateModel, PaginateResult } from 'mongoose'
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Plex } from '@sensorr/plex'
import { EMPTY, from, interval, Observable, of } from 'rxjs'
import { map, mergeMap, takeWhile, tap } from 'rxjs/operators'
import { MoviesService } from '../movies/movies.service'
import { Guest as GuestDocument } from './guest.schema'
import app from './../../../../../package.json'

@Injectable()
export class GuestsService {
  private readonly logger = new Logger(GuestsService.name)

  constructor(
    @InjectModel(GuestDocument.name) private readonly guestModel: PaginateModel<GuestDocument>,
    private readonly moviesService: MoviesService
  ) {}

  async register() {
    const plex = Plex({ url: 'https://metadata.provider.plex.tv:443', fallbackPort: 443 }, app)
    const { id, code } = await plex.authenticator.getNewPin()
    this.logger.log(`Register "${JSON.stringify({ id, code })}"`)
    return { id, code, done: false }
  }

  listenRegistration(id): Observable<MessageEvent> {
    this.logger.log(`ListenRegistration "${id}"`)
    const plex = Plex({ url: 'https://metadata.provider.plex.tv:443', fallbackPort: 443 }, app)

    // TODO: Check for observable status after tab close (should be closed)
    return interval(2000).pipe(
      mergeMap(() => from(new Promise(async resolve => plex.authenticator.checkPinForAuth(id, (error, status) => resolve({ error, status }))))),
      takeWhile(({ error, status }) => !error && status === 'waiting', true),
      mergeMap(({ error, status }) => {
        if (error) {
          this.logger.log(`ListenRegistration "${id}", error="${error}"`)
          return of({ data: { error } } as MessageEvent)
        }

        if (!['waiting', 'authorized'].includes(status)) {
          this.logger.log(`ListenRegistration "${id}", error="Invalid Pin status '${status}'"`)
          return of({ data: { error: `Invalid Pin status "${status}"` } } as MessageEvent)
        }

        if (status !== 'authorized') {
          this.logger.log(`ListenRegistration "${id}", status="${status}"`)
          return EMPTY
        }

        return of(plex.authenticator.token).pipe(
          tap(() => this.logger.log(`ListenRegistration "${id}", status="${status}", registered`)),
          mergeMap(token => from(
            Plex({ url: 'https://plex.tv:443', token, fallbackPort: 443 }, app).query(`/api/v2/user`)
          ).pipe(
            mergeMap(({ email, thumb: avatar, title, username }) => this.upsertGuest({ email, avatar, name: title || username, plex_id: id, plex_token: token }))
          )),
          map(() => ({ data: { done: true } } as MessageEvent))
        )
      })
    )
  }

  async upsertGuest(guest): Promise<any> {
    this.logger.log(`UpsertGuest "${guest.email}"`)
    return this.guestModel.findOneAndUpdate({ email: guest.email }, guest, { new: true, upsert: true }).lean()
  }

  async deleteGuest(guest): Promise<any> {
    this.logger.log(`DeleteGuest "${guest.email}"`)
    await this.moviesService.removeMoviesGuestRequests(guest.email)
    return this.guestModel.deleteOne({ email: guest.email })
  }

  async getGuests(): Promise<PaginateResult<GuestDocument>> {
    this.logger.log(`GetGuests`)
    return this.guestModel.paginate({}, { pagination: false, lean: true, leanWithId: true, customLabels: { totalDocs: 'total_results', docs: 'results' } })
  }
}
