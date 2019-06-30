const PouchDB = require('pouchdb')
const path = require('path')

const folder = path.join(__dirname, '..', 'config', '.db')

try {
  fs.accessSync(folder, fs.constants.W_OK)
} catch (err) {
  fs.mkdirSync(folder, { recursive: true })
}

const db = require('express-pouchdb')(PouchDB.defaults({ prefix: path.join(folder, path.sep) }), {
  configPath: path.join(folder, '.pouchdb.json'),
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
