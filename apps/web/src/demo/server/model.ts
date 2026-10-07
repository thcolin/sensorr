import { Context, update as updateObject } from 'mingo'
import { Aggregator } from 'mingo/aggregator'
import { Query as MingoQuery } from 'mingo/query'
import { evalExpr } from 'mingo/core'
import { compare } from 'mingo/util'
import * as accumulator from 'mingo/operators/accumulator'
import * as expression from 'mingo/operators/expression'
import * as pipeline from 'mingo/operators/pipeline'
import * as projection from 'mingo/operators/projection'
import * as query from 'mingo/operators/query'
import * as window from 'mingo/operators/window'
import { Store } from './store'

// The part of a mongoose model `apps/api` calls, on a collection the demo keeps in memory. Mongoose casts what it
// writes and what it filters on to the type its schema declares, and wraps an update without operator in `$set`:
// both are kept, the services read the database through them

type Properties = { [key: string]: { type?: any, default?: any } }
type Change = { operationType: 'insert' | 'update' | 'delete', ns: { db: string, coll: string }, documentKey: { _id: any }, fullDocument?: any }

// An aggregation expression compares values of different types in the BSON order, where null comes before a date:
// `{ $gt: ['$air_date', null] }` holds for any dated episode in `ShowsService.getProgress`. mingo compares them as a
// query does, and only values of the same type, so the four comparisons are its `compare`, which sorts in that order
const bson = (test: (order: number) => boolean) => (obj: any, expr: any, options: any) => {
  const [a, b] = evalExpr(obj, expr, options) as any[]
  return test(compare(a, b))
}

// mingo merges a context given to `find` or `aggregate` after its own, whose operators then win: the whole set is
// built here, for the base classes
const context = Context.init({
  accumulator,
  pipeline,
  projection,
  query,
  window,
  expression: { ...expression, $gt: bson((order) => order > 0), $gte: bson((order) => order >= 0), $lt: bson((order) => order < 0), $lte: bson((order) => order <= 0) },
} as any)

const find = (collection: any[], criteria: any, projected?: any) => new MingoQuery(criteria, { context }).find(collection, projected)
const aggregate = (collection: any[], stages: any[]) => new Aggregator(stages, { context }).run(collection)

const OPERATORS = ['$in', '$nin', '$eq', '$ne', '$gt', '$gte', '$lt', '$lte']

const objectId = () => Array.from(crypto.getRandomValues(new Uint8Array(12))).map((byte) => byte.toString(16).padStart(2, '0')).join('')

const clone = <T>(value: T): T => structuredClone(value)

const castValue = (type: any, value: any) => {
  if (value === null || value === undefined) {
    return value
  }

  switch (type) {
    case Number:
      return typeof value === 'number' ? value : (Number.isNaN(Number(value)) ? value : Number(value))
    case Date:
      return value instanceof Date ? value : (Number.isNaN(new Date(value).getTime()) ? value : new Date(value))
    case String:
      return typeof value === 'string' ? value : `${value}`
    case Boolean:
      return typeof value === 'boolean' ? value : value === 'true' || value === 1 || value === true
    default:
      return value
  }
}

// MongoDB accepts `$set: { _id }` when it does not change, as `upsertMovies` sends it, and refuses it otherwise
const withoutId = (update: any, _id: any) => {
  if (!update.$set || !('_id' in update.$set)) {
    return update
  }

  if (_id !== undefined && update.$set._id !== _id) {
    throw new Error(`Performing an update on the path '_id' would modify the immutable field '_id'`)
  }

  const { _id: unchanged, ...set } = update.$set
  return { ...update, $set: set }
}

const isOperator = (value: any) => value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) && !(value instanceof RegExp) && Object.keys(value).some((key) => key.startsWith('$'))

export class Model {
  private readonly watchers = new Set<{ match?: any, emit: (change: Change) => void }>()

  constructor(
    private readonly store: Store,
    readonly collection: string,
    private readonly properties: Properties,
  ) {}

  private get docs(): any[] {
    return this.store.collection(this.collection)
  }

  private cast(key: string, value: any) {
    const type = this.properties[key]?.type
    return Array.isArray(value) && type !== Array ? value.map((item) => castValue(type, item)) : castValue(type, value)
  }

  // The values a filter compares a top-level property to, `_id` first: `{ _id: '603' }` finds the movie 603
  castFilter(filter: any = {}): any {
    return Object.fromEntries(Object.entries(filter || {}).map(([key, value]: [string, any]) => {
      if (['$and', '$or', '$nor'].includes(key)) {
        return [key, value.map((nested) => this.castFilter(nested))]
      }

      if (!this.properties[key] || key.startsWith('$')) {
        return [key, value]
      }

      if (isOperator(value)) {
        return [key, Object.fromEntries(Object.entries(value).map(([operator, operand]) => [operator, OPERATORS.includes(operator) ? this.cast(key, operand) : operand]))]
      }

      return [key, this.cast(key, value)]
    }))
  }

  private castDocument(doc: any) {
    return Object.fromEntries(Object.entries(doc).map(([key, value]) => [key, this.properties[key] ? this.cast(key, value) : value]))
  }

  private castUpdate(update: any = {}) {
    const operators = Object.fromEntries(Object.entries(update).filter(([key]) => key.startsWith('$')))
    const fields = Object.fromEntries(Object.entries(update).filter(([key]) => !key.startsWith('$')))
    const set = { ...(operators.$set as any || {}), ...fields }

    return {
      ...operators,
      ...(Object.keys(set).length ? { $set: this.castDocument(set) } : {}),
    }
  }

  private defaults() {
    return Object.fromEntries(Object.entries(this.properties).filter(([, property]) => 'default' in property).map(([key, property]) => [key, typeof property.default === 'function' ? property.default() : property.default]))
  }

  // What an upsert creates: the equalities of the filter, then the update
  private inserted(filter: any, update: any) {
    const equalities = Object.fromEntries(Object.entries(this.castFilter(filter)).filter(([key, value]) => !key.startsWith('$') && !key.includes('.') && !isOperator(value)))
    const doc = { ...this.defaults(), ...equalities }
    updateObject(doc, withoutId(update, doc._id ?? update.$set?._id))
    return { _id: doc._id ?? update.$set?._id ?? objectId(), ...doc }
  }

  private matching(filter: any): any[] {
    return find(this.docs, this.castFilter(filter)).all()
  }

  private changed(change: Omit<Change, 'ns'>) {
    const full = { ...change, ns: { db: 'sensorr', coll: this.collection } }
    this.store.save(this.collection)
    setTimeout(() => this.watchers.forEach((watcher) => (!watcher.match || find([full], watcher.match).all().length) && watcher.emit(clone(full))))
  }

  private write(filter: any, update: any, { upsert = false, many = false } = {}) {
    const cast = this.castUpdate(update)
    const targets = many ? this.matching(filter) : this.matching(filter).slice(0, 1)
    let modifiedCount = 0

    for (const doc of targets) {
      // The positional `$` needs the condition that matched the array
      if (updateObject(doc, withoutId(cast, doc._id), undefined, this.castFilter(filter)).length) {
        modifiedCount++
        this.changed({ operationType: 'update', documentKey: { _id: doc._id } })
      }
    }

    if (!targets.length && upsert) {
      const doc = this.inserted(filter, cast)
      this.docs.push(doc)
      this.changed({ operationType: 'insert', documentKey: { _id: doc._id }, fullDocument: clone(doc) })
      return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 1, upsertedId: doc._id, docs: [doc] }
    }

    return { acknowledged: true, matchedCount: targets.length, modifiedCount, upsertedCount: 0, upsertedId: null, docs: targets }
  }

  private remove(filter: any, { many = false } = {}) {
    const targets = many ? this.matching(filter) : this.matching(filter).slice(0, 1)
    const removed = new Set(targets)
    this.store.replace(this.collection, this.docs.filter((doc) => !removed.has(doc)))
    targets.forEach((doc) => this.changed({ operationType: 'delete', documentKey: { _id: doc._id } }))
    return targets
  }

  find(filter: any = {}, projection?: any) {
    return new Query(this, filter, projection, false)
  }

  findOne(filter: any = {}, projection?: any) {
    return new Query(this, filter, projection, true)
  }

  findById(id: any, projection?: any) {
    return this.findOne({ _id: id }, projection)
  }

  exists(filter: any) {
    return new Query(this, filter, { _id: 1 }, true)
  }

  read(filter: any, projection: any, { sort, skip, limit }: { sort?: any, skip?: number, limit?: number }): any[] {
    let cursor = find(this.docs, this.castFilter(filter), normalizeProjection(projection))

    if (sort) {
      cursor = cursor.sort(normalizeSort(sort))
    }

    if (skip) {
      cursor = cursor.skip(skip)
    }

    if (limit) {
      cursor = cursor.limit(limit)
    }

    return clone(cursor.all())
  }

  count(filter: any = {}) {
    return this.matching(filter).length
  }

  updateOne(filter: any, update: any, options: any = {}) {
    const { docs, ...result } = this.write(filter, update, { upsert: !!options.upsert })
    return Promise.resolve(result)
  }

  updateMany(filter: any, update: any, options: any = {}) {
    const { docs, ...result } = this.write(filter, update, { upsert: !!options.upsert, many: true })
    return Promise.resolve(result)
  }

  findOneAndUpdate(filter: any, update: any, options: any = {}) {
    const before = this.matching(filter)[0]
    const snapshot = before && clone(before)
    const { docs } = this.write(filter, update, { upsert: !!options.upsert })
    const after = options.new || options.returnDocument === 'after'
    return new Settled(after ? (docs[0] ? clone(docs[0]) : null) : (snapshot || null))
  }

  findByIdAndUpdate(id: any, update: any, options: any = {}) {
    return this.findOneAndUpdate({ _id: id }, update, options)
  }

  findOneAndDelete(filter: any) {
    const [doc] = this.remove(filter)
    return new Settled(doc ? clone(doc) : null)
  }

  findByIdAndDelete(id: any) {
    return this.findOneAndDelete({ _id: id })
  }

  deleteMany(filter: any = {}) {
    return Promise.resolve({ acknowledged: true, deletedCount: this.remove(filter, { many: true }).length })
  }

  create(input: any) {
    const docs = (Array.isArray(input) ? input : [input]).map((doc) => ({ _id: objectId(), ...this.defaults(), ...this.castDocument(doc) }))
    docs.forEach((doc) => {
      this.docs.push(doc)
      this.changed({ operationType: 'insert', documentKey: { _id: doc._id }, fullDocument: clone(doc) })
    })
    return Promise.resolve(Array.isArray(input) ? clone(docs) : clone(docs[0]))
  }

  // The services only send `updateOne` operations
  bulkWrite(operations: { updateOne: { filter: any, update: any, upsert?: boolean } }[]) {
    const result = { insertedCount: 0, matchedCount: 0, modifiedCount: 0, deletedCount: 0, upsertedCount: 0 }

    for (const operation of operations) {
      const { updateOne } = operation

      if (!updateOne) {
        throw new Error(`[Demo] bulkWrite "${Object.keys(operation)[0]}" is not supported`)
      }

      const { matchedCount, modifiedCount, upsertedCount } = this.write(updateOne.filter, updateOne.update, { upsert: !!updateOne.upsert })
      result.matchedCount += matchedCount
      result.modifiedCount += modifiedCount
      result.upsertedCount += upsertedCount
    }

    return Promise.resolve(result)
  }

  aggregate(pipeline: any[]) {
    const first = pipeline[0]?.$match ? [{ $match: this.castFilter(pipeline[0].$match) }, ...pipeline.slice(1)] : pipeline
    return new Settled(clone(aggregate(this.docs, first)))
  }

  async paginate(filter: any = {}, options: any = {}) {
    const page = Number(options.page) || 1
    const paginated = options.pagination !== false
    const limit = paginated ? (Number(options.limit) || 10) : 0
    const total = this.count(filter)
    const docs = this.read(filter, options.select || options.projection, { sort: options.sort, skip: paginated ? (page - 1) * limit : 0, limit })
      .map((doc) => (options.lean && options.leanWithId !== false && doc._id ? { ...doc, id: `${doc._id}` } : doc))
    const pages = paginated ? Math.max(1, Math.ceil(total / limit)) : 1
    const labels = { docs: 'docs', totalDocs: 'totalDocs', totalPages: 'totalPages', ...options.customLabels }

    return {
      [labels.docs]: docs,
      [labels.totalDocs]: total,
      limit: paginated ? limit : total,
      page: paginated ? page : 1,
      [labels.totalPages]: pages,
      pagingCounter: paginated ? (page - 1) * limit + 1 : 1,
      hasPrevPage: paginated && page > 1,
      hasNextPage: paginated && page < pages,
      prevPage: paginated && page > 1 ? page - 1 : null,
      nextPage: paginated && page < pages ? page + 1 : null,
    }
  }

  watch(pipeline: any[] = []) {
    const listeners = new Map<string, Set<(payload?: any) => void>>()
    const emit = (event: string, payload?: any) => listeners.get(event)?.forEach((listener) => listener(payload))
    const watcher = { match: pipeline.find((stage) => stage.$match)?.$match, emit: (change: Change) => emit('change', change) }
    const on = (event: string, listener: (payload?: any) => void) => {
      listeners.set(event, new Set([...(listeners.get(event) || []), listener]))
      return stream
    }
    const off = (event: string, listener: (payload?: any) => void) => {
      listeners.get(event)?.delete(listener)
      return stream
    }
    const stream = {
      on,
      off,
      addListener: on,
      removeListener: off,
      close: () => {
        if (this.watchers.delete(watcher)) {
          emit('close')
        }
      },
    }

    this.watchers.add(watcher)
    return stream
  }

}

const normalizeProjection = (projection: any) => {
  if (!projection) {
    return undefined
  }

  const fields = typeof projection === 'string' ? projection.split(/\s+/).filter(Boolean) : Array.isArray(projection) ? projection : null

  if (!fields) {
    return Object.keys(projection).length ? projection : undefined
  }

  return Object.fromEntries(fields.map((field) => field.startsWith('-') ? [field.slice(1), 0] : [field, 1]))
}

const normalizeSort = (sort: any) => Object.fromEntries(Object.entries(typeof sort === 'string'
  ? Object.fromEntries(sort.split(/\s+/).filter(Boolean).map((field) => field.startsWith('-') ? [field.slice(1), -1] : [field, 1]))
  : sort).map(([key, value]) => [key, ['desc', 'descending', '-1', -1].includes(value as any) ? -1 : 1]))

export class Query implements PromiseLike<any> {
  private options: { sort?: any } = {}

  constructor(private readonly model: Model, private readonly filter: any, private readonly projection: any, private readonly one: boolean) {}

  sort(sort: any) {
    this.options.sort = sort
    return this
  }

  lean<T = any>() {
    return this as Query
  }

  exec() {
    return new Promise((resolve, reject) => setTimeout(() => {
      try {
        const docs = this.model.read(this.filter, this.projection, this.one ? { ...this.options, limit: 1 } : this.options)
        resolve(this.one ? (docs[0] ?? null) : docs)
      } catch (err) {
        reject(err)
      }
    }))
  }

  then<A = any, B = never>(resolve?: (value: any) => A | PromiseLike<A>, reject?: (reason: any) => B | PromiseLike<B>) {
    return this.exec().then(resolve, reject)
  }
}

class Settled implements PromiseLike<any> {
  constructor(private readonly value: any) {}

  lean() {
    return this
  }

  exec() {
    return Promise.resolve(this.value)
  }

  option() {
    return this
  }

  then<A = any, B = never>(resolve?: (value: any) => A | PromiseLike<A>, reject?: (reason: any) => B | PromiseLike<B>) {
    return this.exec().then(resolve, reject)
  }
}
