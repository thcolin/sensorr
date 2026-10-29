import { Test } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { SchedulerRegistry } from '@nestjs/schedule'
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter'
import { Subject } from 'rxjs'
import { JOBS } from '@sensorr/sensorr'
import { Log as LogDocument } from '../logs/log.schema'
import { LogsService } from '../logs/logs.service'
import { ConfigService } from '../config/config.service'
import { SensorrService } from '../sensorr/sensorr.service'
import { JobsService } from './jobs.service'

jest.mock('../config/config.service', () => ({ ConfigService: class ConfigService {} }))
jest.mock('../logs/log.schema', () => ({ Log: class Log {} }))
jest.mock('../logs/logs.service', () => ({ LogsService: class LogsService {} }))
jest.mock('../sensorr/sensorr.service', () => ({ SensorrService: class SensorrService {} }))

describe('JobsService.setupCrons', () => {
  let jobs: any
  const get = (key: string) => key.split('.').reduce((acc, part) => acc[part], { jobs })

  let service: JobsService
  let registry: SchedulerRegistry
  let events: EventEmitter2
  const crons = () => Object.fromEntries([...registry.getCronJobs()].map(([name, job]) => [name, job.cronTime.source]))

  beforeEach(async () => {
    jobs = Object.fromEntries(Object.entries(JOBS).map(([command, types]) => [
      command,
      types.length ? Object.fromEntries(types.map(type => [type, { cron: '0 17 * * *', paused: true }])) : { cron: '0 17 * * *', paused: true },
    ]))

    const module = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [
        JobsService,
        SchedulerRegistry,
        { provide: getModelToken(LogDocument.name), useValue: {} },
        { provide: SensorrService, useValue: { exits: new Subject() } },
        { provide: ConfigService, useValue: { config: { get } } },
        { provide: LogsService, useValue: {} },
      ],
    }).compile()

    await module.createNestApplication().init()
    service = module.get(JobsService)
    registry = module.get(SchedulerRegistry)
    events = module.get(EventEmitter2)
  })

  afterEach(() => registry.getCronJobs().forEach(job => job.stop()))

  it('schedules the jobs that are not paused', () => {
    jobs.record.movies.paused = false
    jobs['keep-in-touch'].paused = false
    service.setupCrons()

    expect(crons()).toEqual({ 'record movies': '0 17 * * *', 'keep-in-touch': '0 17 * * *' })
  })

  it('applies a pause, a resume and a new cron on a config write, and keeps the crons that did not change', () => {
    jobs.record.movies.paused = false
    jobs.sync.shows.paused = false
    service.setupCrons()
    const untouched = registry.getCronJob('sync shows')

    jobs.record.movies.paused = true
    jobs.record.shows.paused = false
    jobs.airing.shows.paused = false
    events.emit('config.write')
    expect(crons()).toEqual({ 'record shows': '0 17 * * *', 'sync shows': '0 17 * * *', 'airing shows': '0 17 * * *' })
    expect(registry.getCronJob('sync shows')).toBe(untouched)

    jobs.sync.shows.cron = '*/5 * * * *'
    events.emit('config.write')
    expect(crons()['sync shows']).toBe('*/5 * * * *')
    expect(registry.getCronJob('sync shows')).not.toBe(untouched)
    expect(untouched.isActive).toBe(false)
  })
})

describe('JobsService.listenJobs', () => {
  const at = (minutes: number) => new Date(Date.UTC(2026, 9, 1, 10, minutes))
  const logs = [
    { timestamp: at(0), message: 'Start', meta: { job: 'a', summary: { total: 3, treated: 0 } } },
    { timestamp: at(1), message: 'Start', meta: { job: 'b', summary: { treated: 1 }, type: 'movies' } },
    { timestamp: at(5), message: 'Searching', meta: { job: 'a', summary: { treated: 2 } } },
    { timestamp: at(6), meta: { job: 'a', summary: { accepted: 1 } } },
    { timestamp: at(9), message: 'Done', meta: { job: 'a', summary: true, done: true } },
  ]

  let service: JobsService
  let changes: Subject<any>

  beforeEach(async () => {
    changes = new Subject()
    const module = await Test.createTestingModule({
      providers: [
        JobsService,
        SchedulerRegistry,
        { provide: getModelToken(LogDocument.name), useValue: { find: () => ({ lean: () => ({ exec: () => Promise.resolve(logs) }) }) } },
        { provide: SensorrService, useValue: { exits: new Subject() } },
        { provide: ConfigService, useValue: {} },
        { provide: LogsService, useValue: { changes$: changes } },
      ],
    }).compile()

    service = module.get(JobsService)
  })

  it('emits every job folded from its summary logs, then the job a new summary log updates', async () => {
    const messages = []
    const subscription = service.listenJobs().subscribe(message => messages.push(message.data))
    await new Promise(resolve => setImmediate(resolve))

    expect(Object.keys(messages[0])).toEqual(['a', 'b'])
    expect(messages[0]).toEqual({
      a: {
        job: 'a',
        timestamp: at(9),
        start: at(0).getTime(),
        end: at(9).getTime(),
        messages: ['Start', 'Searching', 'Done'],
        meta: { done: true, summary: { total: 3, treated: 2, accepted: 1 } },
      },
      b: {
        job: 'b',
        timestamp: at(1),
        start: at(1).getTime(),
        end: at(1).getTime(),
        messages: ['Start'],
        meta: { type: 'movies', summary: { treated: 1 } },
      },
    })

    changes.next({ ns: { coll: 'log' }, operationType: 'insert', fullDocument: { timestamp: at(2), message: 'Ignored', meta: { job: 'b' } } })
    changes.next({ ns: { coll: 'log' }, operationType: 'insert', fullDocument: { timestamp: at(3), message: 'Searching', meta: { job: 'b', summary: { treated: 2 } } } })
    subscription.unsubscribe()

    expect(messages).toHaveLength(2)
    expect(messages[1]).toEqual({
      job: 'b',
      timestamp: at(3),
      start: at(1).getTime(),
      end: at(3).getTime(),
      messages: ['Start', 'Searching'],
      meta: { type: 'movies', summary: { treated: 3 } },
    })
  })
})
