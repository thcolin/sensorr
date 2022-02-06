import { Body, Controller, Get, Query, Post, Sse, HttpException, HttpStatus } from '@nestjs/common'
import { Observable } from 'rxjs'
import { MoviesService } from './movies.service'
import { MovieDTO } from './movie.dto'

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  async upsertMovie(@Body() movie: MovieDTO) {
    return this.moviesService.upsertMovie(movie)
  }

  @Get()
  async getMovies(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('sort_by') sort_by = 'updated_at.desc',
    @Query() query,
  ): Promise<{}> {
    return this.moviesService.getMovies({ ...query, sort_by }, page, limit)
  }

  @Get('metadata')
  async getMetadata(): Promise<{}> {
    return this.moviesService.getMetadata()
  }

  @Get('statistics')
  async getStatistics(): Promise<{}> {
    return this.moviesService.getStatistics()
  }

  @Sse('changes')
  sse(): Observable<MessageEvent> {
    return this.moviesService.listenMetadata()
  }
}
