import config from '@sensorr/config'
import api from '../store/api'
import logger from '../store/logger'

export default (job, meta, callback) => async (argv) => {
  console.log(meta.desc)
  console.log('')

  await api.login(process.env.NX_SENSORR_USERNAME, process.env.NX_SENSORR_PASSWORD)

  const { uri, params, init } = api.query.config.getConfig({})
  const raw = await api.fetch(uri, params, init)
  config.load(raw)

  const key = ['jobs', meta.command, meta.type && `${meta.type}s`].filter(Boolean).join('.')
  logger.info({ message: meta.desc, metadata: { job, command: meta.command, ...(meta.type ? { type: meta.type } : {}), config: config.has(key) ? config.get(key) : null, summary: true } })

  await callback({ argv, config, logger })
}

// One command per job about one media type, `record movies`, the type refused when no implementation handles it
export const typed = (command, desc, definitions) => {
  const types = definitions.reduce((acc, definition) => ({ ...acc, [`${definition.type}s`]: definition }), {})

  return {
    command: `${command} <type>`,
    desc,
    builder: (yargs) => yargs.positional('type', { describe: 'Media type the job works on', choices: Object.keys(types) }),
    handler: (argv) => types[argv.type].handler(argv),
  }
}
