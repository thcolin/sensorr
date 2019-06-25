const pm2 = require('pm2')
const loggers = require('@server/utils/loggers')
const log = loggers.default

pm2.connect(function(err) {
  if (!err) {
    log('pm2', { event: 'connected' })
  } else {
    log('pm2', { event: 'error', err }, { err: true })
    exit(2)
  }
})

module.exports = pm2
