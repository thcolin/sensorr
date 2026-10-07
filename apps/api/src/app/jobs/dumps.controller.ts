import fs from 'fs/promises'
import { createReadStream } from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'
import { BadRequestException, Controller, Get, Logger, NotFoundException, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { InjectConnection } from '@nestjs/mongoose'
import { Connection } from 'mongoose'
import type { Response } from 'express'
import unzipper from 'unzipper'
import { DUMP_COLLECTIONS, DUMP_FILE, DUMP_FOLDER } from '@sensorr/sensorr'
import { SensorrService, manifestOf } from '../sensorr/sensorr.service'
import { coded } from '../errors'

// The CLI the API spawns writes in the same working directory
const FOLDER = path.resolve(DUMP_FOLDER)

@Controller('dumps')
export class DumpsController {
  private readonly logger = new Logger(DumpsController.name)

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly sensorrService: SensorrService,
  ) {}

  // Only a name the dump job writes: nothing else in the folder, nothing outside it
  private fileOf(name: string) {
    if (!DUMP_FILE.test(name)) {
      throw new NotFoundException(coded('dump.unknown', `No dump "${name}"`, { name }))
    }

    return path.join(FOLDER, name)
  }

  @Get()
  async list() {
    this.logger.log('List')
    const names = await fs.readdir(FOLDER).catch(() => [])
    const dumps = await Promise.all(names.filter((name) => DUMP_FILE.test(name)).sort().reverse().map(async (name) => {
      const { size, mtime } = await fs.stat(path.join(FOLDER, name))
      const manifest = await manifestOf(unzipper.Open.file(path.join(FOLDER, name))).catch(() => null)
      return { name, size, date: mtime.toISOString(), manifest }
    }))
    const counts = Object.fromEntries(await Promise.all(DUMP_COLLECTIONS.map(async (name) => [name, await this.connection.db.collection(name).estimatedDocumentCount()])))

    return { dumps, counts }
  }

  @Get(':name')
  async download(@Param('name') name: string, @Res() res: Response) {
    const file = this.fileOf(name)
    const { size } = await fs.stat(file).catch(() => {
      throw new NotFoundException(coded('dump.unknown', `No dump "${name}"`, { name }))
    })

    this.logger.log(`Download "${name}"`)
    res.set({ 'Content-Type': 'application/zip', 'Content-Length': `${size}`, 'Content-Disposition': `attachment; filename="${name}"`, 'X-Content-Type-Options': 'nosniff' })
    pipeline(createReadStream(file), res).catch((err) => {
      // Headers are sent: the client sees a cut download, the API stays up
      this.logger.error(`Download "${name}" failed, ${err.message}`)
    })
  }

  // What a dump picked on this device holds, before the import replaces anything with it
  @Post('preview')
  @UseInterceptors(FileInterceptor('archive', { limits: { fileSize: 200 * 1024 * 1024, files: 1 } }))
  async preview(@UploadedFile() archive) {
    if (!archive?.buffer) {
      throw new BadRequestException(coded('dump.archive', 'No archive, send the dump as the "archive" field'))
    }

    return manifestOf(unzipper.Open.buffer(archive.buffer))
  }

  @Post(':name/restore')
  async restore(@Param('name') name: string) {
    const buffer = await fs.readFile(this.fileOf(name)).catch(() => {
      throw new NotFoundException(coded('dump.unknown', `No dump "${name}"`, { name }))
    })

    this.logger.log(`Restore "${name}"`)
    return { success: true, job: await this.sensorrService.runRestore(buffer) }
  }
}
