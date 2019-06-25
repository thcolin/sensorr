const { from, of } = require('rxjs')
const { map, mapTo, tap, filter, mergeMap, delay } = require('rxjs/operators')
const Documents = require('@shared/Documents')
const TMDB = require('@shared/services/TMDB')
const Plex = require('@shared/services/Plex')
const chalk = require('chalk')

async function sync({ log, sensorr, db }) {
  log('')

  return await new Promise(resolve => {
    if (sensorr.config.plex && sensorr.config.plex.token) {
      const plex = new Plex(sensorr.config.plex)
      const tmdb = new TMDB({ key: sensorr.config.tmdb, region: sensorr.config.region })

      log(`📺 `, `Looking for owned movies on ${chalk.inverse(plex.url)} Plex server ...`)

      from(plex.client.query('/library/sections')).pipe(
        mergeMap(payload => from(payload.MediaContainer.Directory.filter((directory) => directory.type === 'movie'))),
        mergeMap(section => plex.client.query(`/library/sections/${section.key}/all`)),
        tap(payload => log('🎞️ ', `Found ${chalk.bold(payload.MediaContainer.Metadata.length)} movies available on Plex server`)),
        mergeMap(payload => from(payload.MediaContainer.Metadata)),
        mergeMap(payload => from(plex.client.query(payload.key)).pipe(
          map(payload => payload.MediaContainer.Metadata.pop().guid),
          map(guid => guid.split('://').reduce(
            (acc, curr, index, arr) => ['com.plexapp.agents.imdb', 'com.plexapp.agents.themoviedb'].includes(arr[0]) ?
            { agent: arr[0], id: arr[1].split('?').shift() } :
            null
          )),
          filter(guid => guid),
          tap(guid => log('🔗 ', `Handle ${chalk.bold(JSON.stringify(guid))} guid from Plex server`)),
          mergeMap(guid => of(guid).pipe(
            mergeMap(guid => db.movies.find({ selector: { [{ 'com.plexapp.agents.imdb': 'imdb_id', 'com.plexapp.agents.themoviedb': 'id' }[guid.agent]]: { $eq: guid.id } } })),
            map(result => result.docs.length ? result.docs[0] : null),
            mergeMap(doc => doc ?
              of(doc).pipe(
                tap(movie => movie.state === 'archived' && log('📼', `Sensorr movie ${chalk.inverse(movie.title)} already ${chalk.gray('archived')}`)),
                filter(movie => movie.state !== 'archived'),
                map(movie => ({ ...movie, time: Date.now(), state: 'archived' })),
                mergeMap(movie => from(db.movies.put({ ...doc, ...movie })).pipe(mapTo(movie))),
              ) :
              of(guid).pipe(
                tap(guid => log('📭', `Missing ${chalk.inverse({ 'com.plexapp.agents.imdb': 'IMDB', 'com.plexapp.agents.themoviedb': 'TMDB' }[guid.agent])} movie ${chalk.gray(guid.id)}`)),
                mergeMap(guid => ({
                  'com.plexapp.agents.themoviedb': of(guid.id),
                  'com.plexapp.agents.imdb': from(tmdb.fetch(['find', guid.id], { external_source: 'imdb_id' })).pipe(map(payload => payload.movie_results.pop().id)),
                }[guid.agent])),
                mergeMap(id => tmdb.fetch(['movie', id], { append_to_response: 'alternative_titles,release_dates' })),
                map(entity => new Documents.Movie({ ...entity, state: 'archived' }, sensorr.config.region).normalize()),
                mergeMap(movie => from(db.movies.put({ _id: movie.id, ...movie })).pipe(mapTo(movie))),
              )
            ),
          )),
          delay(2000),
        ), null, 1),
      ).subscribe(
        (movie) => log('📼', `Sensorr movie ${chalk.inverse(movie.title)} is available on Plex server, will now be ${chalk.gray('archived')}`),
        (err) => {
          log('🚨', err)
          resolve()
        },
        () => {
          log('')
          resolve()
        },
      )
    } else {
      log('🚨', 'Missing token, are you sure Plex server is connected with your Sensorr instance ?')
      log('')
      resolve()
    }
  })
}

module.exports = sync
