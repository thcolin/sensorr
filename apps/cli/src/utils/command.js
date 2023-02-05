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

  logger.info({ message: meta.desc, metadata: { job, command: meta.command, config: config.get(`jobs.${meta.command}`), summary: true } })

  await callback({ argv, config, logger })
}
