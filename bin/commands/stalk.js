const { of, from, EMPTY } = require('rxjs')
const { map, mapTo, tap, mergeMap, delay, pluck, catchError } = require('rxjs/operators')
const { Star, Movie } = require('@shared/Documents')
const TMDB = require('@shared/services/TMDB')
const chalk = require('chalk')

const count = {
  stars: 0,
  credits: 0,
}

async function stalk({ log, sensorr, db }) {
  const tmdb = new TMDB({ key: sensorr.config.tmdb, region: sensorr.config.region })

  const limits = [
    new Date(),
    new Date(),
  ]

  limits[0].setFullYear(limits[0].getFullYear() - 8)
  limits[1].setFullYear(limits[1].getFullYear() + 8)

  log('🗃 ', `Loading calendar cache...`)
  const result = await db.calendar.find({
    selector: {
      release_date: {
        $lt: new Date(Date.now() - (90 * 24 * 60 * 60 * 1000)).toISOString()
      }
    }
  })
  const docs = result.docs.map(doc => doc.id)
  log('🗃 ', `Found ${chalk.inverse(docs.length)} publications !`)
  log('')

  return await new Promise(resolve =>
    from(db.stars.allDocs({ include_docs: true })).pipe(
      pluck('rows'),
      map(entities => entities.map(entity => ({ id: entity.id, ...entity.doc })).sort((a, b) => b.time - a.time)),
      tap(stars => stars.filter(star => star.state === 'stalked').length ? '' : log('👀', `Sorry, you're not stalking anyone.`)),
      mergeMap(stars => from(stars.filter(star => star.state === 'stalked')).pipe(
        mergeMap(star => of(star).pipe(
          tap(() => log('')),
          tap(star => log('👀', `Stalking ${chalk.inverse(star.name)}... (${++count.stars}/${stars.length})`)),
          mergeMap(star => from(tmdb.fetch(['person', star.id], { append_to_response: 'images,movie_credits' }))),
          catchError((err) => {
            log('🚨', { star, err })
            return EMPTY
          }),
          map(entity => new Star(entity).normalize()),
          map(star => star.credits
            .filter(credit => credit.release_date && (
              new Date(credit.release_date) >= limits[0] &&
              new Date(credit.release_date) <= limits[1]
            ))
            .reduce((credits, credit) => [
              ...credits,
              ...((
                !credits.map(c => c.id).includes(credit.id) &&
                (!!credit.character || ['Director', 'Writer'].includes(credit.job))
              ) ? [credit] : []),
            ], [])
          ),
          tap(() => count.credits = 0),
          mergeMap(credits => from(credits).pipe(
            mergeMap((credit) => of(credit).pipe(
              mergeMap(credit => {
                if (docs.includes(credit.id.toString())) {
                  log('🗃 ', `Publication already cached for ${chalk.gray(credit.title)} (${++count.credits}/${credits.length})`)
                  return EMPTY
                } else {
                  docs.push(credit.id)
                  log('🗼', `Fetching first publication for ${chalk.gray(credit.title)} (${++count.credits}/${credits.length})`)
                  return of(credit)
                }
              }),
              mergeMap(credit => from(tmdb.fetch(['movie', credit.id], { append_to_response: 'credits,release_dates' })).pipe(
                delay(2000)
              ), null, 1),
              catchError((err) => {
                log('🚨', { credit, err })
                return EMPTY
              }),
              mergeMap(entity => {
                const result = [...entity.release_dates.results].sort((a, b) => (
                  ['GB', 'US', sensorr.config.region.split('-')[1]].indexOf(a.iso_3166_1) -
                  ['GB', 'US', sensorr.config.region.split('-')[1]].indexOf(b.iso_3166_1)
                )).pop()

                if (!result) {
                  log('🚫', `No theatrical, digital or physical publication available for ${chalk.gray(credit.title)}`)
                  return EMPTY
                }

                const release_date = (result.release_dates
                  .filter(release_date => release_date.type <= 5)
                  .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
                  .pop() || {}
                ).release_date

                if (!release_date) {
                  log('🚫', `No publication available for ${chalk.gray(credit.title)}`)
                  return EMPTY
                }

                return of(release_date).pipe(
                  tap(release_date => log('📰', `Found: ${chalk.inverse(new Date(release_date).toLocaleDateString())}`)),
                  map(release_date => {
                    const { terms, state, ...movie } = new Movie(entity).normalize()

                    return {
                      ...movie,
                      release_date: new Date(release_date).toISOString(),
                      credits: [...entity.credits.crew, ...entity.credits.cast],
                    }
                  }),
                  mergeMap(publication => from(db.calendar.upsert(publication.id, (doc) => ({ ...doc, ...publication }))).pipe(
                    mapTo(publication)
                  )),
                )
              }),
            ), null, 1),
          )),
        ), null, 1)
      )),
    ).subscribe(
      (publication) => {
        // log({ publication })
      },
      (err) => log('🚨', err),
      () => {
        log('')
        resolve()
      },
    )
  )
}

module.exports = stalk
