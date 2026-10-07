import { serialize, deserialize } from 'v8'
import { Model } from './model'
import { Store } from './store'

// Every browser has it, jsdom does not
globalThis.structuredClone ??= (value) => deserialize(serialize(value))

const seed = (collections = {}) => ({ version: '1', collections, files: {} })

const moviesOf = (store: Store) => new Model(store, 'movies', {
  _id: { type: Number },
  release_date: { type: Date },
  archived_at: { type: Date },
  refine: { type: Boolean, default: true },
})

describe('Model', () => {
  beforeEach(() => localStorage.clear())

  it('casts a filter to the schema, as mongoose does', async () => {
    const movies = moviesOf(new Store(seed({ movies: [{ _id: 603, title: 'The Matrix' }] })))
    expect(await movies.findById('603').lean()).toEqual({ _id: 603, title: 'The Matrix' })
    expect(await movies.find({ _id: { $in: ['603', '604'] } }).lean()).toHaveLength(1)
  })

  it('wraps an update without operator in $set and casts its values', async () => {
    const movies = moviesOf(new Store(seed({ movies: [{ _id: 603 }] })))
    await movies.updateOne({ _id: 603 }, { archived_at: 1700000000000, title: 'The Matrix' })
    expect(await movies.findById(603).lean()).toEqual({ _id: 603, archived_at: new Date(1700000000000), title: 'The Matrix' })
  })

  it('upserts from the equalities of the filter, with the defaults of the schema', async () => {
    const movies = moviesOf(new Store(seed()))
    const result = await movies.bulkWrite([{ updateOne: { filter: { _id: 603 }, update: { _id: '603', state: 'wished' }, upsert: true } }])
    expect(result).toMatchObject({ upsertedCount: 1, modifiedCount: 0 })
    expect(await movies.findById(603).lean()).toEqual({ _id: 603, refine: true, state: 'wished' })
  })

  it('updates the array element its filter matched, and counts only what changed', async () => {
    const movies = moviesOf(new Store(seed({ movies: [{ _id: 603, releases: [{ id: 'a', proposal: true }, { id: 'b', proposal: true }] }] })))
    const filter = { _id: 603, releases: { $elemMatch: { id: 'b', proposal: true } } }
    expect(await movies.updateOne(filter, { $set: { 'releases.$.proposal': false } })).toMatchObject({ modifiedCount: 1 })
    expect(await movies.updateOne(filter, { $set: { 'releases.$.proposal': false } })).toMatchObject({ matchedCount: 0, modifiedCount: 0 })
    expect((await movies.findById(603).lean()).releases).toEqual([{ id: 'a', proposal: true }, { id: 'b', proposal: false }])
  })

  it('paginates with the labels the services ask for', async () => {
    const movies = moviesOf(new Store(seed({ movies: [3, 1, 2].map((_id) => ({ _id })) })))
    const page = await movies.paginate({}, { page: '2', limit: 2, sort: { _id: 'asc' }, customLabels: { totalDocs: 'total_results', totalPages: 'total_pages', docs: 'results' } })
    expect(page).toMatchObject({ results: [{ _id: 3 }], total_results: 3, total_pages: 2, page: 2, hasNextPage: false })
  })

  it('sends a change after a write, as a change stream would', async () => {
    const movies = moviesOf(new Store(seed({ movies: [{ _id: 603 }] })))
    const changes = []
    movies.watch().on('change', (change) => changes.push(change))
    await movies.updateOne({ _id: 603 }, { title: 'The Matrix' })
    await new Promise((resolve) => setTimeout(resolve))
    expect(changes).toEqual([{ operationType: 'update', ns: { db: 'sensorr', coll: 'movies' }, documentKey: { _id: 603 } }])
  })
})

describe('Store', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.useFakeTimers()
  })

  afterEach(() => jest.useRealTimers())

  it('keeps what the visitor changed, dates included, until the seed changes', () => {
    const store = new Store(seed({ movies: [{ _id: 603 }] }))
    store.collection('movies')[0].archived_at = new Date(1700000000000)
    store.save('movies')
    jest.runAllTimers()

    expect(new Store(seed()).collection('movies')).toEqual([{ _id: 603, archived_at: new Date(1700000000000) }])
    expect(new Store({ ...seed({ movies: [] }), version: '2' }).collection('movies')).toEqual([])
  })
})
