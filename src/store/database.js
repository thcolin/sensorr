import RxDB from 'rxdb'

RxDB.plugin(require('pouchdb-adapter-idb'))

const DATABASE = {
  name: 'senswatcher',
  adapter: 'idb',
  multiInstance: false
}

const SCHEMAS = {
  movies: {
    title: 'movie',
    version: 0,
    description: 'Describe a TMDB movie',
    type: 'object',
    required: ['id', 'title', 'poster_path'],
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
      poster_path: {
        type: 'string',
      }
    }
  }
}

const bootstrap = async () => {
  const database = await RxDB.create(DATABASE)
  await Promise.all(Object.keys(SCHEMAS).map(name => database.collection({ name, schema: SCHEMAS[name] })))
  // Object.keys(SCHEMAS).map(name => database[name].sync({ remote: `http://localhost:5984/${name}/` }))
  return database
}

let instance = null

export default {
  get: () => {
    if (!instance) {
      instance = bootstrap()
    }

    return instance
  }
}
