import { Test } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { ConfigService } from '../config/config.service'
import { Metafile as MetafileDocument } from './metafile.schema'
import { SensorrService } from './sensorr.service'

describe('SensorrService', () => {
  it('should remove cached release by _id', async () => {
    const metafileModel = { deleteOne: jest.fn() }

    const module = await Test.createTestingModule({
      providers: [
        SensorrService,
        { provide: getModelToken(MetafileDocument.name), useValue: metafileModel },
        { provide: ConfigService, useValue: {} },
      ],
    }).compile()

    await module.get(SensorrService).removeRelease({ link: 'abc' } as any)
    expect(metafileModel.deleteOne).toHaveBeenCalledWith({ _id: 'abc' })
  })
})
