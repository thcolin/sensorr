const RxDB = require('rxdb')

RxDB.plugin(require('pouchdb-adapter-idb'))
RxDB.plugin(require('pouchdb-adapter-http'))

const SCHEMAS = {
  sessions: {
    title: 'session',
    version: 0,
    description: 'List Sensorr sessions',
    type: 'object',
    required: ['uuid', 'time'],
    attachments: {},
    properties: {
      uuid: {
        type: 'string',
        primary: true,
      },
      time: {
        type: 'number',
        index: true,
      },
    },
  },
  records: {
    title: 'record',
    version: 0,
    description: 'Describe a Sensorr record entry',
    type: 'object',
    required: ['uuid', 'session', 'time', 'message'],
    attachments: {},
    properties: {
      uuid: {
        type: 'string',
        primary: true,
      },
      record: {
        type: 'string',
        index: true,
      },
      session: {
        type: 'string',
        index: true,
      },
      data: {
        type: 'object',
        default: {},
      },
      success: {
        type: 'boolean',
        default: false,
      },
      time: {
        type: 'number',
        index: true,
      },
      message: {
        type: 'string',
      },
    },
  },
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
          ...new Set([doc.title, doc.original_title].map(title => title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\sa-zA-Z0-9]/g, ' ')
            .replace(/ +/g, ' ')
          )
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

  async bootstrap() {
    const { sync, ...options } = this.options

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

  get() {
    if (!this.instance) {
      this.instance = this.bootstrap()
    }

    return this.instance
  }
}

Database.SCHEMAS = SCHEMAS

module.exports = Database
