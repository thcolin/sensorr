import { Test } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { ConfigService } from '../config/config.service'
import { LogsService } from '../logs/logs.service'
import { SensorrService } from '../sensorr/sensorr.service'
import { Movie as MovieDocument } from './movie.schema'
import { MoviesService } from './movies.service'

jest.mock('@sensorr/tmdb', () => ({ fields: [] }))
jest.mock('../config/config.service', () => ({ ConfigService: class ConfigService {} }))
jest.mock('../logs/logs.service', () => ({ LogsService: class LogsService {} }))
jest.mock('../sensorr/sensorr.service', () => ({ SensorrService: class SensorrService {} }))
jest.mock('./movie.schema', () => ({ Movie: class Movie {} }))

describe('MoviesService.upsertMovies', () => {
  let docs: Map<number, any>
  let writes: any[]
  let service: MoviesService
  const sensorrService = { downloadRelease: jest.fn(), removeRelease: jest.fn() }
  const logsService = { ammendLog: jest.fn() }

  const proposal = (id: string, link = `https://indexer.org/${id}`) => ({ id, title: `Release ${id}`, from: 'record', job: 'job', proposal: true, link, enclosure: link })
  const releaseOf = (id: number, releaseId: string) => docs.get(id).releases.find(({ id }) => id === releaseId)
  const writeOf = (id: number) => writes.find(({ updateOne }) => `${updateOne.filter._id}` === `${id}`)?.updateOne.update

  const movieModel = {
    findById: (id, projection?) => ({
      lean: async () => {
        const doc = docs.get(Number(id))
        const match = projection?.releases?.$elemMatch
        return doc && JSON.parse(JSON.stringify(match ? { releases: doc.releases.filter(({ id }) => id === match.id) } : doc))
      },
    }),
    find: () => ({ lean: async () => [] }),
    updateOne: async (filter, update) => {
      if (update.$pull) {
        const doc = docs.get(Number(filter._id))
        const { id: releaseId, proposal } = update.$pull.releases
        const kept = doc.releases.filter(release => !(release.id === releaseId && release.proposal === proposal))
        const modifiedCount = doc.releases.length - kept.length
        doc.releases = kept
        return { modifiedCount }
      }

      const releaseId = filter.releases?.$elemMatch?.id ?? filter['releases.id']
      const release = docs.get(Number(filter._id))?.releases.find(({ id, proposal }) => id === releaseId && (!filter.releases || proposal === filter.releases.$elemMatch.proposal))

      if (!release) {
        return { modifiedCount: 0 }
      }

      release.proposal = update.$set['releases.$.proposal']
      return { modifiedCount: 1 }
    },
    bulkWrite: async (ops) => {
      writes.push(...ops)
      return { insertedCount: 0, modifiedCount: ops.length }
    },
  }

  beforeEach(async () => {
    docs = new Map([
      [1, { _id: 1, state: 'wished', releases: [proposal('a')] }],
      [2, { _id: 2, state: 'wished', releases: [proposal('b')] }],
    ])
    writes = []
    sensorrService.downloadRelease.mockReset()
    sensorrService.removeRelease.mockReset()
    logsService.ammendLog.mockReset()

    const module = await Test.createTestingModule({
      providers: [
        MoviesService,
        { provide: getModelToken(MovieDocument.name), useValue: movieModel },
        { provide: ConfigService, useValue: { config: { get: () => [] } } },
        { provide: SensorrService, useValue: sensorrService },
        { provide: LogsService, useValue: logsService },
      ],
    }).compile()

    service = module.get(MoviesService)
  })

  it('keeps going past a release that fails to download, and names its movie', async () => {
    sensorrService.downloadRelease.mockImplementation(async ({ id }) => {
      if (id === 'a') {
        throw new Error('Indexer answered 404 for "Release a"')
      }
    })

    const res = await service.upsertMovies({
      1: { id: 1, state: 'archived', releases: [{ ...proposal('a'), choice: true }] },
      2: { id: 2, state: 'archived', releases: [{ ...proposal('b'), choice: true }] },
    } as any)

    expect(res).toEqual({ upserted: 2, failed: [1] })
    expect(sensorrService.downloadRelease).toHaveBeenCalledTimes(2)
    expect(releaseOf(1, 'a').proposal).toBe(true)
    expect(writeOf(1)).toEqual({ _id: '1', id: 1, releases: [expect.objectContaining({ id: 'a', proposal: true })] })
    expect(writeOf(1).state).toBeUndefined()
    expect(writeOf(2)).toMatchObject({ state: 'archived', releases: [expect.not.objectContaining({ proposal: true })] })
    expect(logsService.ammendLog).toHaveBeenCalledTimes(1)
  })

  it('writes what an accepted release of the same movie brought, the failed one stays a proposal', async () => {
    docs.get(1).releases.push(proposal('c'))
    sensorrService.downloadRelease.mockImplementation(async ({ id }) => {
      if (id === 'c') {
        throw new Error('Indexer answered 404 for "Release c"')
      }
    })

    const res = await service.upsertMovies({ 1: { id: 1, state: 'archived', releases: [{ ...proposal('a'), choice: true }, { ...proposal('c'), choice: true }] } } as any)

    expect(res.failed).toEqual([1])
    expect(writeOf(1).state).toBe('archived')
    expect(writeOf(1).releases).toEqual([expect.not.objectContaining({ proposal: true }), expect.objectContaining({ id: 'c', proposal: true })])
  })

  it('does not create a movie whose only manual pick failed', async () => {
    sensorrService.downloadRelease.mockRejectedValue(new Error('Indexer answered 404'))

    const res = await service.upsertMovies({ 3: { id: 3, state: 'archived', releases: [{ ...proposal('m'), job: 'manual', choice: true }] } } as any)

    expect(res).toEqual({ upserted: 0, failed: [3] })
    expect(writes).toEqual([])
  })

  it('downloads and writes the release as the database holds it, not as the body sends it', async () => {
    await service.upsertMovies({ 1: { id: 1, releases: [{ ...proposal('a', 'https://elsewhere.org/a'), choice: true }] } } as any)

    expect(sensorrService.downloadRelease).toHaveBeenCalledWith(expect.objectContaining({ link: 'https://indexer.org/a', enclosure: 'https://indexer.org/a' }), 'cache', 'fs')
    expect(writeOf(1).releases).toEqual([expect.objectContaining({ link: 'https://indexer.org/a', enclosure: 'https://indexer.org/a' })])
  })

  it('acts on the movie its key names, whatever id the body carries', async () => {
    await service.upsertMovies({ 1: { id: 2, _id: 2, releases: [{ ...proposal('a'), choice: true }] } } as any)

    expect(releaseOf(1, 'a').proposal).toBe(false)
    expect(releaseOf(2, 'b').proposal).toBe(true)
    expect(writeOf(1)).toMatchObject({ _id: '1', id: 1 })
  })

  it('reserves a manual pick that names a stored proposal, as an acceptance', async () => {
    await service.upsertMovies({ 1: { id: 1, releases: [{ ...proposal('a', 'https://elsewhere.org/a'), job: 'manual', choice: true }] } } as any)

    expect(sensorrService.downloadRelease).toHaveBeenCalledWith(expect.objectContaining({ link: 'https://indexer.org/a', job: 'job' }), 'cache', 'fs')
    expect(writeOf(1).releases).toHaveLength(1)
  })

  it('leaves the metafile to an acceptance that reserved the release first', async () => {
    const answered = { 1: { id: 1, releases: [{ ...proposal('a'), choice: false }] } } as any
    const findById = movieModel.findById
    // The refusal reads the movie before the acceptance reserves it
    movieModel.findById = (id, projection?) => projection ? findById(id, projection) : { lean: async () => { const doc = await findById(id).lean(); releaseOf(1, 'a').proposal = false; return doc } }

    try {
      await service.upsertMovies(answered)
    } finally {
      movieModel.findById = findById
    }

    expect(sensorrService.removeRelease).not.toHaveBeenCalled()
    expect(writeOf(1).releases).toEqual([expect.objectContaining({ id: 'a' })])
  })

  it('deletes no metafile for a refused manual pick', async () => {
    await service.upsertMovies({ 1: { id: 1, releases: [proposal('a'), { ...proposal('m', 'https://indexer.org/a'), job: 'manual', choice: false }] } } as any)

    expect(sensorrService.removeRelease).not.toHaveBeenCalled()
  })

  it('pulls a refused proposal before its metafile', async () => {
    await service.upsertMovies({ 1: { id: 1, releases: [{ ...proposal('a'), choice: false }] } } as any)

    expect(docs.get(1).releases).toEqual([])
    expect(sensorrService.removeRelease).toHaveBeenCalledWith(expect.objectContaining({ link: 'https://indexer.org/a' }))
    expect(writeOf(1).releases).toEqual([])
  })

  it('leaves a release already answered elsewhere as the database holds it', async () => {
    releaseOf(1, 'a').proposal = false

    await service.upsertMovies({ 1: { id: 1, releases: [{ ...proposal('a'), choice: false }] } } as any)

    expect(sensorrService.removeRelease).not.toHaveBeenCalled()
    expect(writeOf(1).releases).toEqual([expect.objectContaining({ id: 'a' })])
  })
})
