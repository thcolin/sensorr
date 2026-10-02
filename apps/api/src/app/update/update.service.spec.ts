import { Test } from '@nestjs/testing'
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common'
import { SensorrService } from '../sensorr/sensorr.service'
import { UpdateService } from './update.service'

jest.mock('../sensorr/sensorr.service', () => ({ SensorrService: class {} }))
jest.mock('./update', () => ({
  ...jest.requireActual('./update'),
  versionOn: async (tag: string) => ({ version: tag === 'dev' ? 'dev' : null, revision: tag === 'dev' ? '00459262b2ee61622d0a10ae14a411759bf9d186' : null }),
}))

describe('UpdateService', () => {
  const serviceOf = async (running: string[]) => {
    const module = await Test.createTestingModule({
      providers: [UpdateService, { provide: SensorrService, useValue: { runningJobs: () => running } }],
    }).compile()

    return module.get(UpdateService)
  }

  it('refuses an update while a job runs, recreating sensorr-api would kill it', async () => {
    const service = await serviceOf(['record movies'])
    await expect(service.update('beta')).rejects.toThrow(ConflictException)
    await expect(service.update('beta')).rejects.toThrow('Sensorr job "record movies" is running')
  })

  it('refuses a channel it has no tag for, the prototype included', async () => {
    const service = await serviceOf([])
    await expect(service.update('nightly' as any)).rejects.toThrow(BadRequestException)
    await expect(service.update('constructor' as any)).rejects.toThrow(BadRequestException)
  })

  it('offers the dev channel with its revision', async () => {
    const service = await serviceOf([])
    await expect(service.status()).resolves.toMatchObject({
      channels: { dev: { version: 'dev', revision: '00459262b2ee61622d0a10ae14a411759bf9d186' }, beta: { version: null }, stable: { version: null } },
    })
  })

  it('no longer refuses dev, nor an instance on dev, and goes on to look for sensorr-updater', async () => {
    const service = await serviceOf([])
    await expect(service.update('dev')).rejects.toThrow(NotFoundException)
    process.env.NX_SENSORR_TAG = 'dev'
    await expect(service.update('beta')).rejects.toThrow(NotFoundException)
    delete process.env.NX_SENSORR_TAG
  })
})
