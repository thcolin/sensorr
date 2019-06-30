const PouchDB = require('pouchdb')
const fs = require('fs')
const path = require('path')
const { paths } = require('@server/utils/constants')

try {
  fs.accessSync(paths.db, fs.constants.W_OK)
} catch (err) {
  fs.mkdirSync(paths.db, { recursive: true })
}

const db = require('express-pouchdb')(PouchDB.defaults({ prefix: path.join(paths.db, path.sep) }), {
  configPath: path.join(paths.db, '.pouchdb.json'),
  mode: 'fullCouchDB',
  overrideMode: {
    exclude: [
      'routes/authentication',
      'routes/authorization',
      'routes/session',
    ],
  },
})

module.exports = db
