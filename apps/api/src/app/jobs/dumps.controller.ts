import fs from 'fs/promises'
import { createReadStream } from 'fs'
import path from 'path'
import { Controller, Get, Logger, NotFoundException, Param, Res } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { Connection } from 'mongoose'
import type { Response } from 'express'
import { DUMP_COLLECTIONS, DUMP_FILE, DUMP_FOLDER } from '@sensorr/sensorr'

// The CLI the API spawns writes in the same working directory
const FOLDER = path.resolve(DUMP_FOLDER)

@Controller('dumps')
export class DumpsController {
  private readonly logger = new Logger(DumpsController.name)

  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  async list() {
    this.logger.log('List')
    const names = await fs.readdir(FOLDER).catch(() => [])
    const dumps = await Promise.all(names.filter((name) => DUMP_FILE.test(name)).sort().reverse().map(async (name) => {
      const { size, mtime } = await fs.stat(path.join(FOLDER, name))
      return { name, size, date: mtime.toISOString() }
    }))
    const counts = Object.fromEntries(await Promise.all(DUMP_COLLECTIONS.map(async (name) => [name, await this.connection.db.collection(name).estimatedDocumentCount()])))

    return { dumps, counts }
  }

  // Only a name the dump job writes: nothing else in the folder, nothing outside it
  @Get(':name')
  async download(@Param('name') name: string, @Res() res: Response) {
    if (!DUMP_FILE.test(name)) {
      throw new NotFoundException(`No dump "${name}"`)
    }

    const file = path.join(FOLDER, name)
    const { size } = await fs.stat(file).catch(() => {
      throw new NotFoundException(`No dump "${name}"`)
    })

    this.logger.log(`Download "${name}"`)
    res.set({ 'Content-Type': 'application/zip', 'Content-Length': `${size}`, 'Content-Disposition': `attachment; filename="${name}"`, 'X-Content-Type-Options': 'nosniff' })
    createReadStream(file).pipe(res)
  }
}
