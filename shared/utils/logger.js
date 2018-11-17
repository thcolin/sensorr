const fs = require('fs')
const path = require('path')
const logger = require('@studio/log')
const StringifyTransform = require('@studio/ndjson/stringify')

const file = fs.createWriteStream(path.join(__dirname, '..', '..', 'history.log'))
logger.pipe(new StringifyTransform()).pipe(file)

module.exports = logger('sensorr')
