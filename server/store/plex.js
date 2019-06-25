const { of, interval } = require('rxjs')
const { tap, mergeMap, takeWhile, takeLast } = require('rxjs/operators')
const PlexService = require('@shared/services/Plex')
const Config = require('@server/store/config')

const EventEmitter = require('events')

class Plex extends EventEmitter {
  constructor() {
    super()

    this.status = 'unknown'
    this.listen = this.listen.bind(this)
    this.state = this.state.bind(this)

    if ((Config.payload.plex || {}).token) {
      this.state('authorized')
    } else if ((Config.payload.plex || {}).url) {
      this.listen().subscribe(
        () => {},
        (err) => this.state('off', err),
        () => {},
      )
    } else {
      this.state('off')
    }
  }

  state(status, err = null) {
    this.status = err ? 'off' : status
    this.emit('status', err)
  }

  listen() {
    return of(new PlexService(Config.payload.plex)).pipe(
      mergeMap((plex) => interval(5000).pipe(
        mergeMap(() => plex.status()),
        tap(status => this.state(status)),
        takeWhile(status => status === 'waiting', true),
        takeLast(1),
        mergeMap(() => Config.replace({ plex: { ...Config.payload.plex, token: plex.token } })),
      )
    ))
  }
}

module.exports = new Plex()
