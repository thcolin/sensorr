import Database from 'shared/Database'
import config from 'store/config'

const database = new Database({
  sync: config.db,
})

export default database
