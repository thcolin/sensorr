import { Test } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { SchedulerRegistry } from '@nestjs/schedule'
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
  const crons = () => Object.fromEntries([...registry.getCronJobs()].map(([name, job]) => [name, job.cronTime.source]))

  beforeEach(async () => {
    jobs = Object.fromEntries(Object.entries(JOBS).map(([command, types]) => [
      command,
      types.length ? Object.fromEntries(types.map(type => [type, { cron: '0 17 * * *', paused: true }])) : { cron: '0 17 * * *', paused: true },
    ]))

    const module = await Test.createTestingModule({
      providers: [
        JobsService,
        SchedulerRegistry,
        { provide: getModelToken(LogDocument.name), useValue: {} },
        { provide: SensorrService, useValue: { exits: new Subject() } },
        { provide: ConfigService, useValue: { config: { get } } },
        { provide: LogsService, useValue: {} },
      ],
    }).compile()

    service = module.get(JobsService)
    registry = module.get(SchedulerRegistry)
  })

  afterEach(() => registry.getCronJobs().forEach(job => job.stop()))

  it('schedules the jobs that are not paused', () => {
    jobs.record.movies.paused = false
    jobs['keep-in-touch'].paused = false
    service.setupCrons()

    expect(crons()).toEqual({ 'record movies': '0 17 * * *', 'keep-in-touch': '0 17 * * *' })
  })

  it('applies a pause, a resume and a new cron without a restart, and keeps the crons that did not change', () => {
    jobs.record.movies.paused = false
    jobs.sync.shows.paused = false
    service.setupCrons()
    const untouched = registry.getCronJob('sync shows')

    jobs.record.movies.paused = true
    jobs.record.shows.paused = false
    jobs.sync.shows.cron = '0 17 * * *'
    jobs.airing.shows.paused = false
    service.setupCrons()
    expect(crons()).toEqual({ 'record shows': '0 17 * * *', 'sync shows': '0 17 * * *', 'airing shows': '0 17 * * *' })
    expect(registry.getCronJob('sync shows')).toBe(untouched)

    jobs.sync.shows.cron = '*/5 * * * *'
    service.setupCrons()
    expect(crons()['sync shows']).toBe('*/5 * * * *')
    expect(registry.getCronJob('sync shows')).not.toBe(untouched)
    expect(untouched.running).toBe(false)
  })
})
