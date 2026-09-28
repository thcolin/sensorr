import { BadRequestException, Body, Controller, Delete, Get, HttpException, Logger, NotFoundException, Param, Post, Query, Res } from '@nestjs/common'
import { Response } from 'express'
import { PlexService } from './plex.service'
import { imageRequestOf, fallbackOf } from './image'
import { artworkChoicesOf, ratingKeyOf } from './artworks'

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

  @Get('artworks/:ratingKey')
  async candidates(@Param('ratingKey') raw: string) {
    const ratingKey = ratingKeyOf(raw)

    if (!ratingKey) {
      throw new BadRequestException('Not a Plex item')
    }

    try {
      return await this.plexService.candidates(ratingKey)
    } catch (err) {
      this.logger.warn(`Candidates "${ratingKey}", ${err.message}`)
      throw new HttpException(err.message, 502)
    }
  }

  @Post('artworks/:ratingKey')
  async write(@Param('ratingKey') raw: string, @Body() body: unknown) {
    const ratingKey = ratingKeyOf(raw)
    const choices = artworkChoicesOf(body)

    if (!ratingKey || !choices) {
      throw new BadRequestException('Nothing to write on a Plex item')
    }

    try {
      return await this.plexService.write(ratingKey, choices)
    } catch (err) {
      this.logger.warn(`Write "${ratingKey}", ${err.message}`)
      throw new HttpException(err.message, 502)
    }
  }
}
