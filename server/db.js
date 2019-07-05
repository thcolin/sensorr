const PouchDB = require('@shared/PouchDB')
const path = require('path')
const { paths } = require('@shared/utils/constants')

const db = require('express-pouchdb')(PouchDB, {
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
