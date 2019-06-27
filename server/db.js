const PouchDB = require('pouchdb')
const path = require('path')

const db = require('express-pouchdb')(PouchDB.defaults({ prefix: 'db/' }), {
  configPath: path.join(__dirname, '..', 'pouchdb.json'),
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
