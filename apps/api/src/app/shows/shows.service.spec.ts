import { Test } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { ConfigService } from '../config/config.service'
import { LogsService } from '../logs/logs.service'
import { SensorrService } from '../sensorr/sensorr.service'
import { Show as ShowDocument } from './show.schema'
import { Episode as EpisodeDocument } from './episode.schema'
import { ShowsService } from './shows.service'

jest.mock('@sensorr/tmdb', () => ({ fields: [] }))
jest.mock('../config/config.service', () => ({ ConfigService: class ConfigService {} }))
jest.mock('../logs/logs.service', () => ({ LogsService: class LogsService {} }))
jest.mock('../sensorr/sensorr.service', () => ({ SensorrService: class SensorrService {} }))
jest.mock('./show.schema', () => ({ Show: class Show {} }))
jest.mock('./episode.schema', () => ({ Episode: class Episode {} }))

describe('ShowsService.upsertShows', () => {
  let docs: Map<number, any>
  let service: ShowsService
  const sensorrService = { downloadRelease: jest.fn() }
  const logsService = { ammendLog: jest.fn() }

  const proposal = (id: string) => ({ id, title: `Release ${id}`, job: 'job', proposal: true, link: `https://indexer.org/${id}` })
  const releaseOf = (id: number, releaseId: string) => docs.get(id).releases.find(({ id }) => id === releaseId)

  const showModel = {
    findOne: ({ _id }, projection) => ({
      lean: async () => {
        const doc = docs.get(_id)
        return doc && { releases: doc.releases.filter(({ id }) => id === projection.releases.$elemMatch.id).map(release => ({ ...release })) }
      },
    }),
    updateOne: async (filter, update) => {
      const releaseId = filter.releases?.$elemMatch?.id ?? filter['releases.id']
      const release = docs.get(filter._id)?.releases.find(({ id, proposal }) => id === releaseId && (!filter.releases || proposal === filter.releases.$elemMatch.proposal))

      if (!release) {
        return { modifiedCount: 0 }
      }

      Object.entries(update.$set).forEach(([path, value]) => { release[path.replace('releases.$.', '')] = value })
      return { modifiedCount: 1 }
    },
    bulkWrite: async (ops) => ({ insertedCount: 0, modifiedCount: ops.length, upsertedCount: 0 }),
  }

  beforeEach(async () => {
    docs = new Map([
      [1, { _id: 1, releases: [proposal('a')] }],
      [2, { _id: 2, releases: [proposal('b')] }],
    ])
    sensorrService.downloadRelease.mockReset()
    logsService.ammendLog.mockReset()

    const module = await Test.createTestingModule({
      providers: [
        ShowsService,
        { provide: getModelToken(ShowDocument.name), useValue: showModel },
        { provide: getModelToken(EpisodeDocument.name), useValue: {} },
        { provide: ConfigService, useValue: { config: { get: () => [] } } },
        { provide: SensorrService, useValue: sensorrService },
        { provide: LogsService, useValue: logsService },
      ],
    }).compile()

    service = module.get(ShowsService)
  })

  it('keeps going past a release that fails to download, and names its show', async () => {
    sensorrService.downloadRelease.mockImplementation(async ({ id }) => {
      if (id === 'a') {
        throw new Error('Indexer answered 404 for "Release a"')
      }
    })

    const res = await service.upsertShows({
      1: { id: 1, releases: [{ ...proposal('a'), choice: true }] },
      2: { id: 2, releases: [{ ...proposal('b'), choice: true }] },
    } as any)

    expect(res).toEqual({ upserted: 2, failed: [1] })
    expect(releaseOf(1, 'a').proposal).toBe(true)
    expect(releaseOf(2, 'b')).toMatchObject({ proposal: false, accepted_at: expect.any(Number) })
    expect(logsService.ammendLog).toHaveBeenCalledTimes(1)
  })
})

describe('ShowsService.listenMetadata', () => {
  it('reads a burst of changes back in one query, a deleted show as null', async () => {
    const EventEmitter = (await import('events')).EventEmitter
    const stream = Object.assign(new EventEmitter(), { close: jest.fn() })
    const find = jest.fn((filter) => ({ lean: () => ({ exec: async () => filter._id.$in.filter((id) => id !== 3).map((_id) => ({ _id, name: `Show ${_id}` })) }) }))
    const module = await Test.createTestingModule({
      providers: [
        ShowsService,
        { provide: getModelToken(ShowDocument.name), useValue: { watch: () => stream, find } },
        { provide: getModelToken(EpisodeDocument.name), useValue: {} },
        { provide: ConfigService, useValue: {} },
        { provide: LogsService, useValue: {} },
        { provide: SensorrService, useValue: {} },
      ],
    }).compile()

    const messages = []
    const subscription = module.get(ShowsService).listenMetadata().subscribe((message) => messages.push(message))
    ;[1, 2, 1, 3].forEach((_id) => stream.emit('change', { documentKey: { _id } }))
    await new Promise((resolve) => setTimeout(resolve, 400))
    subscription.unsubscribe()

    expect(find).toHaveBeenCalledTimes(1)
    expect(find.mock.calls[0][0]).toEqual({ _id: { $in: [1, 2, 3] } })
    expect(messages).toEqual([{ data: { 1: { _id: 1, name: 'Show 1' }, 2: { _id: 2, name: 'Show 2' }, 3: null } }])
  })
})
