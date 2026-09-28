import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { nanoid } from '@sensorr/sensorr'
import { formatDuration, intervalToDuration } from 'date-fns'
import chalk from 'chalk'
import nodeFetch from 'node-fetch'

import logger from './store/logger'
import { typed } from './utils/command'
import record from './commands/record'
import recordShows from './commands/record-shows'
import airing from './commands/airing'
import refresh from './commands/refresh'
import refreshShows from './commands/refresh-shows'
import sync from './commands/sync'
import syncShows from './commands/sync-shows'
import importShows from './commands/import-shows'
import refine from './commands/refine'
import shrink from './commands/shrink'
import report from './commands/report'
import keepInTouch from './commands/keep-in-touch'
import wrapped from './commands/wrapped'
import migrate from './commands/migrate'
import migrateSonarr from './commands/migrate-sonarr'

globalThis.fetch = nodeFetch

// Disable React "Warning: Can't perform a React state update on an unmounted component."
// See [Remove the warning for setState on unmounted components #22114](https://github.com/facebook/react/pull/22114)
const error = console.error
console.error = (...args) => args[0].includes("Warning: Can't perform a React state update on an unmounted component") ? null : error(...args)

const exit = (message, cb) => {
  console.log(message)
  cb()
}

const main = async () => {
  const job = nanoid()

  if (!process.stdin.isTTY) {
    console.log(JSON.stringify({ job }))
  }

  console.log('')
  console.log('      _________  __________  ___  ___')
  console.log('     / __/ __/ |/ / __/ __ \\/ _ \\/ _ \\')
  console.log('    _\\ \\/ _//    /\\ \\/ /_/ / , _/ , _/')
  console.log('   /___/___/_/|_/___/\\____/_/|_/_/|_|')
  console.log(' ')
  console.log(`🍿 📼 ${chalk.bold('Your Friendly Digital Video Recorder')}`)
  console.log('')

  const parser = { current: null }
  const start = (new Date()).getTime()

  const handlers = {
    success: () => {
      const duration = formatDuration(intervalToDuration({ start: new Date(start), end: new Date() }), { format: ['hours', 'minutes', 'seconds'] }).replace(/ hours?/, 'h').replace(/ minutes?/, 'm').replace(/ seconds?/, 's')
      logger.on('finish', () => exit(`\n${chalk.bold('⏲️  Completed')} ${chalk.gray(duration || '0s')}`, () => parser.current.exit(0)))
      logger.info({ message: `⏲️ Completed - ${duration}`, metadata: { job, summary: true, done: true } })
      logger.end()
    },
    error: (error) => {
      logger.on('finish', () => exit(`⚠️  ${error?.message || error}`, () => parser.current.exit(1)))
      logger.error({ message: `⚠️ ${error?.message || error}`, metadata: { job, summary: true, done: true, error } })
      logger.end()
    },
  }

  const instance = yargs(hideBin(process.argv))
  parser.current = instance
    .wrap(instance.terminalWidth())
    .command(typed('record', '📹 Record wished movies, or wished shows episodes, with best releases available', [record(job, handlers), recordShows(job, handlers)]))
    .command(typed('airing', '📡 Record wished episodes aired in the last 7 days', [airing(job, handlers)]))
    .command(typed('refresh', '🔌 Refresh Sensorr movies and persons, or shows and their episodes, with TMDB latest changes', [refresh(job, handlers), refreshShows(job, handlers)]))
    .command(typed('sync', '🔗 Sync Sensorr movies, or shows, with registered Plex server', [sync(job, handlers), syncShows(job, handlers)]))
    .command(typed('import', '📥 Import finished show releases from the staging folder into the library', [importShows(job, handlers)]))
    .command(typed('refine', '✨ Refine archived movies with better fitting release', [refine(job, handlers)]))
    .command(typed('shrink', '✂️ Shrink refined movies with smallest release available', [shrink(job, handlers)]))
    .command(typed('report', '🚩 Replace archived movies reported from Plex with their best release', [report(job, handlers)]))
    .command(keepInTouch(job, handlers))
    .command(wrapped(job, handlers))
    .command({ ...migrate(job, handlers), builder: (yargs) => yargs.command(migrateSonarr(job, handlers)) })
    .scriptName('sensorr')
    .locale('en')
    .detectLocale(false)
    .strictCommands()
    .fail(false)

  try {
    process.on('SIGTERM', () => handlers.success())

    const argv = await parser.current.parse()

    if (argv._.length == 0){
      parser.current.showHelp()
      parser.current.exit()
      return
    }
  } catch (error) {
    handlers.error(error)
  }
}

main()
