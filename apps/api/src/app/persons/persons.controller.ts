import { Body, Controller, Get, Query, Post } from '@nestjs/common'
import { PersonsService } from './persons.service'
import { PersonDTO } from './person.dto'

@Controller('persons')
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  @Post()
  async upsertPerson(@Body() person: PersonDTO) {
    return this.personsService.upsertPerson(person)
  }

  @Get()
  async getPersons(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('sort_by') sort_by = 'updated_at.desc',
    @Query() query,
  ): Promise<{}> {
    return this.personsService.getPersons({ ...query, sort_by }, page, limit)
  }

  @Get('metadata')
  async getMetadata(
    @Query('page') page = 1,
  ): Promise<{}> {
    return this.personsService.getMetadata(page)
  }

  @Get('statistics')
  async getStatistics(): Promise<{}> {
    return this.personsService.getStatistics()
  }
}
