import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { nanoid } from '@sensorr/sensorr'
import { formatDuration, intervalToDuration } from 'date-fns'
import chalk from 'chalk'

import logger from './store/logger'
import record from './commands/record'
import refresh from './commands/refresh'
import sync from './commands/sync'
import doctor from './commands/doctor'
import keepInTouch from './commands/keep-in-touch'
import migrate from './commands/migrate'

globalThis.fetch = require('node-fetch')

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

  parser.current = yargs(hideBin(process.argv))
    .command(record(job, handlers))
    .command(refresh(job, handlers))
    .command(sync(job, handlers))
    .command(doctor(job, handlers))
    .command(keepInTouch(job, handlers))
    .command(migrate(job, handlers))
    .scriptName('sensorr')
    .locale('en')
    .detectLocale(false)
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
