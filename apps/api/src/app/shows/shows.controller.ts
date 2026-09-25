import { Body, Controller, Get, Query, Post, Patch, Sse, Delete, Param, ParseIntPipe } from '@nestjs/common'
import { Observable } from 'rxjs'
import { ShowsService } from './shows.service'
import { ShowDTO, ShowReleaseDTO } from './show.dto'

@Controller('shows')
export class ShowsController {
  constructor(private readonly showsService: ShowsService) {}

  @Post()
  async upsertShows(@Body() changes: { [key: string]: ShowDTO }) {
    return this.showsService.upsertShows(changes)
  }

  @Delete()
  async deleteShows(@Body() changes: { [key: string]: ShowDTO }) {
    return this.showsService.deleteShows(changes)
  }

  @Get()
  async getShows(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('sort_by') sort_by = 'refreshed_at.desc',
    @Query() query,
  ): Promise<unknown> {
    return this.showsService.getShows({ ...query, sort_by }, page, Number(limit))
  }

  @Get('metadata')
  async getMetadata(
    @Query('page') page = 1,
  ): Promise<unknown> {
    return this.showsService.getMetadata(page)
  }

  @Sse('changes')
  sse(): Observable<MessageEvent> {
    return this.showsService.listenMetadata()
  }

  @Get(':id')
  async getShow(@Param('id', ParseIntPipe) id: number): Promise<unknown> {
    return this.showsService.getShow(id)
  }

  @Post(':id/releases')
  async pushRelease(@Param('id', ParseIntPipe) id: number, @Body() release: ShowReleaseDTO) {
    return this.showsService.pushRelease(id, release)
  }

  @Patch(':id/releases')
  async updateRelease(@Param('id', ParseIntPipe) id: number, @Body() { id: release, ...fields }: ShowReleaseDTO) {
    return this.showsService.updateRelease(id, release, fields)
  }

  @Get(':id/episodes')
  async getShowEpisodes(@Param('id', ParseIntPipe) id: number): Promise<unknown> {
    return this.showsService.getShowEpisodes(id)
  }
}
