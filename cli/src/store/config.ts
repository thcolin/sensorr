import config from '@sensorr/config'

const local = require('./../../../config/local.json')
config.load(local)

export default config
