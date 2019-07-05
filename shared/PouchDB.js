const PouchDB = require('pouchdb')
const fs = require('fs')
const path = require('path')
const { paths } = require('./utils/constants')

try {
  fs.accessSync(paths.db, fs.constants.W_OK)
} catch (err) {
  fs.mkdirSync(paths.db, { recursive: true })
}

module.exports = PouchDB.defaults({ prefix: path.join(paths.db, path.sep) })
