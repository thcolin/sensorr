const archiver = require('archiver')
const { PassThrough } = require('stream')
const PouchDB = require('@shared/PouchDB')
const { SCHEMAS } = require('@shared/Database')
const loggers = require('@server/utils/loggers')
const log = loggers.default

function dump(req, res) {
  const archive = archiver('zip', { zlib: { level: 9 } })
  archive.on('error', (err) => {
    log('dump', { err }, { err: true })
    res.status(500).send({ reason: 'Error during dump process.' })
  })

  Object.keys(SCHEMAS).map((key) => {
    const passthrough = new PassThrough()
    const db = new PouchDB(`sensorr-${key}`)

    archive.append(passthrough, { name: `${key}.txt` })
    db.dump(passthrough)
  })

  res.attachment(`sensorr-dump-${[
    new Date().getFullYear().toString().padStart(2, 0),
    (new Date().getMonth() + 1).toString().padStart(2, 0),
    new Date().getDate().toString().padStart(2, 0),
  ].join('-')}.zip`)
  archive.pipe(res)
  archive.finalize()
}

module.exports = dump
