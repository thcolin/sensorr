const fs = require('fs')
const path = require('path')
const { bindNodeCallback } = require('rxjs')
const { concatAll, map, filter, mergeMap, reduce, pluck, tap } = require('rxjs/operators')
const { paths } = require('@shared/utils/constants')
const chalk = require('chalk')

async function clean({ log, sensorr }) {
  log('')

  return await new Promise(resolve => bindNodeCallback(fs.readdir)(paths.sessions)
    .pipe(
      concatAll(),
      map(file => ({
        file,
        job: file.split('-').pop().split('.').shift(),
        uuid: file.split('-').slice(0, -1).join('-'),
      })),
      filter(session => session.job && session.uuid),
      mergeMap(session => bindNodeCallback(fs.stat)(path.join(paths.sessions, session.file)).pipe(
        map(stats => ({ ...session, time: stats.birthtime, size: stats.size })),
      )),
      reduce((acc, curr) => [...acc, curr], []),
      map(sessions => sessions
        .sort((a, b) => b.time - a.time)
        .reduce((obj, session) => ({
          total: obj.total + session.size,
          sessions: [ ...obj.sessions, ...(!session.size || (obj.total + session.size) >= sensorr.config.logs.limit ? [session] : []) ]
        }), { total: 0, sessions: [] })
      ),
      pluck('sessions'),
      tap(sessions => sessions.length || log('👏', `Congratulations, your sessions directory is clean !`)),
      concatAll(),
      mergeMap(session => bindNodeCallback(fs.unlink)(path.join(paths.sessions, session.file)).pipe(
        map(() => session),
      )),
    )
    .subscribe(
      (session) => log('🗑️ ', `Clean ${chalk.inverse(session.file)} ${chalk.gray(new Date(session.time).toLocaleString())}`),
      (err) => log('🚨', err),
      () => {
        log('')
        resolve()
      },
    )
  )
}

module.exports = clean
