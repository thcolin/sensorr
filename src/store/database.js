import Database from 'shared/Database'
import sensorr from 'store/sensorr'

const database = new Database({
  sync: `${location.protocol}//${sensorr.config.auth.username}:${sensorr.config.auth.password}@${location.host}/db`,
})

global.database = database

export default database
