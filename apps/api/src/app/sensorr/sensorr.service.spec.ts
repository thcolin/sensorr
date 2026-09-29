import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'
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

  describe('downloadRelease of a magnet link', () => {
    const enclosure = 'magnet:?xt=urn:btih:ED0DA850C273E3E15A819BDCBBF418BC85107EC8&dn=Dune+(2021)+%5B1080p%5D+%5BWEBRip%5D'
    const release = { title: 'Dune (2021) [1080p] [WEBRip]', znab: 'TPB', link: 'https://thepiratebay.org/description.php?id=53190554', enclosure } as any
    let blackhole, metafiles

    const serviceOf = async (magnet) => {
      const metafileModel = {
        exists: jest.fn(async ({ _id }) => metafiles.has(_id)),
        findById: jest.fn(async (_id) => ({ buffer: metafiles.get(_id) })),
        findByIdAndUpdate: jest.fn(async (_id, { buffer }) => metafiles.set(_id, buffer)),
        deleteOne: jest.fn(async ({ _id }) => metafiles.delete(_id)),
      }
      const config = { get: (key) => ({ blackhole, 'shows.blackhole': blackhole, magnet })[key] }

      const module = await Test.createTestingModule({
        providers: [
          SensorrService,
          { provide: getModelToken(MetafileDocument.name), useValue: metafileModel },
          { provide: ConfigService, useValue: { config } },
        ],
      }).compile()

      return module.get(SensorrService)
    }

    beforeEach(async () => {
      blackhole = await fs.mkdtemp(path.join(os.tmpdir(), 'blackhole-'))
      metafiles = new Map()
    })

    afterEach(() => fs.rm(blackhole, { recursive: true }))

    it('writes the link to a .magnet file', async () => {
      await (await serviceOf(true)).downloadRelease(release, 'enclosure', 'fs')
      expect(await fs.readdir(blackhole)).toEqual(['Dune (2021) [1080p] [WEBRip]-TPB.magnet'])
      expect(await fs.readFile(path.join(blackhole, 'Dune (2021) [1080p] [WEBRip]-TPB.magnet'), 'utf8')).toBe(`${enclosure}\n`)
    })

    it('writes a proposed link once it is accepted', async () => {
      const service = await serviceOf(true)
      await service.downloadRelease(release, 'enclosure', 'cache')
      expect(await fs.readdir(blackhole)).toEqual([])
      await service.downloadRelease(release, 'cache', 'fs')
      expect(await fs.readFile(path.join(blackhole, 'Dune (2021) [1080p] [WEBRip]-TPB.magnet'), 'utf8')).toBe(`${enclosure}\n`)
      expect(metafiles.size).toBe(0)
    })

    it('refuses it when magnet links are off, or for a show', async () => {
      await expect((await serviceOf(false)).downloadRelease(release, 'enclosure', 'fs')).rejects.toThrow('turned off')
      await expect((await serviceOf(true)).downloadRelease(release, 'enclosure', 'fs', 'show')).rejects.toThrow('a show needs a .torrent')
      expect(await fs.readdir(blackhole)).toEqual([])
    })
  })
})
