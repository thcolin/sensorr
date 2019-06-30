const Config = require('@server/store/config')
const loggers = require('@server/utils/loggers')
const log = loggers.default

function configure(req, res) {
  const payload = req.body.config || {}

  Config.replace(payload).subscribe(
    (file) => {
      log('configure', { file })
      res.status(200).send({ file })
    },
    (err) => {
      log('configure', { err }, { err: true })
      res.status(520).send({ reason: err.toString(), })
    },
  )
}

module.exports = configure
