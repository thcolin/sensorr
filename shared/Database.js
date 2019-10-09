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
    version: 4,
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
      genres: {
        type: 'array',
      },
      year: {
        type: 'number',
      },
      release_date: {
        type: 'number',
      },
      poster_path: {
        type: 'string',
      },
      runtime: {
        type: 'number',
      },
      popularity: {
        type: 'number',
      },
      vote_average: {
        type: 'number',
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
    version: 2,
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
      gender: {
        type: 'number',
      },
      known_for_department: {
        type: 'string',
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
  },
  calendar: {
    title: 'publication',
    version: 0,
    description: 'Describe a TMDB movie publication',
    type: 'object',
    required: ['id', 'release_date', 'title', 'poster_path'],
    attachments: {},
    properties: {
      id: {
        type: 'string',
        primary: true,
      },
      release_date: {
        type: 'string',
        index: true,
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
      genres: {
        type: 'array',
      },
      poster_path: {
        type: 'string',
      },
      runtime: {
        type: 'number',
      },
      popularity: {
        type: 'number',
      },
      vote_average: {
        type: 'number',
      },
      credits: {
        type: 'array',
      }
    },
  },
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
    3: (doc) => {
      doc.runtime = 0
      doc.release_date = 0
      doc.popularity = 0
      doc.vote_average = 0
      return doc
    },
    4: (doc) => {
      doc.genres = []
      return doc
    },
  },
  stars: {
    1: (doc) => {
      doc.gender = 0
      return doc
    },
    2: (doc) => {
      doc.known_for_department = ''
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
    const { sync, ...options } = this.options

    switch (version) {
      case _POUCHDB:
        return Object.keys(Database.SCHEMAS).reduce((db, key) => ({
          ...db,
          [key]: new PouchDB({ ...options, name: `${options.name || ''}sensorr-${key}` }),
        }), {})
      case _RXDB:
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
