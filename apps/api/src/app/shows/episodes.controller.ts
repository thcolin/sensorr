import { Body, Controller, Get, Patch, Query, Post } from '@nestjs/common'
import { ShowsService } from './shows.service'
import { EpisodeDTO } from './episode.dto'

@Controller('episodes')
export class EpisodesController {
  constructor(private readonly showsService: ShowsService) {}

  @Post()
  async upsertEpisodes(@Body() changes: { [key: string]: EpisodeDTO }) {
    return this.showsService.upsertEpisodes(changes)
  }

  @Patch('release')
  async moveEpisodesRelease(@Body() { ids, from, to }: { ids: number[], from: string | null, to: string | null }) {
    return this.showsService.moveEpisodesRelease(ids, from, to)
  }

  @Get()
  async getEpisodes(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('sort_by') sort_by = 'air_date.asc',
    @Query() query,
  ): Promise<unknown> {
    return this.showsService.getEpisodes({ ...query, sort_by }, page, Number(limit))
  }
}
