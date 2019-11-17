const pm2 = require('@server/store/pm2')
const Plex = require('@server/store/plex')
const Config = require('@server/store/config')
const { of, from, throwError, bindNodeCallback } = require('rxjs')
const { tap, mergeMap, catchError } = require('rxjs/operators')
const PlexService = require('@shared/services/Plex')
const loggers = require('@server/utils/loggers')
const log = loggers.default

function plex(req, res) {
  const url = req.body.url || ''
  const unregister = !url

  const payload = {
    url: url || Config.payload.plex.url || '',
    pin: {},
    token: '',
  }

  from(Config.replace({ plex: payload })).pipe(
    mergeMap(() => unregister ?
      of(null).pipe(
        tap(() => res.status(200).send({ plex: Config.payload.plex })),
        tap(() => Plex.state('off')),
        tap(() => log('plex', { event: 'unregister' }), { color: 'yellow' }),
      ) :
      of(new PlexService(Config.payload.plex)).pipe(
        mergeMap(plex => from(plex.register()).pipe(
          catchError(err => {
            log('plex', { err }, { err: true })
            Plex.state(null, err)
            return throwError({ code: 400, body: { err } })
          }),
          tap(pin => payload.pin = pin),
          mergeMap(() => Config.replace({ plex: payload })),
          tap(() => res.status(200).send({ plex: Config.payload.plex })),
          tap(() => log('plex', { pin: Config.payload.plex.pin })),
          mergeMap(() => Plex.listen().pipe(
            catchError(err => {
              log('plex', { err }, { err: true })
              Plex.state(null, err)
              return throwError({ code: 400, body: { err } })
            }),
            tap(() => payload.token = plex.token),
            mergeMap(() => Config.replace({ plex: payload })),
            mergeMap(() => bindNodeCallback(pm2.restart.bind(pm2))('sensorr:pairwise').pipe(
              tap(() => log('trigger', { event: 'success', job: 'sensorr:pairwise' })),
            )),
          )),
        )),
      )
    ),
  ).subscribe(
    () => {},
    (err) => {
      log('plex', { err }, { err: true })

      if (!res.headersSent) {
        res.status(err.code || 400).send(err.body || { err })
      }
    },
  )
}

module.exports = plex
