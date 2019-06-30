const PouchDB = require('pouchdb')
const path = require('path')

const db = require('express-pouchdb')(PouchDB.defaults({ prefix: path.join(__dirname, '..', 'config', '.db', path.sep) }), {
  configPath: path.join(__dirname, '..', 'config', '.db', '.pouchdb.json'),
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
