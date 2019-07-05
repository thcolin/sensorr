const { from, interval, zip, EMPTY } = require('rxjs')
const { map, mapTo, tap, mergeMap, delay, pluck, catchError } = require('rxjs/operators')
const { Star } = require('@shared/Documents')
const TMDB = require('@shared/services/TMDB')
const chalk = require('chalk')

async function stalk({ log, sensorr, db }) {
  const tmdb = new TMDB({ key: sensorr.config.tmdb, region: sensorr.config.region })
  log('')

  return await new Promise(resolve =>
    from(db.stars.allDocs({ include_docs: true })).pipe(
      pluck('rows'),
      map(entities => entities.map(entity => ({ id: entity.id, ...entity.doc }))),
      tap(stars => stars.filter(star => star.state === 'stalked').length ? '' : log('🧐', `Oh. It seems you're not stalking anyone.`)),
      mergeMap(stars => zip(
        from(stars.filter(star => star.state === 'stalked')),
        interval(1000),
        (star, i) => star,
      )),
      mergeMap(star => from(tmdb.fetch(['person', star.id], { append_to_response: 'images,movie_credits' })).pipe(
        catchError((err) => {
          log('🚨', { star, err })
          return EMPTY
        }),
        mergeMap(entity => from(db.stars.upsert(star.id, (doc) => ({ ...doc, ...new Star(entity).normalize() }))).pipe(
          mapTo({ previous: star, current: new Star(entity).normalize() }),
        )),
        delay(2000),
      )),
    ).subscribe(
      ({ previous, current }) => log(
        '📰',
        'Stalked',
        `star ${chalk.inverse(current.name)}${current.birthday ? chalk.gray(` (${current.birthday})`) : ''}`,
        'with',
        `${chalk.inverse(current.credits.length)}${current.credits.length > previous.credits.length ? ` (+${current.credits.length - previous.credits.length})` : ''} movie credits !`,
      ),
      (err) => log('🚨', err),
      () => {
        log('')
        resolve()
      },
    )
  )
}

module.exports = stalk
