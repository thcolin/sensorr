import { BadRequestException, Body, Controller, Delete, Get, HttpException, Logger, NotFoundException, Param, Post, Query, Res } from '@nestjs/common'
import { Response } from 'express'
import { PlexService } from './plex.service'
import { imageRequestOf, fallbackOf } from './image'

@Controller('plex')
export class PlexController {
  private readonly logger = new Logger(PlexController.name)

  constructor(private readonly plexService: PlexService) {}

  @Post()
  register(@Body() raw): Promise<{ code: string, id: string }> {
    return this.plexService.register(raw.url)
  }

  @Delete()
  async reset(): Promise<{}> {
    try {
      await this.plexService.reset()
      return { success: true }
    } catch (err) {
      this.logger.error(err)
      throw new HttpException(err, 500)
    }
  }

  @Get(':id/status')
  status(@Param('id') id): Promise<{ done: boolean, token?: string, expired?: boolean, error?: string }> {
    return this.plexService.checkStatus(id)
  }

  @Get('image')
  async image(@Query() query: Record<string, unknown>, @Res() res: Response) {
    const request = imageRequestOf(query)

    if (!request) {
      throw new BadRequestException('Not a Plex artwork path')
    }

    const image = await this.plexService.image(request).catch((err) => {
      this.logger.warn(`Image "${request.path}", ${err.message}`)
      return null
    })

    if (!image) {
      const fallback = fallbackOf(request)

      if (!fallback) {
        throw new NotFoundException()
      }

      res.set('Cache-Control', 'no-store')
      return res.redirect(302, fallback)
    }

    // The path changes with the artwork: a stored copy never goes stale
    res.set({ 'Content-Type': image.type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, max-age=31536000, immutable' })
    res.send(image.buffer)
  }
}
