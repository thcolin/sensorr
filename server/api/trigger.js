const pm2 = require('@server/store/pm2')
const ecosystem = require('@root/ecosystem.config')
const loggers = require('@server/utils/loggers')
const log = loggers.default

function trigger(req, res) {
  const type = `sensorr:${req.body.type}`

  pm2.list((err, jobs) => {
    if (!err) {
      const job = (
        jobs.filter(job => job.name !== 'sensorr:web' && job.name === type).pop() ||
        ecosystem.apps.filter(job => job.name !== 'sensorr:web' && job.name === type).pop()
      )

      if (job && job.pid) {
        log('trigger', { event: 'already-triggered', job: type }, { color: 'yellow' })
        res.status(409).send({ message: 'Job already triggered', err, })
      } else {
        pm2.restart(job.name, err => {
          if (!err) {
            log('trigger', { event: 'success', job: type })
            res.status(200).send({ message: `Trigger "${type}" job`, })
          } else {
            log('trigger', { event: 'error', job: type, err }, { err: true })
            res.status(409).send({ message: `Error during "${type}" job pm2 restart`, err, })
          }
        })
      }
    } else {
      log('trigger', { event: 'error', job: type, err }, { err: true })
      res.status(400).send({ message: `Error on pm2 process list`, })
    }
  })
}

module.exports = trigger
