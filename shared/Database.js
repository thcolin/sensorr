const RxDB = require('rxdb')
const PouchDB = require('pouchdb')
const { clean } = require('./utils/string')

const _POUCHDB = 'pouchdb'
const _RXDB = 'rxdb'

RxDB.plugin(require('pouchdb-adapter-idb'))
RxDB.plugin(require('pouchdb-adapter-http'))

const SCHEMAS = {
  movies: {
    title: 'movie',
    version: 2,
    description: 'Describe a TMDB movie',
    type: 'object',
    required: ['id', 'title', 'year', 'poster_path'],
    attachments: {},
    properties: {
      id: {
        type: 'string',
        primary: true,
      },
      state: {
        type: 'string',
        default: 'wished',
      },
      imdb_id: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
      original_title: {
        type: 'string',
      },
      year: {
        type: 'number',
      },
      poster_path: {
        type: 'string',
      },
      time: {
        type: 'number',
      },
      terms: {
        type: 'object',
        properties: {
          titles: {
            type: 'array',
            uniqueItems: true,
          },
          years: {
            type: 'array',
            uniqueItems: true,
          },
        },
      },
    },
  },
  stars: {
    title: 'star',
    version: 0,
    description: 'Describe a TMDB star',
    type: 'object',
    required: ['id', 'state', 'name'],
    attachments: {},
    properties: {
      id: {
        type: 'string',
        primary: true,
      },
      state: {
        type: 'string',
        default: 'stalked',
      },
      imdb_id: {
        type: 'string',
      },
      name: {
        type: 'string',
      },
      also_known_as: {
        type: 'array',
      },
      birthday: {
        type: 'string'
      },
      popularity: {
        type: 'number'
      },
      profile_path: {
        type: 'string',
      },
      time: {
        type: 'number',
      },
      credits: {
        type: 'array',
      }
    },
  }
}

const MIGRATIONS = {
  movies: {
    1: (doc) => {
      doc.time = Date.now()
      return doc
    },
    2: (doc) => {
      doc.terms = {
        titles: [
          ...new Set([doc.title, doc.original_title].map(title => clean(title))
        )],
        years: [doc.year],
      }
      return doc
    },
  },
}

class Database {
  constructor(options = {}) {
    this.instance = null
    this.options = options
  }

  async bootstrap(version) {
    switch (version) {
      case _POUCHDB:
        return Object.keys(Database.SCHEMAS).reduce((db, key) => ({
          ...db,
          [key]: new PouchDB({ ...this.options, name: `${this.options.name}/sensorr-${key}` }),
        }), {})
      case _RXDB:
        const { sync, ...options } = this.options

        await RxDB.removeDatabase('sessions', 'idb')
        await RxDB.removeDatabase('records', 'idb')

        const database = await RxDB.create({
          name: 'sensorr',
          adapter: 'idb',
          multiInstance: true,
          ...options,
        })

        await Promise.all(Object.keys(Database.SCHEMAS).map(key => database
          .collection({ name: key, schema: Database.SCHEMAS[key], migrationStrategies: MIGRATIONS[key] })
          .then(collection => typeof sync === 'string' ? collection.sync({
            remote: `${sync}/sensorr-${key}`,
            waitForLeadership: true,
            direction: { pull: true, push: true },
            options: { live: true, retry: true },
          }) : null)
        ))

        return database
    }

  }

  get(version = _RXDB) {
    if (!this.instance) {
      this.instance = this.bootstrap(version)
    }

    return this.instance
  }
}

Database._POUCHDB = _POUCHDB
Database._RXDB = _RXDB
Database.SCHEMAS = SCHEMAS

module.exports = Database
