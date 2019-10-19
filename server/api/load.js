const unzipper = require('unzipper')
const path = require('path')
const PouchDB = require('@shared/PouchDB')
const { SCHEMAS } = require('@shared/Database')
const loggers = require('@server/utils/loggers')
const log = loggers.default

function load(req, res) {
  if (!req.busboy) {
    res.status(500).send({ reason: 'Error during load process.' })
    return
  }

  req.busboy.on('file', (fieldname, file, filename) => file
    .pipe(unzipper.Parse())
    .on('entry', (entry) => {
      const key = path.basename(entry.props.path, '.txt')

      if (Object.keys(SCHEMAS).includes(key)) {
        const db = new PouchDB(`sensorr-${key}`)
        return db.load(entry)
      }

      return entry.autodrain()
    })
    .promise()
    .then(() => {
      res.status(200).send({ ok: true })
    })
    .catch(err => {
      log('load', { err }, { err: true })
      res.status(500).send({ reason: 'Error during load process.' })
    })
  )

  req.pipe(req.busboy)
}

module.exports = load
