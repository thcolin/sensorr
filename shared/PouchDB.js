const PouchDB = require('pouchdb')
const replicationStream = require('pouchdb-replication-stream')
const fs = require('fs')
const path = require('path')
const { paths } = require('./utils/constants')

try {
  fs.accessSync(paths.db, fs.constants.W_OK)
} catch (err) {
  fs.mkdirSync(paths.db, { recursive: true })
}

PouchDB.plugin(replicationStream.plugin)
PouchDB.adapter('writableStream', replicationStream.adapters.writableStream)

module.exports = PouchDB.defaults({ prefix: path.join(paths.db, path.sep) })
