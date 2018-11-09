const RxDB = require('rxdb')

RxDB.plugin(require('pouchdb-adapter-idb'))
RxDB.plugin(require('pouchdb-adapter-http'))

const SCHEMAS = {
  movies: {
    title: 'movie',
    version: 1,
    description: 'Describe a TMDB movie',
    type: 'object',
    required: ['id', 'title', 'year', 'poster_path'],
    attachments: {},
    properties: {
      id: {
        type: 'string',
        primary: true
      },
      state: {
        type: 'string',
        default: 'wished',
      },
      imdb_id: {
        type: 'string'
      },
      title: {
        type: 'string'
      },
      original_title: {
        type: 'string'
      },
      year: {
        type: 'number'
      },
      poster_path: {
        type: 'string',
      },
      time: {
        type: 'number',
      },
    },
  },
}

const MIGRATIONS = {
  movies: {
    1: (doc) => {
      doc.time = Date.now()
      return doc
    },
  },
}

class Database {
  constructor(options = {}) {
    this.instance = null
    this.options = options
  }

  async bootstrap() {
    const { sync, ...options } = this.options

    const database = await RxDB.create({
      name: 'sensorr',
      adapter: 'idb',
      ...options,
    })

    await Promise.all(Object.keys(SCHEMAS).map(key => database
      .collection({ name: key, schema: SCHEMAS[key], migrationStrategies: MIGRATIONS[key] })
      .then(collection => sync ? collection.sync({ remote: `${sync}/sensorr` }) : null)
    ))

    return database
  }

  get() {
    if (!this.instance) {
      this.instance = this.bootstrap()
    }

    return this.instance
  }
}

module.exports = Database
