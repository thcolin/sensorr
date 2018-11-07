import Database from 'shared/Database'
import sensorr from 'store/sensorr'

const database = new Database({
  sync: sensorr.config.db,
})

export default database
