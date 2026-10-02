import { Test } from '@nestjs/testing'
import { ConflictException, BadRequestException } from '@nestjs/common'
import { SensorrService } from '../sensorr/sensorr.service'
import { UpdateService } from './update.service'

jest.mock('../sensorr/sensorr.service', () => ({ SensorrService: class {} }))

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

  it('refuses a channel it has no tag for, dev included', async () => {
    const service = await serviceOf([])
    await expect(service.update('dev')).rejects.toThrow(BadRequestException)
  })
})
